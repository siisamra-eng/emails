import { getAuditedTopCampaigns, performanceCopyRules, performancePatterns } from "@/lib/campaigns";
import type { CampaignPerformance } from "@/lib/campaigns";
import { isAuthenticated } from "@/lib/auth";

const model = process.env.OPENAI_MODEL || "gpt-6-astra";

const ideaSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ideas"],
  properties: {
    ideas: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "angleKey", "angle", "subject", "preheader", "body", "cta", "performanceRationale"],
        properties: {
          title: { type: "string" },
          angleKey: { type: "string", enum: ["launch-offer", "trade-in", "early-access", "seasonal", "product-proof"] },
          angle: { type: "string" },
          subject: { type: "string" },
          preheader: { type: "string" },
          body: { type: "string" },
          cta: { type: "string" },
          performanceRationale: { type: "string" },
        },
      },
    },
  },
};

type GenerateRequest = {
  focus?: string;
  product?: { id?: string; title?: string; price?: number | null; url?: string } | null;
  verifiedOffer?: string;
  verifiedFacts?: string;
  recentCampaignNames?: string[];
  campaignPerformance?: CampaignPerformance[];
};

type KlaviyoMessage = {
  attributes?: {
    definition?: {
      content?: {
        subject?: string;
        preview_text?: string;
        body?: string;
      };
    };
  };
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function htmlToText(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|tr|td|table|section|article|br)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

async function fetchWinningCreativeExamples(apiKey: string, campaigns: Array<{ rank: number; id: string; name: string }>) {
  const byRevenue = [...campaigns].sort((a, b) => a.rank - b.rank).slice(0, 3);
  const byEfficiency = [...campaigns]
    .filter((campaign) => campaign.id)
    .sort((a, b) => (b as CampaignPerformance).revenue / Math.max((b as CampaignPerformance).delivered, 1) - (a as CampaignPerformance).revenue / Math.max((a as CampaignPerformance).delivered, 1))
    .slice(0, 3);
  const byClickRate = [...campaigns]
    .filter((campaign) => campaign.id)
    .sort((a, b) => (b as CampaignPerformance).clickRate - (a as CampaignPerformance).clickRate)
    .slice(0, 3);
  const selected = [...new Map([...byRevenue, ...byEfficiency, ...byClickRate].filter((item) => item.id).map((item) => [item.id, item])).values()];
  const examples: Array<{ rank: number; campaign: string; subject: string; preheader: string; copyExcerpt: string }> = [];

  for (let offset = 0; offset < selected.length; offset += 3) {
    const batch = selected.slice(offset, offset + 3);
    const results = await Promise.all(batch.map(async (campaign) => {
      const query = new URLSearchParams();
      query.set("fields[campaign-message]", "id,definition.content.subject,definition.content.preview_text,definition.content.body");
      const response = await fetch(`https://a.klaviyo.com/api/campaigns/${encodeURIComponent(campaign.id)}/campaign-messages?${query}`, {
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          Accept: "application/vnd.api+json",
          revision: "2026-07-15",
        },
        next: { revalidate: 3600 },
      });
      if (!response.ok) return null;
      const payload = await response.json() as { data?: KlaviyoMessage[] };
      const message = payload.data?.[0]?.attributes?.definition?.content;
      if (!message?.body) return null;
      return {
        rank: campaign.rank,
        campaign: campaign.name,
        subject: cleanText(message.subject, 180),
        preheader: cleanText(message.preview_text, 180),
        copyExcerpt: htmlToText(message.body).slice(0, 2200),
      };
    }));
    examples.push(...results.filter((item): item is NonNullable<typeof item> => Boolean(item)));
  }
  return examples;
}

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return Response.json({ error: "Sign in to generate email copy." }, { status: 401 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OpenAI isn't connected yet. Add OPENAI_API_KEY to your local environment or Vercel project settings." }, { status: 503 });
  }

  let body: GenerateRequest;
  try {
    body = await request.json() as GenerateRequest;
  } catch {
    return Response.json({ error: "The generation request wasn't valid JSON." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "The generation request must be a JSON object." }, { status: 400 });
  }

  const focus = cleanText(body.focus, 80) || "Performance-led mix";
  const productTitle = cleanText(body.product?.title, 160) || "Carbinox products";
  const productPrice = typeof body.product?.price === "number" && Number.isFinite(body.product.price)
    ? body.product.price
    : null;
  const verifiedOffer = cleanText(body.verifiedOffer, 240);
  const verifiedFacts = cleanText(body.verifiedFacts, 1200);
  const recentCampaignNames = Array.isArray(body.recentCampaignNames)
    ? body.recentCampaignNames.slice(0, 30).map((name) => cleanText(name, 180)).filter(Boolean)
    : [];
  const auditedTopCampaigns = await getAuditedTopCampaigns();

  const livePerformance = Array.isArray(body.campaignPerformance)
    ? body.campaignPerformance.filter((campaign) => typeof campaign === "object" && campaign !== null).slice(0, 100).map((campaign) => ({
      rank: campaign.rank,
      id: cleanText(campaign.id, 80),
      name: cleanText(campaign.name, 180),
      revenue: Number.isFinite(campaign.revenue) ? campaign.revenue : 0,
      delivered: Number.isFinite(campaign.delivered) ? campaign.delivered : 0,
      uniqueClicks: Number.isFinite(campaign.uniqueClicks) ? campaign.uniqueClicks : 0,
      clickRate: Number.isFinite(campaign.clickRate) ? campaign.clickRate : 0,
      conversions: Number.isFinite(campaign.conversions) ? campaign.conversions : 0,
      revenuePerRecipient: campaign.delivered > 0 && Number.isFinite(campaign.revenue) ? campaign.revenue / campaign.delivered : 0,
    }))
    : [];
  const performanceData = livePerformance.length ? livePerformance : auditedTopCampaigns.map((campaign) => ({
    rank: campaign.rank,
    id: campaign.id,
    name: campaign.name,
    revenue: campaign.revenue,
    delivered: campaign.delivered,
    uniqueClicks: campaign.uniqueClicks,
    revenuePerRecipient: campaign.delivered ? campaign.revenue / campaign.delivered : 0,
    clickRate: campaign.clickRate,
    conversions: campaign.conversions,
  }));
  const uniquePerformance = new Map(performanceData.map((campaign) => [campaign.name, campaign]));
  const bestByRevenue = [...uniquePerformance.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const bestByRevenuePerRecipient = [...uniquePerformance.values()].filter((campaign) => campaign.delivered >= 1000).sort((a, b) => b.revenuePerRecipient - a.revenuePerRecipient).slice(0, 5);
  const bestByClickRate = [...uniquePerformance.values()].filter((campaign) => campaign.delivered >= 1000).sort((a, b) => b.clickRate - a.clickRate).slice(0, 5);
  let winningCreativeExamples: Array<{ rank: number; campaign: string; subject: string; preheader: string; copyExcerpt: string }> = [];
  if (process.env.KLAVIYO_PRIVATE_API_KEY) {
    try {
      winningCreativeExamples = await fetchWinningCreativeExamples(process.env.KLAVIYO_PRIVATE_API_KEY, performanceData);
    } catch {
      winningCreativeExamples = [];
    }
  }

  const instructions = [
    "You are Carbinox's performance-led email strategist. Create three distinct campaign concepts and complete short email copy.",
    "Treat the user-provided product and verified details as facts; treat campaign history and performance observations as evidence, not causal proof.",
    "Use the performance rules and winner data provided. Prioritize revenue per recipient and click rate alongside absolute revenue so large-audience campaigns do not dominate every decision.",
    "Use Carbinox's plain-spoken, practical, casual confidence. Write short blocks, address the reader directly, and provide one clear CTA.",
    "Never invent an offer, discount, price reduction, stock count, deadline, guarantee, testimonial, review count, product specification, or social-proof number. Exact facts may be used only if present in verifiedOffer or verifiedFacts. The listed product price is current catalog price, not a discount.",
    "If no verified offer or facts are supplied, generate editorial/product-value copy without urgency or numeric claims.",
    "Use three different historically evidenced angles when focus is Performance-led mix. If a specific focus is selected, satisfy it while varying the creative treatment.",
    "When recent campaign names are present, use them to avoid repeating watch models/offers that have already been sent. Campaign naming is imperfect, so infer cautiously. When that list is empty, do not claim that an offer was recently sent or that the app knows all recent sends. Avoid making three near-clones.",
    "The body should be email-ready plain text with readable paragraph breaks and a concise sign-off. Do not include a fabricated sender identity.",
    "Return exactly three concepts that follow the supplied JSON schema.",
  ].join(" ");

  const input = {
    focus,
    product: { title: productTitle, currentCatalogPrice: productPrice, url: cleanText(body.product?.url, 400) },
    verifiedOffer: verifiedOffer || "None supplied",
    verifiedFacts: verifiedFacts || "None supplied",
    recentCampaignNames,
    performanceRules: performanceCopyRules,
    performancePatterns,
    performanceLeaders: {
      byAttributedRevenue: bestByRevenue,
      byRevenuePerRecipient: bestByRevenuePerRecipient,
      byClickRate: bestByClickRate,
    },
    winningCreativeExamples,
    auditedSetCaveat: "50 emails selected from 678 sent-email rows by Shopify Placed Order attributed revenue over the last two years; send size and related campaign clones affect the ranking. No causal claims are established.",
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions,
        input: JSON.stringify(input),
        text: { format: { type: "json_schema", name: "carbinox_email_ideas", strict: true, schema: ideaSchema } },
        max_output_tokens: 3000,
      }),
      cache: "no-store",
    });

    const result = await response.json() as {
      output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      return Response.json({ error: result.error?.message || `OpenAI returned ${response.status}. Check the API key and model setting.` }, { status: 502 });
    }

    const text = result.output?.flatMap((item) => item.content ?? []).find((part) => part.type === "output_text")?.text;
    if (!text) return Response.json({ error: "OpenAI returned no usable email ideas." }, { status: 502 });

    let ideas: unknown;
    try { ideas = JSON.parse(text); } catch { return Response.json({ error: "OpenAI returned an unreadable idea response." }, { status: 502 }); }
    return Response.json({ ideas, model, source: "performance-history" });
  } catch {
    return Response.json({ error: "Couldn't reach OpenAI. Try again in a moment." }, { status: 502 });
  }
}

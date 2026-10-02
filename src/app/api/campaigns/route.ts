import { getAuditedTopCampaigns, type CampaignPerformance } from "@/lib/campaigns";
import { isAuthenticated } from "@/lib/auth";

const klaviyoRevision = "2026-07-15";
const defaultConversionMetricId = "XWF6d4";
const dayMs = 24 * 60 * 60 * 1000;
const performanceCacheTtlMs = 5 * 60 * 1000;

type KlaviyoReportRow = {
  groupings?: {
    campaign_id?: string;
    campaign_message_id?: string;
    campaign_message_name?: string;
    send_channel?: string;
  };
  statistics?: Record<string, number | null>;
};

let cachedPerformance: { expiresAt: number; campaigns: CampaignPerformance[] } | null = null;
let performanceRequest: Promise<CampaignPerformance[]> | null = null;

type KlaviyoCampaign = {
  id: string;
  attributes?: {
    name?: string;
    status?: string;
    scheduled_at?: string | null;
    send_time?: string | null;
  };
};

async function fetchRecentSends(apiKey: string) {
  const url = new URL("https://a.klaviyo.com/api/campaigns");
  url.searchParams.set("filter", "equals(messages.channel,'email')");
  url.searchParams.set("sort", "-scheduled_at");
  url.searchParams.set("page[size]", "100");
  url.searchParams.set("fields[campaign]", "name,status,scheduled_at,send_time");

  const response = await fetch(url, {
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      Accept: "application/vnd.api+json",
      revision: klaviyoRevision,
    },
    cache: "no-store",
  });
  const payload = await response.json() as { errors?: Array<{ detail?: string }>; data?: KlaviyoCampaign[] };
  if (!response.ok) throw new Error(getErrorMessage(payload) || `Klaviyo returned ${response.status} for the recent send list.`);

  return (payload.data ?? [])
    .filter((campaign) => campaign.attributes?.status === "Sent")
    .map((campaign) => ({
      id: campaign.id,
      name: campaign.attributes?.name || campaign.id,
      sentAt: campaign.attributes?.scheduled_at || campaign.attributes?.send_time || "",
    }))
    .slice(0, 100);
}

function getErrorMessage(body: unknown) {
  if (typeof body === "object" && body !== null && "errors" in body) {
    const errors = (body as { errors?: Array<{ detail?: string }> }).errors;
    return errors?.[0]?.detail;
  }
  return undefined;
}

async function fetchReportWindow(apiKey: string, start: string, end: string): Promise<KlaviyoReportRow[]> {
  const response = await fetch("https://a.klaviyo.com/api/campaign-values-reports/", {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      revision: klaviyoRevision,
    },
    body: JSON.stringify({
      data: {
        type: "campaign-values-report",
        attributes: {
          timeframe: { start, end },
          conversion_metric_id: process.env.KLAVIYO_CONVERSION_METRIC_ID || defaultConversionMetricId,
          filter: 'equals(send_channel,"email")',
          statistics: ["conversion_value", "delivered", "clicks_unique", "click_rate", "conversions", "revenue_per_recipient"],
          group_by: ["campaign_message_id", "campaign_id", "campaign_message_name", "send_channel"],
        },
      },
    }),
    cache: "no-store",
  });

  const payload = await response.json() as {
    errors?: Array<{ detail?: string }>;
    data?: { attributes?: { results?: KlaviyoReportRow[] } };
  };

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) || `Klaviyo returned ${response.status}. Check the read-only API key and scopes.`);
  }

  const results = payload.data?.attributes?.results;
  if (!Array.isArray(results)) throw new Error("Klaviyo returned an unexpected campaign report.");
  return results;
}

async function fetchLivePerformance(apiKey: string): Promise<CampaignPerformance[]> {
  if (cachedPerformance && cachedPerformance.expiresAt > Date.now()) return cachedPerformance.campaigns;
  if (performanceRequest) return performanceRequest;

  performanceRequest = (async () => {
    const now = Date.now();
    const twoYearsAgo = new Date(now - 730 * dayMs).toISOString();
    const oneYearAgo = new Date(now - 365 * dayMs).toISOString();
    const end = new Date(now).toISOString();
    const firstYear = await fetchReportWindow(apiKey, twoYearsAgo, oneYearAgo);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const secondYear = await fetchReportWindow(apiKey, oneYearAgo, end);
    const uniqueRows = new Map<string, KlaviyoReportRow>();
    for (const row of [...firstYear, ...secondYear]) {
      const key = `${row.groupings?.send_channel || ""}:${row.groupings?.campaign_message_id || row.groupings?.campaign_id || ""}`;
      uniqueRows.set(key, row);
    }

    const campaigns = [...uniqueRows.values()]
      .filter((row) => row.groupings?.send_channel === "email")
      .map((row) => ({
        id: row.groupings?.campaign_id || row.groupings?.campaign_message_id || "",
        name: row.groupings?.campaign_message_name || row.groupings?.campaign_id || "Email campaign",
        sentAt: "Last 2 years",
        revenue: Number(row.statistics?.conversion_value || 0),
        delivered: Number(row.statistics?.delivered || 0),
        uniqueClicks: Number(row.statistics?.clicks_unique || 0),
        clickRate: Number(row.statistics?.click_rate || 0),
        conversions: Number(row.statistics?.conversions || 0),
        rank: 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 100)
      .map((campaign, index) => ({ ...campaign, rank: index + 1 }));
    cachedPerformance = { expiresAt: Date.now() + performanceCacheTtlMs, campaigns };
    return campaigns;
  })();

  try {
    return await performanceRequest;
  } finally {
    performanceRequest = null;
  }
}

export async function GET(request: Request) {
  const authorized = await isAuthenticated(request);
  if (!authorized) return Response.json({ error: "Sign in to view campaign performance." }, { status: 401 });
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  const auditedTopCampaigns = await getAuditedTopCampaigns();

  if (!apiKey) {
    return Response.json({
      connected: false,
      source: "audited-top-50",
      campaigns: auditedTopCampaigns,
      recentCampaigns: [],
      message: auditedTopCampaigns.length
        ? "Showing the local read-only two-year audit. Add a Klaviyo private API key for live performance."
        : "Add a Klaviyo private API key to load campaign performance. The private local audit is not present in this deployment.",
    });
  }

  try {
    const campaigns = await fetchLivePerformance(apiKey);
    let recentCampaigns: Awaited<ReturnType<typeof fetchRecentSends>> = [];
    let recentError = "";
    try {
      recentCampaigns = await fetchRecentSends(apiKey);
    } catch (error) {
      recentError = error instanceof Error ? error.message : "Recent Klaviyo sends could not be loaded.";
    }
    return Response.json({
      connected: true,
      source: "klaviyo-live",
      campaigns,
      recentCampaigns,
      message: recentError
        ? `Live performance loaded. Recent offer rotation is unavailable: ${recentError}`
        : `Live Klaviyo email performance · last 2 years · checking ${recentCampaigns.length} recent sends for offer rotation.`,
    });
  } catch (error) {
    return Response.json({
      connected: false,
      source: "audited-top-50",
      campaigns: auditedTopCampaigns,
      recentCampaigns: [],
      message: error instanceof Error ? error.message : "Couldn't load Klaviyo campaign performance.",
    });
  }
}

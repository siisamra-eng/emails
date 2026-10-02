import { readFile } from "node:fs/promises";
import path from "node:path";

export type CampaignPerformance = {
  rank: number;
  id: string;
  name: string;
  sentAt: string;
  revenue: number;
  delivered: number;
  uniqueClicks: number;
  clickRate: number;
  conversions: number;
};

export async function getAuditedTopCampaigns(): Promise<CampaignPerformance[]> {
  try {
    const source = await readFile(path.join(process.cwd(), "private-data", "top-campaigns.json"), "utf8");
    const parsed = JSON.parse(source) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is CampaignPerformance => typeof row === "object" && row !== null
      && typeof (row as CampaignPerformance).rank === "number"
      && typeof (row as CampaignPerformance).id === "string"
      && typeof (row as CampaignPerformance).name === "string");
  } catch {
    return [];
  }
}

export const performanceCopyRules = [
  "Use plain-spoken, casual, confident language centered on practical usefulness and hard-wearing product value.",
  "Make one product, offer, or story the focus. Lead with one clear hook, use short copy blocks, and make the offer easy to understand.",
  "Rotate performance-backed angles: product utility, trade-in value, early access, seasonal bundles, founder notes, and last-call offers.",
  "Subject lines in the winner set use conversational curiosity, specific product or offer details, and deadline-led framing. Preheaders often add context; intentionally blank is also valid.",
  "Do not invent discounts, stock counts, deadlines, guarantees, reviews, or social-proof numbers. Use only details explicitly supplied as verified facts.",
  "Use one dominant, direct CTA. Avoid vague filler such as an unspecified ‘spectacular offer’.",
];

export const performancePatterns = [
  {
    key: "launch-offer",
    label: "Launch and offer",
    ranks: [1, 2, 3, 4, 5, 6],
    observation: "The six highest-revenue sends are clustered around Carbinox Edge launches, relaunches, and specific Black Friday offers.",
  },
  {
    key: "trade-in",
    label: "Trade-in value",
    ranks: [7, 8, 14, 15, 20],
    observation: "Trade-in announcements and reminders recur among the higher-revenue sends, with a clear old-watch value proposition.",
  },
  {
    key: "early-access",
    label: "Early access and milestones",
    ranks: [18, 26, 30, 35, 38, 44],
    observation: "Anniversary and early-access messages recur in the top 50.",
  },
  {
    key: "seasonal",
    label: "Seasonal value",
    ranks: [21, 25, 29, 33, 36, 37],
    observation: "Seasonal promotions and gift/bundle value also appear among the higher-revenue sends.",
  },
];

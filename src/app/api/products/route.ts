import type { CatalogCategory, CatalogProduct } from "@/lib/products";

type ShopifyVariant = { price?: string | number; available?: boolean };
type ShopifyProduct = {
  id: number | string;
  title?: string;
  handle?: string;
  product_type?: string;
  tags?: string[];
  published_at?: string | null;
  variants?: ShopifyVariant[];
};
type ShopifyCatalogResponse = { products?: ShopifyProduct[] };

const catalogUrl = "https://shopcarbinox.com/products.json?limit=250";
const hiddenTags = new Set(["__hidden", "hidden", "hide", "nocart", "not-on-sale", "no"]);
const categoryOrder: Record<CatalogCategory, number> = {
  Watches: 0,
  "Watch accessories": 1,
  "Gear & bundles": 2,
};

function getCategory(product: ShopifyProduct): CatalogCategory {
  const productType = (product.product_type ?? "").toLowerCase();
  const title = (product.title ?? "").toLowerCase();
  const tags = (product.tags ?? []).map((tag) => tag.toLowerCase());
  const watchAccessory = /band|strap|charger|cable|tempered|glass|protector|accessor/.test(`${productType} ${title}`)
    || tags.some((tag) => tag === "22mm_band" || tag === "tempered_cable");

  if (watchAccessory) return "Watch accessories";
  if (/^smart\s?watch$/.test(productType) || /\bsmart\s?watch(es)?\b/.test(title) || tags.includes("smart watch")) return "Watches";
  return "Gear & bundles";
}

function isPublicProduct(product: ShopifyProduct) {
  const tags = (product.tags ?? []).map((tag) => tag.trim().toLowerCase());
  return Boolean(product.published_at && product.title && product.handle)
    && !tags.some((tag) => hiddenTags.has(tag));
}

function lowestPrice(variants: ShopifyVariant[]) {
  const availableVariants = variants.filter((variant) => variant.available);
  const candidates = (availableVariants.length ? availableVariants : variants)
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price) && price >= 0);
  return candidates.length ? Math.min(...candidates) : null;
}

function toCatalogProduct(product: ShopifyProduct): CatalogProduct {
  const variants = product.variants ?? [];
  return {
    id: String(product.id),
    title: product.title!,
    handle: product.handle!,
    category: getCategory(product),
    price: lowestPrice(variants),
    available: variants.some((variant) => variant.available),
    url: `https://shopcarbinox.com/products/${encodeURIComponent(product.handle!)}`,
  };
}

export const revalidate = 3600;

export async function GET() {
  try {
    const response = await fetch(catalogUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return Response.json({ error: "Carbinox's product catalog is temporarily unavailable." }, { status: 502 });
    }

    const feed = await response.json() as ShopifyCatalogResponse;
    if (!Array.isArray(feed.products)) {
      return Response.json({ error: "Carbinox returned an unexpected product catalog response." }, { status: 502 });
    }

    const products = feed.products
      .filter(isPublicProduct)
      .map(toCatalogProduct)
      .sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category] || a.title.localeCompare(b.title));

    return Response.json({ products, refreshedAt: new Date().toISOString() });
  } catch {
    return Response.json({ error: "Couldn't reach Carbinox's product catalog. Try again in a moment." }, { status: 502 });
  }
}

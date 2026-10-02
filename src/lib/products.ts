export type CatalogCategory = "Watches" | "Watch accessories" | "Gear & bundles";

export type CatalogProduct = {
  id: string;
  title: string;
  handle: string;
  category: CatalogCategory;
  price: number | null;
  available: boolean;
  url: string;
};

export type CatalogResponse = {
  products: CatalogProduct[];
  refreshedAt: string;
};

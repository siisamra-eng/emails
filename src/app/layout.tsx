import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carbinox | Newsletter Studio",
  description: "Plan sharper Carbinox newsletters, grounded in what has worked before.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

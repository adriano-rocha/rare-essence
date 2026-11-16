import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./store/cart-provider";
import { getSiteUrl } from "@/shared/infra/site-url";

const isIndexable = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl ?? undefined,
  title: {
    default: "Rare Essence | Haute Parfumerie",
    template: "%s | Rare Essence",
  },
  description: "Fragrâncias autorais e exclusivas de alta perfumaria.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Rare Essence",
    title: "Rare Essence | Haute Parfumerie",
    description: "Fragrâncias autorais e exclusivas de alta perfumaria.",
    images: [{ url: "/banner.png", width: 1952, height: 768, alt: "Rare Essence Haute Parfumerie" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rare Essence | Haute Parfumerie",
    description: "Fragrâncias autorais e exclusivas de alta perfumaria.",
    images: ["/banner.png"],
  },
  robots: { index: isIndexable, follow: isIndexable },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-brand-bg text-brand-text antialiased selection:bg-brand-accent selection:text-white">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
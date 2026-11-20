import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./store/cart-provider";
import { getSiteUrl } from "@/shared/infra/site-url";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html className={`${cormorant.variable} ${jakarta.variable}`} lang="pt-BR">
      <body className="bg-brand-bg font-sans text-brand-text antialiased selection:bg-brand-accent selection:text-brand-bg">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
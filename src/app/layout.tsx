import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rare Essence | Haute Parfumerie",
  description: "Fragrâncias raras e exclusivas de alta perfumaria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-brand-bg text-brand-text antialiased selection:bg-brand-accent selection:text-white">
        {children}
      </body>
    </html>
  );
}
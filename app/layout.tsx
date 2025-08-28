import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { CartProvider } from "@/hooks/use-cart";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Direto da Terra - Mercado de Desperdício de Alimentos",
  description:
    "Conecte-se com produtores locais e reduza o desperdício de alimentos na sua comunidade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} ${GeistMono.variable}`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

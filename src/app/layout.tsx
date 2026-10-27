import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter es la tipografía de Preciar (definida por UX/UI en el issue #26 y en el Figma).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Preciar — Costos y precios claros",
  description: "Costos, precios y punto de equilibrio para emprendimientos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

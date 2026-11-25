import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { DESCRIPCION_SITIO, NOMBRE_SITIO, URL_SITIO } from "@/lib/sitio";

// Inter es la tipografía de Preciar (definida por UX/UI en el issue #26 y en el Figma).
// Se sirve desde el paquete local para que el build no dependa de Google Fonts.
const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: "Preciar — Costos y precios claros",
  description: DESCRIPCION_SITIO,
  applicationName: NOMBRE_SITIO,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: NOMBRE_SITIO,
    title: "Preciar — Costos y precios claros",
    description: DESCRIPCION_SITIO,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Preciar — Costos y precios claros", description: DESCRIPCION_SITIO },
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

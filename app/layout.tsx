import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeNoFlashScript } from "@/components/theme/theme-provider";
import { AuroraBackground } from "@/components/aurora-background";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JM Farmacia — Sistema de gestión",
  description:
    "Demo premium de gestión para farmacia. Inventario, ventas y reportes en una experiencia con alma.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#070f0d" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeNoFlashScript }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuroraBackground />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

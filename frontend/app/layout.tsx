import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { SiteSchema } from "@/features/seo/components/site-schema";
import { AppProviders } from "@/providers/app-providers";

// UI_UX_DESIGN_SYSTEM.md §5 — Inter, with the system stack as fallback.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Site-wide metadata defaults. Every page overrides `title` through the
 * template and supplies its own canonical — MASTER_PROJECT_SPEC.md §56/§59.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables belong on <html>: the base layer applies `font-sans` to
    // <html>, so defining them on <body> leaves the variable undefined where it
    // is actually consumed and the page silently falls back to serif.
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a
          href="#main-content"
          className="sr-only rounded-md bg-background px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>

        {/* Header and footer live in the (public) layout — the admin portal
            must not inherit them. */}
        <AppProviders>
          {children}
          <Toaster position="top-right" richColors />
        </AppProviders>

        {/* Organization + WebSite, referenced by @id from every page schema. */}
        <SiteSchema />
      </body>
    </html>
  );
}

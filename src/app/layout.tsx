import type { Metadata, Viewport } from "next";
import { inter } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { DesktopSmoothScroll } from "@/components/DesktopSmoothScroll";
import ClarityProvider from "@/components/analytics/ClarityProvider";


export const viewport: Viewport = {
  themeColor: "#080B14",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cloutflow.co"),
  title: "CloutFlow | Premium Social Media Growth",
  description: "Accelerate your social media presence with premium growth services.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CloutFlow | Premium Social Media Growth",
    description: "Accelerate your social media presence with premium growth services.",
    url: "https://cloutflow.co",
    siteName: "CloutFlow",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "CloutFlow",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className={`${inter.className} font-sans antialiased bg-background text-foreground min-h-screen selection:bg-primary/30 selection:text-primary-foreground`}>
        <ClarityProvider />
        <DesktopSmoothScroll />
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}

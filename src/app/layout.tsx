import type { Metadata, Viewport } from "next";
import { inter } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const viewport: Viewport = {
  themeColor: "#080B14",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "CloutFlow | Premium Social Media Growth",
  description: "Accelerate your social media presence with premium growth services.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CloutFlow",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/cloutflow-logo.png", // Using the available logo as a fallback
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
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}

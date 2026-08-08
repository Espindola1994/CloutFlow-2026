import type { Metadata } from "next";
import { inter } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Instahub | Premium Social Media Growth",
  description: "Accelerate your social media presence with premium growth services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-black text-white min-h-screen selection:bg-primary/30 selection:text-primary-foreground`}>
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}

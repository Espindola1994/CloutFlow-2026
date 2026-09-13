import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CloutFlow Admin",
  description: "Private administration app.",
  manifest: "/admin/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CloutFlow Admin",
    statusBarStyle: "black-translucent",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

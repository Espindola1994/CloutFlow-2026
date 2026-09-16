import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CloutFlow | Premium Offer 25%',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'CloutFlow | Premium Offer 25%',
  },
};

export default function OfferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


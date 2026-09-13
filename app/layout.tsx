import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Kunddan Home Foods Admin',
  description: 'Admin dashboard for Kunddan Home Foods.',
  openGraph: {
    title: 'Kunddan Home Foods Admin',
    description: 'Admin dashboard for Kunddan Home Foods.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kunddan Home Foods Admin',
    description: 'Admin dashboard for Kunddan Home Foods.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

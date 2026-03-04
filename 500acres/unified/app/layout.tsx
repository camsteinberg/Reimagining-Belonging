import type { Metadata } from 'next';
import { EB_Garamond, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const ebGaramond = EB_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '500 Acres — Reimagining Belonging',
  description: 'Building community in nature. Helping Gen Z solve the housing crisis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${ebGaramond.variable} ${inter.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

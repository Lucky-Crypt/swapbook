import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Swapbook',
  description: 'Peer-to-Peer Token Swap Orderbook on Stellar Soroban',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background min-h-screen font-sans antialiased text-white">
        {children}
      </body>
    </html>
  );
}

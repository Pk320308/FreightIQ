import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FreightIQ — AI-Powered Maritime Freight Intelligence',
  description:
    'AI-Powered Maritime Freight Intelligence & Charter Optimization Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: "try { var theme = localStorage.getItem('freightiq-theme'); if (theme === 'light') document.documentElement.classList.remove('dark'); } catch (error) {}",
          }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

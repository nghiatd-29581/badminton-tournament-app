// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Trophy } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Giải Cầu Lông Nội Bộ',
  description: 'Real-time Badminton Tournament Manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-background min-h-screen`}>
        {/* Header chung */}
        <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Trophy className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold">Cầu Lông Nội Bộ</h1>
                <p className="text-sm opacity-90">Real-time Tournament</p>
              </div>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="hover:underline">Trang chủ</Link>
              <Link href="/admin" className="hover:underline">Admin</Link>
              <Link href="/referee" className="hover:underline">Trọng tài</Link>
              <Link href="/live" className="hover:underline font-semibold">Xem trực tiếp</Link>
            </nav>
          </div>
        </header>

        {/* Nội dung chính */}
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-6 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p>© 2025 - Dev By Nghĩa, Trần Đắc</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
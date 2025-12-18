// app/page.tsx
import Link from 'next/link';
import { Trophy, Shield, Users, Radio } from 'lucide-react';
import HeroSection from '@/components/HeroSection';

export default async function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 relative overflow-hidden">
      {/* Background pattern nhẹ */}
      <div className="absolute inset-0 bg-black opacity-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Hero Section */}
        <HeroSection />

        {/* Quick Action Buttons */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Admin Button */}
          <Link href="/admin">
            <div className="group bg-white/20 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-white/30">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-500/40 transition">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Quản trị</h3>
              <p className="text-white/80 text-sm">Tạo giải đấu, quản lý lịch thi đấu</p>
            </div>
          </Link>

          {/* Referee Button */}
          <Link href="/referee">
            <div className="group bg-white/20 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-white/30">
              <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-yellow-500/40 transition">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Trọng tài</h3>
              <p className="text-white/80 text-sm">Nhập điểm, điều khiển trận đấu</p>
            </div>
          </Link>

          {/* Live Dashboard Button */}
          <Link href="/live">
            <div className="group bg-white/20 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-white/30">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-500/40 transition animate-pulse">
                <Radio className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Xem trực tiếp</h3>
              <p className="text-white/80 text-sm">Tỷ số real-time & bảng xếp hạng</p>
            </div>
          </Link>
        </div>

        {/* Footer note */}
        <div className="mt-16 text-center text-white/70 text-sm">
          <p>Giải cầu lông nội bộ • Real-time • Dễ sử dụng</p>
        </div>
      </div>
    </main>
  );
}
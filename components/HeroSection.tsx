// components/HeroSection.tsx
import { Trophy } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="text-center mb-12">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full backdrop-blur-md mb-6">
        <Trophy className="w-14 h-14 text-white" />
      </div>
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
        Giải Cầu Lông Nội Bộ
      </h1>
      <p className="text-xl md:text-2xl text-white/90 font-medium">
        Real-time management for internal leagues
      </p>
    </div>
  );
}
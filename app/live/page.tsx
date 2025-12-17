// app/live/page.tsx
'use client';

import LiveMatch from '@/components/LiveMatch';
import StandingsTable from '@/components/StandingsTable';
import { Radio, Trophy } from 'lucide-react';

export default function LivePage() {
  return (
    <div className="space-y-16 pb-10">
  {/* Tiêu đề trang */}
  <div className="text-center">
    <p className="text-2xl text-gray-600">Real-time từ tất cả các sân</p>
  </div>

  {/* Các trận đang diễn ra */}
  <section>
    <LiveMatch />
  </section>

  {/* Bảng xếp hạng */}
  <section>
    <StandingsTable />
  </section>
</div>
  );
}
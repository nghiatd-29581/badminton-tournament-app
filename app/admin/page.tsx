// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import AdminForm from '@/components/AdminForm';
import MatchList from '@/components/MatchList';
import { supabase } from '@/lib/supabase';
import { Trophy } from 'lucide-react';

export default function AdminPage() {
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch giải đấu mới nhất khi load trang
  useEffect(() => {
    const fetchLatestTournament = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setTournamentId(data.id);
      }
      setLoading(false);
    };

    fetchLatestTournament();
  }, []);

  if (loading) {
    return <p className="text-center text-xl">Đang tải...</p>;
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-primary mb-4">Admin Dashboard</h1>
        <p className="text-xl text-gray-600">Quản lý toàn diện giải đấu cầu lông nội bộ</p>
      </div>

      {/* Form tạo giải mới */}
      <section className="bg-card rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="flex items-center mb-6">
          <Trophy className="w-10 h-10 text-accent mr-3" />
          <h2 className="text-3xl font-bold">Tạo giải đấu mới</h2>
        </div>
        <AdminForm onCreate={(id) => setTournamentId(id)} />
      </section>

      {/* Nếu đã có giải đấu → hiển thị quản lý */}
      {tournamentId && (
        <section className="bg-card rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <span className="mr-3">⚔️</span> Quản lý trận đấu hiện tại
          </h2>
          <MatchList tournamentId={tournamentId} mode="admin" />
        </section>
      )}

      {!tournamentId && !loading && (
        <p className="text-center text-gray-500 text-lg">
          Chưa có giải đấu nào. Hãy tạo giải đấu mới ở trên!
        </p>
      )}
    </div>
  );
}
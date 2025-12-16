// components/MatchList.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  status: string;
  score_team1?: number;
  score_team2?: number;
}

interface Props {
  tournamentId?: string;  // Optional nếu cần fetch latest
  mode: 'admin' | 'referee';
  onSelect?: (match: Match) => void;
}

export default function MatchList({ tournamentId: propTournamentId, mode, onSelect }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Nếu không truyền tournamentId → fetch latest tournament
    const fetchTournamentId = async () => {
      if (propTournamentId) {
        setTournamentId(propTournamentId);
        return propTournamentId;
      }

      const { data } = await supabase
        .from('tournaments')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const id = data?.id || null;
      setTournamentId(id);
      return id;
    };

    // components/MatchList.tsx - Chỉ sửa phần loadMatches

const loadMatches = async () => {
  const tid = await fetchTournamentId();
  if (!tid) {
    setLoading(false);
    return;
  }

  // Bước 1: Fetch matches đơn giản (không nested)
  let query = supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tid);

  if (mode === 'referee') {
    query = query.eq('status', 'pending');
  }

  const { data: matchesData, error: matchesError } = await query;

  console.log('Matches raw data:', matchesData);
  console.log('Matches error:', matchesError);

  if (matchesError || !matchesData) {
    console.error('Không fetch được matches:', matchesError);
    setMatches([]);
    setLoading(false);
    return;
  }

  if (matchesData.length === 0) {
    setMatches([]);
    setLoading(false);
    return;
  }

  // Bước 2: Lấy tất cả team_id duy nhất
  const teamIds = [...new Set([
    ...matchesData.map(m => m.team1_id),
    ...matchesData.map(m => m.team2_id)
  ])].filter(Boolean);

  // Bước 3: Fetch tên teams
  const { data: teamsData, error: teamsError } = await supabase
    .from('teams')
    .select('id, name')
    .in('id', teamIds);

  console.log('Teams data:', teamsData);
  console.log('Teams error:', teamsError);

  if (teamsError) {
    console.error('Lỗi fetch teams:', teamsError);
  }

  // Tạo map id → name
  const teamMap = {};
  teamsData?.forEach(t => teamMap[t.id] = t.name);

  // Bước 4: Gán tên đội vào matches
  const enrichedMatches = matchesData.map(m => ({
    ...m,
    team1: { id: m.team1_id, name: teamMap[m.team1_id] || 'Đội không rõ' },
    team2: { id: m.team2_id, name: teamMap[m.team2_id] || 'Đội không rõ' },
  }));

  setMatches(enrichedMatches);
  setLoading(false);
};
    loadMatches();

    // Real-time subscription
    if (tournamentId) {
      const channel = supabase
        .channel('matches_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `tournament_id=eq.${tournamentId}`,
          },
          () => loadMatches()  // Reload khi có thay đổi
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [propTournamentId, mode, tournamentId]);

  if (loading) {
    return <p className="text-center py-8">Đang tải danh sách trận đấu...</p>;
  }

  if (!tournamentId) {
    return <p className="text-center py-8 text-red-600">Chưa có giải đấu nào được tạo.</p>;
  }

  if (matches.length === 0) {
    return (
      <p className="text-center py-8 text-gray-600">
        {mode === 'referee'
          ? 'Hiện tại chưa có trận đấu nào chờ diễn ra.'
          : 'Chưa có trận đấu nào trong giải.'}
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {matches.map((m) => (
        <div key={m.id} className="border rounded-lg p-4 bg-white shadow hover:shadow-md transition">
          <div className="font-semibold text-lg">
            {m.team1.name} vs {m.team2.name}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Trạng thái: <span className={`font-medium ${m.status === 'pending' ? 'text-orange-600' : m.status === 'ongoing' ? 'text-green-600' : 'text-blue-600'}`}>
              {m.status === 'pending' ? 'Chưa đấu' : m.status === 'ongoing' ? 'Đang đấu' : 'Hoàn thành'}
            </span>
          </div>
          {m.status === 'completed' && (
            <div className="text-sm mt-2">
              Tỷ số: {m.score_team1 ?? 0} - {m.score_team2 ?? 0}
            </div>
          )}
          {mode === 'referee' && m.status === 'pending' && (
            <button
              onClick={() => onSelect?.(m)}
              className="mt-3 w-full bg-primary text-white py-2 rounded hover:bg-green-700 transition"
            >
              Bắt đầu trận
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
// components/MatchList.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Team {
  id: string;
  name: string;
  fullName: string;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  status: string;
  score_team1?: number;
  score_team2?: number;
  round_num?: number;
  court_num?: number;
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
    const fetchTournamentId = async (): Promise<string | null> => {
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

    const loadMatches = async () => {
      const tid = await fetchTournamentId();
      if (!tid) {
        setLoading(false);
        return;
      }

      // Fetch matches đơn giản (không nested)
      let query = supabase
        .from('matches')
        .select('id, status, score_team1, score_team2, team1_id, team2_id, round_num, court_num')
        .eq('tournament_id', tid);

      // if (mode === 'referee') {
      //   query = query.eq('status', 'pending');
      // }

      const { data: matchesData, error: matchesError } = await query;

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

      // Lấy tất cả team_id duy nhất
      const teamIds = Array.from(
        new Set(matchesData.flatMap(m => [m.team1_id, m.team2_id].filter(Boolean)))
      );

      // Fetch tên teams (bao gồm fullName nếu có)
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, fullName')
        .in('id', teamIds);

      // Tạo map id → fullName (ưu tiên fullName, fallback name)
      const teamMap: Record<string, string> = {};
      teamsData?.forEach(t => {
        teamMap[t.id] = t.fullName || t.name || 'Đội không rõ';
      });

      // Enrich matches
      const enrichedMatches: Match[] = matchesData.map(m => ({
        id: m.id,
        status: m.status,
        score_team1: m.score_team1 ?? 0,
        score_team2: m.score_team2 ?? 0,
        round_num: m.round_num ?? 0,
        court_num: m.court_num ?? 0,
        team1: { id: m.team1_id, name: '', fullName: teamMap[m.team1_id] || 'Đội không rõ' },
        team2: { id: m.team2_id, name: '', fullName: teamMap[m.team2_id] || 'Đội không rõ' },
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
          () => loadMatches()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [propTournamentId, mode, tournamentId]);

  if (loading) {
    return <p className="text-center py-8 text-xl">Đang tải danh sách trận đấu...</p>;
  }

  if (!tournamentId) {
    return <p className="text-center py-8 text-red-600 text-xl">Chưa có giải đấu nào được tạo.</p>;
  }

  if (matches.length === 0) {
    return (
      <p className="text-center py-8 text-gray-600 text-xl">
        {mode === 'referee'
          ? 'Hiện tại chưa có trận đấu nào chờ diễn ra.'
          : 'Chưa có trận đấu nào trong giải.'}
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {matches.map((m) => (
        <div
          key={m.id}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 hover:shadow-2xl transition-all"
        >
          {/* Round và Sân - Chỉ hiển thị cho referee */}
          {mode === 'referee' && (m.round_num || m.court_num) && (
            <div className="mb-4 text-center">
              <span className="inline-block bg-primary text-white px-4 py-2 rounded-full font-bold text-lg">
                Round {m.round_num || '?'} - Sân {m.court_num || '?'}
              </span>
            </div>
          )}

          {/* Tên trận đấu */}
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800">
              {m.team1.fullName} <span className="text-primary">VS</span> {m.team2.fullName}
            </h3>
          </div>

          {/* Trạng thái */}
          <div className="text-center mb-4">
            <span
              className={`inline-block px-4 py-2 rounded-full text-white font-semibold ${
                m.status === 'pending'
                  ? 'bg-orange-500'
                  : m.status === 'ongoing'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
            >
              {m.status === 'pending' ? 'Chưa đấu' : m.status === 'ongoing' ? 'Đang đấu' : 'Hoàn thành'}
            </span>
          </div>
          {/* Nút bắt đầu cho referee */}
          {mode === 'referee' && m.status === 'ongoing' && (
            <button
              onClick={() => onSelect?.(m)}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold text-xl py-4 rounded-xl shadow-lg transform hover:scale-105 transition"
            >
              Tiếp tục trận đấu
            </button>
          )}
          {/* Tỷ số nếu đã hoàn thành */}
          {m.status === 'completed' && (
            <div className="text-center text-3xl font-extrabold text-primary mb-4">
              {m.score_team1} - {m.score_team2}
            </div>
          )}

          {/* Nút bắt đầu cho referee */}
          {mode === 'referee' && m.status === 'pending' && (
            <button
              onClick={() => onSelect?.(m)}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold text-xl py-4 rounded-xl shadow-lg transform hover:scale-105 transition"
            >
              Bắt đầu trận đấu
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
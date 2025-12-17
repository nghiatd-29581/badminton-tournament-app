// components/StandingsTable.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal } from 'lucide-react';

interface Standing {
  id: string;
  points: number;
  wins: number;
  losses: number;
  team_id: string;
}

interface Team {
  id: string;
  name: string;
  members?: string[];
}

interface EnrichedStanding {
  points: number;
  wins: number;
  losses: number;
  team: {
    name: string;
    members?: string[];
  };
}

export default function StandingsTable() {
  const [standings, setStandings] = useState<EnrichedStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);

      // 1. Fetch latest tournament
      const { data: tourData } = await supabase
        .from('tournaments')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!tourData) {
        setLoading(false);
        return;
      }

      const tid = tourData.id;

      // 2. Fetch standings (không nested)
      const { data: standingsData, error: standingsError } = await supabase
        .from('standings')
        .select('id, points, wins, losses, team_id')
        .eq('tournament_id', tid)
        .order('points', { ascending: false })
        .order('wins', { ascending: false });

      if (standingsError || !standingsData) {
        console.error('Lỗi fetch standings:', standingsError);
        setStandings([]);
        setLoading(false);
        return;
      }

      // 3. Lấy tất cả team_id
      const teamIds = standingsData.map(s => s.team_id);

      // 4. Fetch teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, members')
        .in('id', teamIds);

      // 5. Tạo map team_id → team info
      const teamMap: Record<string, { name: string; members?: string[] }> = {};
      teamsData?.forEach(t => {
        teamMap[t.id] = {
          name: t.name || 'Đội không rõ',
          members: t.members || [],
        };
      });

      // 6. Enrich standings
      const enriched = standingsData.map(s => ({
        points: s.points,
        wins: s.wins,
        losses: s.losses,
        team: teamMap[s.team_id] || { name: 'Đội không rõ', members: [] },
      }));

      setStandings(enriched);
      setLoading(false);
    };

    fetchStandings();

    // Real-time (reload khi standings thay đổi)
    const channel = supabase.channel('standings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'standings' }, fetchStandings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchStandings)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <p className="text-center text-2xl text-gray-600">Đang tải bảng xếp hạng...</p>;
  if (standings.length === 0) return <p className="text-center text-2xl text-gray-600">Chưa có dữ liệu xếp hạng</p>;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-16 h-16 text-yellow-500" />;
    if (index === 1) return <Medal className="w-14 h-14 text-gray-400" />;
    if (index === 2) return <Medal className="w-14 h-14 text-orange-600" />;
    return <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-3xl font-bold text-primary">{index + 1}</div>;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold text-primary flex items-center justify-center bg-white rounded-xl  p-2 flex items-center space-x-2 border-2 transition-all">
          <Trophy className="w-12 h-12 mr-4 text-yellow-500" />
          Bảng Xếp Hạng
        </h2>
      </div>

      {standings.map((s, index) => {
        const membersStr = Array.isArray(s.team.members) && s.team.members.length > 0
         ? s.team.members.join(' & '): '';

        return (
          <div
            key={index}
            className={`bg-white rounded-xl shadow-xl p-2 flex items-center space-x-4 border-2 transition-all ${
              index === 0 ? 'border-yellow-300' : index === 1 ? 'border-gray-200' : index === 2 ? 'border-orange-300' : 'border-gray-200'
            }`}
          >
            {/* Hạng */}
            <div className="flex-shrink-0">
              {getRankIcon(index)}
            </div>

            {/* Thông tin đội */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl md:text-3xl font-bold text-gray-800">
                {s.team.name}
              </h3>
              {membersStr && (
                <p className="text-lg md:text-xl text-gray-600 mt-1">
                  {membersStr}
                </p>
              )}
            </div>

            {/* Điểm & Thắng/Thua */}
            <div className="text-right">
              <div className="text-2xl md:text-2xl font-extrabold text-primary">
                {s.points} điểm
              </div>
              <div className="text-lg md:text-xl text-gray-600">
                <span className="text-green-600 font-bold">{s.wins} thắng</span> • <span className="text-red-600 font-bold">{s.losses} thua</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
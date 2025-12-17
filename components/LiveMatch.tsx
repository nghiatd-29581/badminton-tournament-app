// components/LiveMatch.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Radio } from 'lucide-react';
import { motion } from 'framer-motion'; // Nếu chưa có: npm install framer-motion

interface Team {
  name: string;
  members?: string[];
}

interface OngoingMatch {
  id: string;
  score_team1: number;
  score_team2: number;
  team1: Team;
  team2: Team;
}

export default function LiveMatch() {
  const [matches, setMatches] = useState<Map<string, OngoingMatch>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);

    const { data: tourData } = await supabase
      .from('tournaments')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!tourData) {
      setMatches(new Map());
      setLoading(false);
      return;
    }

    const tid = tourData.id;

    // Fetch matches ongoing
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tid)
      .eq('status', 'ongoing');

    if (!matchesData || matchesData.length === 0) {
      setMatches(new Map());
      setLoading(false);
      return;
    }

    const teamIds = [...new Set(matchesData.flatMap(m => [m.team1_id, m.team2_id]))];

    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, name, members')
      .in('id', teamIds);

    const teamMap = new Map();
    teamsData?.forEach(t => teamMap.set(t.id, { name: t.name || 'Đội không rõ', members: t.members || [] }));

    const newMatches = new Map();
    matchesData.forEach(m => {
      newMatches.set(m.id, {
        id: m.id,
        score_team1: m.score_team1 || 0,
        score_team2: m.score_team2 || 0,
        team1: teamMap.get(m.team1_id) || { name: 'Đội 1' },
        team2: teamMap.get(m.team2_id) || { name: 'Đội 2' },
      });
    });

    setMatches(newMatches);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel('live_matches_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new;

            if (updated.status !== 'ongoing') {
              // Nếu trận kết thúc → xóa khỏi danh sách
              setMatches(prev => {
                const newMap = new Map(prev);
                newMap.delete(updated.id);
                return newMap;
              });
              return;
            }

            // Chỉ update score nếu là trận ongoing
            setMatches(prev => {
              const match = prev.get(updated.id);
              if (!match) return prev; // Nếu chưa có → bỏ qua (sẽ fetch lại nếu cần)

              const newMap = new Map(prev);
              newMap.set(updated.id, {
                ...match,
                score_team1: updated.score_team1 || 0,
                score_team2: updated.score_team2 || 0,
              });
              return newMap;
            });
          }

          // Nếu INSERT mới (trận mới bắt đầu)
          if (payload.eventType === 'INSERT' && payload.new.status === 'ongoing') {
            fetchAllData(); // Fetch lại để lấy tên đội
          }

          // Nếu DELETE hoặc status thay đổi → fetch lại an toàn
          if (payload.eventType === 'DELETE') {
            fetchAllData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <p className="text-center text-3xl text-gray-600">Đang kết nối live...</p>;
  }

  if (matches.size === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-16 text-center border border-gray-200">
        <Radio className="w-28 h-28 mx-auto text-gray-400 mb-8 animate-pulse" />
        <p className="text-5xl font-bold text-gray-700">Chưa có trận đấu nào</p>
        <p className="text-2xl text-gray-600 mt-6">Trọng tài sẽ bắt đầu từ trang Referee</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="text-center mb-10">
        <h2 className="text-5xl md:text-7xl font-extrabold text-primary flex items-center justify-center">
          <Radio className="w-16 h-16 mr-6 text-green-500 animate-ping" />
          LIVE - ĐANG DIỄN RA
        </h2>
        <p className="text-2xl md:text-3xl text-gray-700 mt-4 font-medium">Cập nhật real-time từ các sân</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
        {Array.from(matches.values()).map((match) => {
          const team1Name = match.team1.members?.length > 0 ? match.team1.members.join(' & ') : match.team1.name;
          const team2Name = match.team2.members?.length > 0 ? match.team2.members.join(' & ') : match.team2.name;

          return (
            <motion.div
              key={match.id}
              layout
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-4 border-4 border-primary/10"
            >
              <div className="text-center mb-3">
                <p className="text-lg font-semibold text-gray-600 bg-white/80 rounded-full px-4 py-1 inline-block">
                  Trận đang diễn ra
                </p>
              </div>

              <div className="grid grid-cols-3 items-center gap-6">
                <div className="text-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-green-700 mb-4 leading-tight">
                    {team1Name}
                  </h3>
                  <motion.div
                    key={match.score_team1}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl md:text-5xl font-extrabold text-green-600"
                  >
                    {match.score_team1}
                  </motion.div>
                </div>

                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold text-gray-800">VS</div>
                </div>

                <div className="text-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-blue-700 mb-4 leading-tight">
                    {team2Name}
                  </h3>
                  <motion.div
                    key={match.score_team2}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl md:text-5xl font-extrabold text-blue-600"
                  >
                    {match.score_team2}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
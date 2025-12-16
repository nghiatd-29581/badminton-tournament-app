// components/ScoreCounter.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, ArrowLeft } from 'lucide-react';

interface Team {
  id: string;
  name: string;        // "Đội 1"
  members: string[];   // ["Nguyễn Văn A", "Trần Thị B"]
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  score_team1: number;
  score_team2: number;
  status: string;
}

interface Props {
  match: Match;
  onEnd: () => void;
}

export default function ScoreCounter({ match, onEnd }: Props) {
  const [score1, setScore1] = useState(match.score_team1 || 0);
  const [score2, setScore2] = useState(match.score_team2 || 0);
  const [loading, setLoading] = useState(false);

  // Tự động set ongoing khi vào
  useEffect(() => {
    supabase.from('matches').update({ status: 'ongoing' }).eq('id', match.id);
  }, [match.id]);

  const addPoint = (team: 1 | 2) => {
    team === 1 ? setScore1(s => s + 1) : setScore2(s => s + 1);
  };

  const subtractPoint = (team: 1 | 2) => {
    team === 1 ? setScore1(s => Math.max(0, s - 1)) : setScore2(s => Math.max(0, s - 1));
  };

  const endMatch = async () => {
    if (!confirm(`Kết thúc trận?\n${team1Members} ${score1} - ${score2} ${team2Members}`)) return;

    setLoading(true);
    const winner_id = score1 > score2 ? match.team1.id : match.team2.id;
    const loser_id = winner_id === match.team1.id ? match.team2.id : match.team1.id;

    const { error } = await supabase
      .from('matches')
      .update({
        score_team1: score1,
        score_team2: score2,
        winner_id,
        status: 'completed',
      })
      .eq('id', match.id);

    if (!error) {
      // Cập nhật standings
      await supabase.from('standings').update({ points: { increment: 3 }, wins: { increment: 1 } }).eq('team_id', winner_id);
      await supabase.from('standings').update({ points: { increment: 1 }, losses: { increment: 1 } }).eq('team_id', loser_id);
      alert('🎉 Trận đấu kết thúc thành công!');
      onEnd();
    } else {
      alert('Lỗi: ' + error.message);
    }
    setLoading(false);
  };

  // Tạo chuỗi tên thành viên đẹp
  const team1Members = match.team1.members?.join(' & ') || match.team1.name;
  const team2Members = match.team2.members?.join(' & ') || match.team2.name;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Tiêu đề trận đấu - Tên thành viên thật */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 leading-tight">
            {team1Members}
            <span className="block text-3xl md:text-4xl text-gray-700 mt-2">VS</span>
            {team2Members}
          </h1>
          <p className="text-lg text-gray-600">Trọng tài bấm điểm trực tiếp</p>
        </div>

        {/* Tỷ số lớn ở giữa */}
        <div className="flex justify-center items-center gap-8 md:gap-16 mb-12">
          <div className="text-9xl md:text-10xl font-extrabold text-green-600">{score1}</div>
          <div className="text-6xl md:text-8xl font-bold text-gray-600">:</div>
          <div className="text-9xl md:text-10xl font-extrabold text-blue-600">{score2}</div>
        </div>

        {/* Nút điều khiển - Dọc, dễ bấm trên mobile */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          {/* Bên trái - Team 1 */}
          <div className="space-y-6">
            <button
              onClick={() => addPoint(1)}
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-3xl py-20 md:py-32 text-8xl md:text-9xl font-bold shadow-2xl transform active:scale-95 transition"
            >
              +
            </button>
            <button
              onClick={() => subtractPoint(1)}
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-3xl py-12 text-6xl font-bold shadow-xl transform active:scale-95 transition"
            >
              −
            </button>
          </div>

          {/* Bên phải - Team 2 */}
          <div className="space-y-6">
            <button
              onClick={() => addPoint(2)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-3xl py-20 md:py-32 text-8xl md:text-9xl font-bold shadow-2xl transform active:scale-95 transition"
            >
              +
            </button>
            <button
              onClick={() => subtractPoint(2)}
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-3xl py-12 text-6xl font-bold shadow-xl transform active:scale-95 transition"
            >
              −
            </button>
          </div>
        </div>

        {/* Nút kết thúc */}
        <div className="text-center">
          <button
            onClick={endMatch}
            disabled={loading}
            className="bg-accent hover:bg-orange-600 text-white font-bold text-3xl md:text-4xl py-8 px-16 rounded-full shadow-2xl transform hover:scale-105 active:scale-95 transition disabled:opacity-70 flex items-center mx-auto"
          >
            <Trophy className="w-12 h-12 mr-4" />
            {loading ? 'Đang lưu...' : 'Kết Thúc Trận Đấu'}
          </button>
        </div>

        {/* Nút quay lại */}
        <div className="text-center mt-10">
          <button
            onClick={onEnd}
            className="text-primary font-bold text-xl hover:underline flex items-center mx-auto"
          >
            <ArrowLeft className="w-8 h-8 mr-2" />
            Quay lại danh sách trận
          </button>
        </div>
      </div>
    </div>
  );
}
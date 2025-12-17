// components/ScoreCounter.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, ArrowLeft } from 'lucide-react';

interface Team {
  id: string;
  name: string;        // "Đội 1"
  fullName: string;
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

const addPoint = async (team: 1 | 2) => {
  const field = team === 1 ? 'score_team1' : 'score_team2';
  const newScore = team === 1 ? score1 + 1 : score2 + 1;

  try {
    // Cập nhật state trước để UI mượt
    if (team === 1) setScore1(newScore);
    else setScore2(newScore);

    // Đợi lưu DB realtime
    const { error } = await supabase
      .from('matches')
      .update({ [field]: newScore })
      .eq('id', match.id);

    if (error) throw error;

    console.info('Lưu điểm thành công:', match.id, field, newScore);
  } catch (error: any) {
    console.error('Lỗi lưu điểm vào DB:', error.message || error);

    // Optional: Rollback state nếu lưu thất bại (tùy nhu cầu)
    // if (team === 1) setScore1(prev => prev - 1);
    // else setScore2(prev => prev - 1);
  }
};

const subtractPoint = async (team: 1 | 2) => {
  const field = team === 1 ? 'score_team1' : 'score_team2';
  const newScore = team === 1 ? Math.max(0, score1 - 1) : Math.max(0, score2 - 1);

  try {
    if (team === 1) setScore1(newScore);
    else setScore2(newScore);

    const { error } = await supabase
      .from('matches')
      .update({ [field]: newScore })
      .eq('id', match.id);

    if (error) throw error;

    console.info('Giảm điểm thành công:', match.id, field, newScore);
  } catch (error: any) {
    console.error('Lỗi giảm điểm:', error.message || error);
  }
};

const endMatch = async () => {
  if (!confirm(`Kết thúc trận?\n${team1Members} ${score1} - ${score2} ${team2Members}`)) return;

  setLoading(true);
  const winner_id = score1 > score2 ? match.team1.id : match.team2.id;

  try {
    // 1. Cập nhật matches (giữ nguyên)
    const { error: matchError } = await supabase
      .from('matches')
      .update({
        score_team1: score1,
        score_team2: score2,
        winner_id,
        status: 'completed',
      })
      .eq('id', match.id);

    if (matchError) throw matchError;

    // 2. Gọi function để cập nhật standings
    const { error: rpcError } = await supabase
      .rpc('update_standings_after_match', { p_match_id: match.id });
      

    if (!matchError) {
    // Xóa session khi kết thúc
    await supabase.from('matches').update({ referee_session_id: null }).eq('id', match.id);
    localStorage.removeItem('ongoing_match_id');
    alert('🎉 Trận đấu kết thúc thành công! Bảng xếp hạng đã cập nhật.');
    onEnd();
  }
    if (rpcError) throw rpcError;
  } catch (err: any) {
    console.error('Lỗi kết thúc trận:', err);
    alert('Lỗi lưu dữ liệu: ' + (err.message || 'Không rõ nguyên nhân'));
  } finally {
    setLoading(false);
  }
};

  // Tạo chuỗi tên thành viên đẹp
  const team1Members = match.team1.fullName.trim();
  const team2Members = match.team2.fullName.trim();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Tiêu đề trận đấu - Tên thành viên thật */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-5xl font-extrabold text-primary mb-4 leading-tight">
            {team1Members}
            <span className="block text-2xl md:text-2xl text-red-700 mt-2">VS</span>
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
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-3xl py-12 md:py-32 text-6xl md:text-9xl font-bold shadow-2xl transform active:scale-95 transition"
            >
              +
            </button>
            <button
              onClick={() => subtractPoint(1)}
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-3xl py-2 text-6xl font-bold shadow-xl transform active:scale-95 transition"
            >
              −
            </button>
          </div>

          {/* Bên phải - Team 2 */}
          <div className="space-y-6">
            <button
              onClick={() => addPoint(2)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-3xl py-12 md:py-32 text-6xl md:text-9xl font-bold shadow-2xl transform active:scale-95 transition"
            >
              +
            </button>
            <button
              onClick={() => subtractPoint(2)}
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-3xl py-2 text-6xl font-bold shadow-xl transform active:scale-95 transition"
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
            className="bg-accent hover:bg-orange-600 text-white font-bold text-3xl md:text-2xl py-4 px-12 rounded-full shadow-2xl transform hover:scale-105 active:scale-95 transition disabled:opacity-70 flex items-center mx-auto"
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
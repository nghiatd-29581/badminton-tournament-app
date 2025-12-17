// app/referee/page.tsx
'use client';

import { useState, useEffect } from 'react';
import MatchList from '@/components/MatchList';
import ScoreCounter from '@/components/ScoreCounter';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid'; // Install nếu chưa: npm i uuid @types/uuid
import { Megaphone } from 'lucide-react';

export default function RefereePage() {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [ongoingMatchId, setOngoingMatchId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(uuidv4()); // UUID phiên trọng tài

  useEffect(() => {
    // Lưu sessionId vào localStorage
    localStorage.setItem('referee_session_id', sessionId);

    // Check nếu có match ongoing của phiên này
    const checkOngoing = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'ongoing')
        .eq('referee_session_id', sessionId)
        .single();

      if (data) {
        setOngoingMatchId(data.id);
      }
    };
    checkOngoing();
  }, [sessionId]);

  const handleStartMatch = async (match: any) => {
    const { error } = await supabase
      .from('matches')
      .update({ status: 'ongoing', referee_session_id: sessionId })
      .eq('id', match.id);

    if (!error) {
      setSelectedMatch(match);
      localStorage.setItem('ongoing_match_id', match.id);
    } else {
      alert('Lỗi bắt đầu trận!');
    }
  };

  const handleContinueMatch = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('id', ongoingMatchId)
      .eq('status', 'ongoing')
      .single();

    if (data) {
      setSelectedMatch(data);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-primary mb-4">Trọng tài</h1>
        <p className="text-xl text-gray-600">Chọn trận đấu để bắt đầu nhập điểm</p>
      </div>

      {selectedMatch ? (
        <ScoreCounter match={selectedMatch} onEnd={() => {
          localStorage.removeItem('ongoing_match_id');
          setSelectedMatch(null);
        }} />
      ) : (
        <section className="bg-card rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center mb-6">
            <Megaphone className="w-10 h-10 text-warning mr-3" />
            <h2 className="text-3xl font-bold">Trận đấu chờ diễn ra</h2>
          </div>

          {/* Nút tiếp tục trận nếu reload */}
          {ongoingMatchId && (
            <button
              onClick={handleContinueMatch}
              className="w-full bg-accent text-white py-4 rounded-xl font-bold text-xl mb-8 shadow-lg hover:bg-orange-600 transition"
            >
              Tiếp tục trận đang chấm (ID: {ongoingMatchId.slice(0,8)}...)
            </button>
          )}

          <MatchList mode="referee" onSelect={handleStartMatch} />
        </section>
      )}
    </div>
  );
}
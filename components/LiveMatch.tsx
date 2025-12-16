'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  tournamentId: string;
}

export default function LiveMatch({ tournamentId }: Props) {
  const [match, setMatch] = useState<any>(null);

  useEffect(() => {
    const fetchOngoing = async () => {
      const { data } = await supabase.from('matches').select('*, team1:name, team2:name').eq('tournament_id', tournamentId).eq('status', 'ongoing').single();
      setMatch(data);
    };
    fetchOngoing();

    // Real-time
    const sub = supabase.channel('matches').on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` }, payload => {
      if (payload.new.status === 'ongoing') setMatch(payload.new);
      else if (payload.new.status === 'completed' && match?.id === payload.new.id) setMatch(null);
    }).subscribe();

    return () => { sub.unsubscribe(); };
  }, [tournamentId]);

  if (!match) return <p>No ongoing match</p>;

  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h2 className="text-2xl">Live Match</h2>
      <p>{match.team1.name} {match.score_team1} - {match.score_team2} {match.team2.name}</p>
    </div>
  );
}
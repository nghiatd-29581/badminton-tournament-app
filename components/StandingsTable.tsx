'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  tournamentId: string;
}

export default function StandingsTable({ tournamentId }: Props) {
  const [standings, setStandings] = useState<any[]>([]);

  useEffect(() => {
    const fetchStandings = async () => {
      const { data } = await supabase.from('standings').select('*, team:name').eq('tournament_id', tournamentId).order('points', { ascending: false });
      setStandings(data);
    };
    fetchStandings();

    // Real-time
    const sub = supabase.channel('standings').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'standings', filter: `tournament_id=eq.${tournamentId}` }, fetchStandings).subscribe();
    return () => { sub.unsubscribe(); };
  }, [tournamentId]);

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th>Team</th>
          <th>Points</th>
          <th>Wins</th>
          <th>Losses</th>
        </tr>
      </thead>
      <tbody>
        {standings.map(s => (
          <tr key={s.id}>
            <td>{s.team.name}</td>
            <td>{s.points}</td>
            <td>{s.wins}</td>
            <td>{s.losses}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
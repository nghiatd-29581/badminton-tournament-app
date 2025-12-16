'use client';

import { useEffect, useState } from 'react';
import LiveMatch from '@/components/LiveMatch';
import StandingsTable from '@/components/StandingsTable';
import { supabase } from '@/lib/supabase';

export default function LivePage() {
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase.from('tournaments').select('id').order('created_at', { ascending: false }).limit(1);
      setTournamentId(data?.[0].id);
    };
    fetchLatest();
  }, []);

  if (!tournamentId) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-4 md:flex md:space-x-4">
      <LiveMatch tournamentId={tournamentId} />
      <StandingsTable tournamentId={tournamentId} />
    </div>
  );
}
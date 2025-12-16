'use client';

import { useState } from 'react';
import MatchList from '@/components/MatchList';
import ScoreCounter from '@/components/ScoreCounter';

export default function RefereePage() {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Referee Dashboard</h1>
      {!selectedMatch ? (
        <MatchList mode="referee" onSelect={setSelectedMatch} /> // Assume fetch latest tournament
      ) : (
        <ScoreCounter match={selectedMatch} onEnd={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}
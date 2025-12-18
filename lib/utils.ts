//import { v4 as uuidv4 } from 'uuid'; // Cần install uuid nếu dùng, nhưng Supabase dùng uuid_generate_v4

import { supabaseAdmin } from "./supabase";

// Function to generate Round Robin schedule
// Logic: For N teams, each plays every other once. Use rotation method for fair scheduling.
// Comment: Fix team 1, rotate others clockwise. Avoid bye if N even.
export function generateRoundRobin(teams: { id: string; name: string }[]) {
  const n = teams.length;
  const matches = [];

  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < n / 2; i++) {
      const team1 = teams[i];
      const team2 = teams[(n - 1 - i + round) % (n - 1)]; // Rotation
      if (team1.id !== team2.id) { // Avoid self-match
        matches.push({
         // id: uuidv4(), // Or let DB generate
          team1_id: team1.id,
          team2_id: team2.id,
          status: 'pending',
        });
      }
    }
    // Rotate teams except first
    teams = [teams[0], ...teams.slice(2), teams[1]];
  }
  return matches;
}


// Function to generate Round Robin with rounds and courts
export function generateRoundRobinWithCourts(teams: { id: string; name: string }[], numCourts: number) {
  let n = teams.length;
  if (n % 2 === 1) {
    n += 1;  // Add bye for odd
    teams.push({ id: 'bye', name: 'Bye' }); // Dummy bye
  }

  const matches = [];
  let roundNum = 0;

  const teamArray = [...teams];

  for (let r = 0; r < n - 1; r++) {
    roundNum++;
    const roundMatches = [];
    for (let i = 0; i < n / 2; i++) {
      const team1 = teamArray[i];
      const team2 = teamArray[n - 1 - i];
      if (team1.id !== 'bye' && team2.id !== 'bye') {
        roundMatches.push({
          team1_id: team1.id,
          team2_id: team2.id,
          status: 'pending',
          round_num: roundNum,
          court_num: (roundMatches.length % numCourts) + 1,  // Assign court 1 to numCourts
        });
      }
    }
    matches.push(...roundMatches);

    // Rotate teams
    teamArray.splice(1, 0, teamArray.pop()!);
  }

  // Remove bye if added
  return matches.filter(m => m.team1_id !== 'bye' && m.team2_id !== 'bye');
}


// Calculate points after match end
// Winner +3, Loser +1
export async function updateStandings(match: { tournament_id: string; winner_id: string; team1_id: string; team2_id: string }) {
  const supabase = supabaseAdmin(); // Use admin for write
  const loser_id = match.winner_id === match.team1_id ? match.team2_id : match.team1_id;

  // Update winner
  await supabase.from('standings').update({
    points: { points: { increment: 3 } },
    wins: { wins: { increment: 1 } },
    updated_at: new Date(),
  }).eq('team_id', match.winner_id);

  // Update loser
  await supabase.from('standings').update({
    points: { points: { increment: 1 } },
    losses: { losses: { increment: 1 } },
    updated_at: new Date(),
  }).eq('team_id', loser_id);
}
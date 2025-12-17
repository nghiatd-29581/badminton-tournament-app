// components/AdminForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateRoundRobin, generateRoundRobinWithCourts } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import React from 'react';

interface Props {
  onCreate?: (tournamentId: string) => void;
}

export default function AdminForm({ onCreate }: Props) {
  const [name, setName] = useState('');
  const [numTeams, setNumTeams] = useState(4);
  const [teamMembers, setTeamMembers] = useState<string[]>(['', '', '', '','']);
  const [loading, setLoading] = useState(false);

  const handleTeamMembersChange = (index: number, value: string) => {
    const updated = [...teamMembers];
    updated[index] = value;
    setTeamMembers(updated);
  };
  const [numCourts, setNumCourts] = useState(2);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Vui lòng nhập tên giải đấu');
    if (teamMembers.some(m => !m.trim())) return alert('Vui lòng nhập thành viên cho tất cả các đội');

    setLoading(true);

    try {
      // 1. Tạo tournament
      const { data: tour, error: tourError } = await supabase
        .from('tournaments')
        .insert({ name: name.trim() })
        .select('id')
        .single();

      if (tourError || !tour) throw tourError || new Error('Không tạo được giải đấu');

      const tournament_id = tour.id;

      // 2. Tạo teams
      const teamData = teamMembers.map((membersStr, i) => ({
        tournament_id,
        name: `Đội ${i + 1}`,
        fullName: membersStr.trim(),
        members: membersStr.split(',').map(m => m.trim()).filter(Boolean),
      }));

      const { data: teamsInserted, error: teamError } = await supabase
        .from('teams')
        .insert(teamData)
        .select();

      if (teamError || !teamsInserted) throw teamError;

      // 3. Tạo standings
      await supabase.from('standings').insert(
        teamsInserted.map(t => ({ tournament_id, team_id: t.id }))
      );



      const matches = generateRoundRobinWithCourts(teamsInserted.map(t => ({ id: t.id, name: t.fullName })), numCourts);

      await supabase.from('matches').insert(matches.map(m => ({ ...m, tournament_id })));

      alert('🎉 Tạo giải đấu thành công!');
      onCreate?.(tournament_id);
      // Reset form
      setName('');
      setNumTeams(0);
      setTeamMembers(Array(0).fill(''));
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể tạo giải đấu'));
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật số input khi thay đổi numTeams
  React.useEffect(() => {
    if (numTeams > teamMembers.length) {
      setTeamMembers([...teamMembers, ...Array(numTeams - teamMembers.length).fill('')]);
    } else {
      setTeamMembers(teamMembers.slice(0, numTeams));
    }
  }, [numTeams]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Tên giải đấu */}
      <div>
        <label className="block text-lg font-semibold mb-3 text-gray-800">
          <Trophy className="inline w-6 h-6 mr-2 text-accent" />
          Tên giải đấu
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="VD: Giải Cầu Lông Mùa Hè 2025"
          className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg transition"
          required
        />
      </div>

      {/* Số lượng đội */}
      <div>
        <label className="block text-lg font-semibold mb-3 text-gray-800">
          Số lượng đội (2-20)
        </label>
        <input
          type="number"
          min="2"
          max="20"
          value={numTeams}
          onChange={e => setNumTeams(Math.max(2, Math.min(20, parseInt(e.target.value) || 2)))}
          className="w-full md:w-64 px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg"
        />
      </div>
      <div>
        <label className="block text-lg font-semibold mb-3 text-gray-800">
          Số sân thi đấu (1-10)
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={numCourts}
          onChange={e => setNumCourts(Math.max(1, Math.min(10, +e.target.value)))}
          className="w-full md:w-64 px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg"
        />
      </div>
      {/* Danh sách thành viên từng đội */}
      <div>
        <label className="block text-lg font-semibold mb-4 text-gray-800">
          Thành viên các đội (cách nhau bằng dấu phẩy)
        </label>
        <div className="grid md:grid-cols-2 gap-5">
          {teamMembers.map((members, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đội {i + 1}
              </label>
              <input
                type="text"
                value={members}
                onChange={e => handleTeamMembersChange(i, e.target.value)}
                placeholder="Nguyễn Văn A, Trần Thị B"
                className="w-full px-5 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition"
                required
              />
            </div>
          ))}
        </div>
      </div>

      {/* Nút submit */}
      <div className="text-center pt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-green-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-lg transform hover:scale-105 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center mx-auto"
        >
          {loading ? 'Đang tạo...' : '🚀 Tạo Giải Đấu Ngay'}
        </button>
      </div>
    </form>
  );
}
'use client';

import { useState, useEffect } from 'react';

interface Rumour {
  id: number;
  player_name: string;
  target_team: string;
  rumour_text: string;
  source: string;
  credibility_score: number;
  created_at: string;
}

export default function Home() {
  const [rumours, setRumours] = useState<Rumour[]>([]);
  const [team, setTeam] = useState('Glasgow Rangers');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRumours = async () => {
      try {
        const res = await fetch(`/api/rumours?team=${encodeURIComponent(team)}`);
        const data = await res.json();
        const rumoursList = Array.isArray(data) ? data : [];
        setRumours(rumoursList.sort((a: Rumour, b: Rumour) => b.credibility_score - a.credibility_score));
      } catch (error) {
        console.error('Error:', error);
        setRumours([]);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchRumours();
  }, [team]);

  const getCredibilityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredRumours = rumours.filter((rumour) =>
    rumour.player_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Transfer Rumours
        </h1>

        <div className="mb-6 flex gap-3">
          {['Glasgow Rangers', 'Feyenoord'].map((t) => (
            <button
              key={t}
              onClick={() => setTeam(t)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                team === t
                  ? t === 'Glasgow Rangers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-red-600 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by player name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : filteredRumours.length === 0 ? (
          <p className="text-center text-gray-600">No results found.</p>
        ) : (
          <div className="space-y-4">
            {filteredRumours.map((rumour) => (
              <div key={rumour.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800">
                    {rumour.player_name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getCredibilityColor(
                      rumour.credibility_score
                    )}`}
                  >
                    {rumour.credibility_score}%
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{rumour.rumour_text}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span className="bg-blue-100 px-3 py-1 rounded">
                    {rumour.source}
                  </span>
                  <span>
                    {new Date(rumour.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
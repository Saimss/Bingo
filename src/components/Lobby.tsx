import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Game } from '../types/database';
import { Users, Plus, Play } from 'lucide-react';

type LobbyProps = {
  onJoinGame: (gameId: string, playerName: string) => void;
};

export default function Lobby({ onJoinGame }: LobbyProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadGames();

    const channel = supabase
      .channel('games_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        loadGames();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadGames() {
    const { data } = await supabase
      .from('games')
      .select('*')
      .in('status', ['waiting', 'playing'])
      .order('created_at', { ascending: false });

    if (data) {
      setGames(data);
    }
  }

  async function createGame() {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsCreating(true);

    try {
      const hostId = `host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({ host_id: hostId, status: 'waiting' })
        .select()
        .single();

      if (gameError) throw gameError;

      onJoinGame(game.id, playerName);
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game');
    } finally {
      setIsCreating(false);
    }
  }

  async function joinGame() {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!selectedGame) {
      alert('Please select a game');
      return;
    }

    onJoinGame(selectedGame, playerName);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">BINGO!</h1>
          <p className="text-xl text-gray-600">Join a game and compete with others to get BINGO!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Name</h2>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
            maxLength={20}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Create New Game</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Start a new BINGO game and invite others to join!
            </p>
            <button
              onClick={createGame}
              disabled={isCreating || !playerName.trim()}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Game'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Join Existing Game</h2>
            </div>

            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {games.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active games available</p>
              ) : (
                games.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedGame === game.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">
                        Game {game.id.slice(0, 8)}
                      </span>
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        game.status === 'waiting'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {game.status === 'waiting' ? 'Waiting' : 'Playing'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={joinGame}
              disabled={!selectedGame || !playerName.trim()}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Join Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

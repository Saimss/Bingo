import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Game as GameType, Player,  CalledNumber } from '../types/database';
import {
  generateBingoBoard,
  serializeBoard,
  deserializeBoard,
  markNumber,
  checkForBingo,
  getBoardMarkedCells,
  type BingoBoard as BingoBoardType,
} from '../lib/gameUtils';
import BingoBoard from './BingoBoard';
import NumberCaller from './NumberCaller';
import { Users, Play, Trophy, ArrowLeft } from 'lucide-react';

type GameProps = {
  gameId: string;
  playerName: string;
  onLeaveGame: () => void;
};

type PlayerWithBoard = Player & {
  board: BingoBoardType | null;
};

export default function Game({ gameId, playerName, onLeaveGame }: GameProps) {
  const [game, setGame] = useState<GameType | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<PlayerWithBoard[]>([]);
  const [myBoard, setMyBoard] = useState<BingoBoardType | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<CalledNumber[]>([]);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    initializeGame();

    const gamesChannel = supabase
      .channel(`game_${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          if (payload.new) {
            setGame(payload.new as GameType);
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` },
        () => {
          loadPlayers();
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' },
        () => {
          loadPlayers();
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'called_numbers', filter: `game_id=eq.${gameId}` },
        (payload) => {
          const newNumber = payload.new as CalledNumber;
          setCalledNumbers((prev) => [...prev, newNumber]);
          handleNumberCalled(newNumber.number);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamesChannel);
    };
  }, [gameId]);

  async function initializeGame() {
    const { data: gameData } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle();

    if (gameData) {
      setGame(gameData);
    }

    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_name', playerName)
      .maybeSingle();

    if (existingPlayer) {
      setCurrentPlayer(existingPlayer);
      await loadPlayerBoard(existingPlayer.id);
    } else {
      await createPlayer();
    }

    await loadPlayers();
    await loadCalledNumbers();
  }

  async function createPlayer() {
    const { data: player } = await supabase
      .from('players')
      .insert({ game_id: gameId, player_name: playerName })
      .select()
      .single();

    if (player) {
      setCurrentPlayer(player);

      const newBoard = generateBingoBoard();
      setMyBoard(newBoard);

      await supabase.from('boards').insert({
        player_id: player.id,
        board_data: serializeBoard(newBoard),
        marked_cells: [12],
      });
    }
  }

  async function loadPlayerBoard(playerId: string) {
    const { data: boardData } = await supabase
      .from('boards')
      .select('*')
      .eq('player_id', playerId)
      .maybeSingle();

    if (boardData) {
      const board = deserializeBoard(boardData.board_data, boardData.marked_cells);
      setMyBoard(board);
    }
  }

  async function loadPlayers() {
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (playersData) {
      const playersWithBoards = await Promise.all(
        playersData.map(async (player) => {
          const { data: boardData } = await supabase
            .from('boards')
            .select('*')
            .eq('player_id', player.id)
            .maybeSingle();

          let board: BingoBoardType | null = null;
          if (boardData) {
            board = deserializeBoard(boardData.board_data, boardData.marked_cells);
          }

          return { ...player, board };
        })
      );

      setPlayers(playersWithBoards);
    }
  }

  async function loadCalledNumbers() {
    const { data } = await supabase
      .from('called_numbers')
      .select('*')
      .eq('game_id', gameId)
      .order('called_at', { ascending: true });

    if (data) {
      setCalledNumbers(data);
    }
  }

  async function handleNumberCalled(number: number) {
    if (myBoard && currentPlayer) {
      const updatedBoard = markNumber(myBoard, number);
      setMyBoard(updatedBoard);

      const markedCells = getBoardMarkedCells(updatedBoard);
      await supabase
        .from('boards')
        .update({ marked_cells: markedCells })
        .eq('player_id', currentPlayer.id);

      if (checkForBingo(updatedBoard) && !currentPlayer.has_bingo) {
        await supabase
          .from('players')
          .update({ has_bingo: true })
          .eq('id', currentPlayer.id);

        await supabase
          .from('games')
          .update({ winner_id: currentPlayer.id, status: 'finished' })
          .eq('id', gameId);

        setCurrentPlayer({ ...currentPlayer, has_bingo: true });
      }
    }
  }

  async function startGame() {
    await supabase.from('games').update({ status: 'playing' }).eq('id', gameId);
  }

  async function callNumber() {
    if (!game) return;

    setIsCalling(true);

    const calledNumbersSet = new Set(calledNumbers.map((n) => n.number));
    const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1).filter(
      (n) => !calledNumbersSet.has(n)
    );

    if (availableNumbers.length === 0) {
      alert('All numbers have been called!');
      setIsCalling(false);
      return;
    }

    const randomNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];

    await supabase.from('called_numbers').insert({
      game_id: gameId,
      number: randomNumber,
    });

    setIsCalling(false);
  }

  const isHost = game?.host_id === `host_${currentPlayer?.id}` || players[0]?.id === currentPlayer?.id;

  if (!game || !currentPlayer || !myBoard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">BINGO Game</h1>
              <p className="text-gray-600 mt-1">
                Game ID: {gameId.slice(0, 8)} • Status:{' '}
                <span className={`font-semibold ${
                  game.status === 'waiting' ? 'text-yellow-600' :
                  game.status === 'playing' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {game.status.toUpperCase()}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">{players.length} Players</span>
              </div>

              {isHost && game.status === 'waiting' && players.length > 0 && (
                <button
                  onClick={startGame}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Game
                </button>
              )}

              <button
                onClick={onLeaveGame}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Leave
              </button>
            </div>
          </div>
        </div>

        {game.status === 'waiting' && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6 text-center">
            <p className="text-lg text-yellow-900 font-semibold">
              Waiting for host to start the game...
            </p>
          </div>
        )}

        {game.status === 'finished' && (
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 mb-6 text-center">
            <Trophy className="w-16 h-16 text-yellow-900 mx-auto mb-3" />
            <p className="text-2xl text-yellow-900 font-bold">
              Game Over! Winner: {players.find((p) => p.id === game.winner_id)?.player_name}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <NumberCaller
              calledNumbers={calledNumbers}
              onCallNumber={callNumber}
              isHost={isHost}
              gameStatus={game.status}
              isCalling={isCalling}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Board</h2>
              <BingoBoard
                board={myBoard}
                playerName={playerName}
                hasBingo={currentPlayer.has_bingo}
                isCurrentPlayer={true}
              />
            </div>

            {players.length > 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Other Players</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {players
                    .filter((p) => p.id !== currentPlayer.id && p.board)
                    .map((player) => (
                      <BingoBoard
                        key={player.id}
                        board={player.board!}
                        playerName={player.player_name}
                        hasBingo={player.has_bingo}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

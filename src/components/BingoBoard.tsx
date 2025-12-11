import type { BingoBoard as BingoBoardType } from '../lib/gameUtils';

type BingoBoardProps = {
  board: BingoBoardType;
  playerName: string;
  hasBingo: boolean;
  isCurrentPlayer?: boolean;
};

const COLUMNS = ['B', 'I', 'N', 'G', 'O'];

export default function BingoBoard({ board, playerName, hasBingo, isCurrentPlayer = false }: BingoBoardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 ${isCurrentPlayer ? 'ring-4 ring-blue-400' : ''}`}>
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-800 truncate">{playerName}</h3>
        {hasBingo && (
          <div className="mt-1 inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            BINGO! 🎉
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1 mb-2">
        {COLUMNS.map((letter) => (
          <div
            key={letter}
            className="bg-gradient-to-br from-red-600 to-red-700 text-white font-bold text-xl h-10 flex items-center justify-center rounded"
          >
            {letter}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`aspect-square flex items-center justify-center text-lg font-bold rounded transition-all ${
                cell.isFree
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900'
                  : cell.marked
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white scale-95'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cell.isFree ? 'FREE' : cell.number}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

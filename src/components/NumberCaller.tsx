import type { CalledNumber } from '../types/database';

type NumberCallerProps = {
  calledNumbers: CalledNumber[];
  onCallNumber: () => void;
  isHost: boolean;
  gameStatus: string;
  isCalling: boolean;
};

export default function NumberCaller({
  calledNumbers,
  onCallNumber,
  isHost,
  gameStatus,
  isCalling,
}: NumberCallerProps) {
  const sortedNumbers = [...calledNumbers].sort((a, b) =>
    new Date(b.called_at).getTime() - new Date(a.called_at).getTime()
  );

  const lastNumber = sortedNumbers[0];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Number Caller</h2>

      {lastNumber && (
        <div className="mb-6 text-center">
          <div className="inline-block bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-8 shadow-xl">
            <div className="text-6xl font-bold mb-2">{lastNumber.number}</div>
            <div className="text-lg opacity-90">Latest Number</div>
          </div>
        </div>
      )}

      {isHost && gameStatus === 'playing' && (
        <button
          onClick={onCallNumber}
          disabled={isCalling}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mb-6"
        >
          {isCalling ? 'Calling...' : 'Call Next Number'}
        </button>
      )}

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-700 mb-3">
          Called Numbers ({calledNumbers.length}/75)
        </h3>
        <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
          {sortedNumbers.map((num) => (
            <div
              key={num.id}
              className="bg-gray-100 text-gray-700 font-semibold rounded p-2 text-center text-sm"
            >
              {num.number}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

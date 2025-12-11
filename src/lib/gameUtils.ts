export type BingoCell = {
  number: number;
  marked: boolean;
  isFree?: boolean;
};

export type BingoBoard = BingoCell[][];

const BINGO_RANGES = {
  B: { min: 1, max: 15 },
  I: { min: 16, max: 30 },
  N: { min: 31, max: 45 },
  G: { min: 46, max: 60 },
  O: { min: 61, max: 75 },
};

function getRandomNumbers(min: number, max: number, count: number): number[] {
  const numbers: number[] = [];
  const available = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    numbers.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }

  return numbers;
}
const nums = getRandomNumbers(1, 50, 5);
console.log(nums);
export function generateBingoBoard(): BingoBoard {
  const board: BingoBoard = [];
  const columns = ['B', 'I', 'N', 'G', 'O'] as const;

  for (let row = 0; row < 5; row++) {
    board[row] = [];
    for (let col = 0; col < 5; col++) {
      const column = columns[col];
      const range = BINGO_RANGES[column];

      if (row === 2 && col === 2) {
        board[row][col] = {
          number: 0,
          marked: true,
          isFree: true,
        };
      } else {
        const existingNumbers = board
          .map(r => r[col])
          .filter(cell => cell && !cell.isFree)
          .map(cell => cell.number);

        let number: number;
        do {
          number = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        } while (existingNumbers.includes(number));

        board[row][col] = {
          number,
          marked: false,
        };
      }
    }
  }

  return board;
}

export function checkForBingo(board: BingoBoard): boolean {
  for (let i = 0; i < 5; i++) {
    if (board[i].every(cell => cell.marked)) return true;
  }

  for (let col = 0; col < 5; col++) {
    if (board.every(row => row[col].marked)) return true;
  }

  if (board.every((row, i) => row[i].marked)) return true;

  if (board.every((row, i) => row[4 - i].marked)) return true;

  return false;
}

export function markNumber(board: BingoBoard, calledNumber: number): BingoBoard {
  return board.map(row =>
    row.map(cell =>
      cell.number === calledNumber ? { ...cell, marked: true } : cell
    )
  );
}

export function serializeBoard(board: BingoBoard): number[][] {
  return board.map(row => row.map(cell => cell.number));
}

export function deserializeBoard(boardData: number[][], markedCells: number[] = []): BingoBoard {
  return boardData.map((row, rowIndex) =>
    row.map((number, colIndex) => ({
      number,
      marked: markedCells.includes(rowIndex * 5 + colIndex) || (rowIndex === 2 && colIndex === 2),
      isFree: rowIndex === 2 && colIndex === 2,
    }))
  );
}

export function getBoardMarkedCells(board: BingoBoard): number[] {
  const marked: number[] = [];
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.marked && !cell.isFree) {
        marked.push(rowIndex * 5 + colIndex);
      }
    });
  });
  return marked;
}

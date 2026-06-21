import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';

const ROWS = 10;
const COLS = 10;
const MINES = 15;

const createBoard = () => {
  let board = Array(ROWS).fill().map(() => Array(COLS).fill({ isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0 }));
  
  // Place mines
  let minesPlaced = 0;
  while (minesPlaced < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!board[r][c].isMine) {
      board[r][c] = { ...board[r][c], isMine: true };
      minesPlaced++;
    }
  }

  // Calculate neighbors
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c].isMine) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (r + i >= 0 && r + i < ROWS && c + j >= 0 && c + j < COLS) {
              if (board[r + i][c + j].isMine) count++;
            }
          }
        }
        board[r][c] = { ...board[r][c], neighborMines: count };
      }
    }
  }
  return board;
};

export default function Minesweeper({ onClose }) {
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    setBoard(createBoard());
  }, []);

  const revealCell = (r, c) => {
    if (gameOver || won || board[r][c].isRevealed || board[r][c].isFlagged) return;

    let newBoard = [...board];
    newBoard[r] = [...newBoard[r]];
    newBoard[r][c] = { ...newBoard[r][c], isRevealed: true };

    if (newBoard[r][c].isMine) {
      setGameOver(true);
      setBoard(newBoard);
      return;
    }

    if (newBoard[r][c].neighborMines === 0) {
      // flood fill logic for empty cells
      const stack = [[r, c]];
      while (stack.length > 0) {
        const [currR, currC] = stack.pop();
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const nr = currR + i;
            const nc = currC + j;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isMine && !newBoard[nr][nc].isFlagged) {
                newBoard[nr] = [...newBoard[nr]];
                newBoard[nr][nc] = { ...newBoard[nr][nc], isRevealed: true };
                if (newBoard[nr][nc].neighborMines === 0) {
                  stack.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    setBoard(newBoard);
    checkWin(newBoard);
  };

  const toggleFlag = (e, r, c) => {
    e.preventDefault();
    if (gameOver || won || board[r][c].isRevealed) return;
    
    let newBoard = [...board];
    newBoard[r] = [...newBoard[r]];
    newBoard[r][c] = { ...newBoard[r][c], isFlagged: !newBoard[r][c].isFlagged };
    setBoard(newBoard);
  };

  const checkWin = (currentBoard) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!currentBoard[r][c].isMine && !currentBoard[r][c].isRevealed) return;
      }
    }
    setWon(true);
  };

  const restart = () => {
    setBoard(createBoard());
    setGameOver(false);
    setWon(false);
  };

  const getCellContent = (cell) => {
    if (cell.isFlagged) return '🚩';
    if (!cell.isRevealed) return '';
    if (cell.isMine) return '💣';
    if (cell.neighborMines === 0) return '';
    return cell.neighborMines;
  };

  const getCellColor = (mines) => {
    const colors = ['#000', 'blue', 'green', 'red', 'purple', 'maroon', 'turquoise', 'black', 'gray'];
    return colors[mines] || '#000';
  };

  if (!board.length) return null;

  return (
    <Rnd
      default={{
        x: 100,
        y: 100,
        width: 320,
        height: 'auto'
      }}
      bounds="window"
      dragHandleClassName="title-bar"
      style={{ zIndex: 3000 }}
    >
      <div className="window" style={{ width: '100%', height: '100%', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)', background: '#dfdfdf' }}>
        <div className="title-bar" style={{ background: '#000080', cursor: 'move' }}>
          <span>💣 Minesweeper</span>
          <button className="btn" onClick={onClose} style={{ padding: '0px 4px', fontWeight: 'bold' }}>X</button>
        </div>
        
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <button className="btn" style={{ fontSize: '20px', padding: '5px' }} onClick={restart}>
              {gameOver ? '😵' : won ? '😎' : '🙂'}
            </button>
          </div>
          
          <div style={{ border: '3px inset #fff', background: '#c0c0c0' }}>
            {board.map((row, r) => (
              <div key={r} style={{ display: 'flex' }}>
                {row.map((cell, c) => (
                  <div 
                    key={c}
                    onClick={() => revealCell(r, c)}
                    onContextMenu={(e) => toggleFlag(e, r, c)}
                    style={{
                      width: '24px',
                      height: '24px',
                      border: cell.isRevealed ? '1px solid #808080' : '2px outset #fff',
                      background: cell.isRevealed ? '#dfdfdf' : '#c0c0c0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: getCellColor(cell.neighborMines),
                      cursor: 'pointer'
                    }}
                  >
                    {getCellContent(cell)}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {(gameOver || won) && (
            <div style={{ marginTop: '10px', fontWeight: 'bold', color: won ? 'green' : 'red' }}>
              {won ? 'You Win!' : 'Game Over'}
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}

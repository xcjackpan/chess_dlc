import React, { useState } from 'react';
import "./Board.css";

const OccupyState = {
  NONE: 0,
  WHITE_PAWN: 1,
  WHITE_KNIGHT: 2,
  WHITE_BISHOP: 3,
  WHITE_ROOK: 4,
  WHITE_QUEEN: 5,
  WHITE_KING: 6,
  BLACK_PAWN: -1,
  BLACK_KNIGHT: -2,
  BLACK_BISHOP: -3,
  BLACK_ROOK: -4,
  BLACK_QUEEN: -5,
  BLACK_KING: -6,
}

function renderSquare(x: number, y: number, piece: number, selected: boolean, selectSquare: any) {
  return (
    <div
      className={`square${selected ? ` selected` : ``}`}
      key={`${x}-${y}`}
      onClick={()=>{selectSquare([x,y])}}
    >
      {`${piece}`}
    </div>
  )
}

function Game() {
  const [boardState, setBoardState] = useState(null);
  const [playerTurn, setTurn] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState([-1,-1])

  function selectSquare(newSquare: number[]) {
    // 1. Check if there is a currently selected square. If not, select newSquare and done.
    // 2. If there is a currently selected square, check if there is a piece there. If not, select newSquare and done.
    // 3. If there is a currently selected piece, check if the new selection is a valid move. If not, select newSquare and done.
    // 4. This is a valid move. Make the move and done.

    if (newSquare[0] == selectedSquare[0] && newSquare[1] == selectedSquare[1]) {
      setSelectedSquare([-1, -1])
    } else {
      setSelectedSquare(newSquare)
    }
  }

  // Handle a null board
  let board: number[][]
  if (boardState == null) {
    board = []
    for (let x = 0; x < 8; x++) {
      board.push([])
      for (let y = 0; y < 8; y++) {
        board[x].push(OccupyState.NONE)
      }
    }
  } else {
    board = boardState!
  }

  return (
    <div className="board">
      {board.map(
        (row, x) => (
          <div className="row" key={x}>
            {row.map((occupant, y) => renderSquare(
              x,
              y,
              occupant,
              (selectedSquare[0] === x && selectedSquare[1] === y),
              selectSquare,
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default Game;

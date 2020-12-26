import React, { useState } from "react";
import "./Board.css";
import { PieceType, getPieceAt, oppositeSign, squaresEqual, coordinate, gameprops } from "./Utils";
import { buildPiece, copyPiece, Piece } from "./Piece";

const emptyBoard = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0]
]

const testBoard = [
  [-4,-2,-3,-5,-6,-3,-2,-4],
  [-1,-1,-1,-1,-1,-1,-1,-1],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1],
  [4,2,3,5,6,3,2,4]
]

function processBoard(board: number[][]) {
  let res: Piece[][] = [[],[],[],[],[],[],[],[]]
  board.forEach((row, y) => {
    row.forEach((elem) => {
      res[y].push(buildPiece(elem))
    })
  })
  return res
}

function renderSquare(coord: coordinate, piece: number, selected: boolean, selectSquare: any) {
  return (
    <div
      className={`square${selected ? ` selected` : ``}`}
      key={`${coord[0]}-${coord[1]}`}
      onClick={()=>{selectSquare(coord)}}
    >
      {`${piece}`}
    </div>
  )
}

function Board(props: gameprops) {
  let { currPlayer, initTurn } = props
  let processed: Piece[][] = processBoard(testBoard)

  const [boardState, setBoardState]: [Piece[][], any] = useState(processed);
  const [selectedSquare, setSelectedSquare]: [coordinate, any] = useState([-1,-1])
  const [currTurn, setTurn] = useState(initTurn);

  function makeMove(piece: coordinate, newSquare: coordinate, extraInfo?: any) {
    // Move is guaranteed to be valid
    // Build a copy of the board
    let newBoard: Piece[][] = [[],[],[],[],[],[],[],[]]
    boardState.forEach((row, y) => {
      row.forEach((elem) => {
        newBoard[y].push(copyPiece(elem))
      })
    })

    if (extraInfo.hasOwnProperty("castle") && extraInfo["castle"]) {
      const rookPos = extraInfo["rookPos"]
      const kingPos = extraInfo["kingPos"]

      // King moves two squares in direction of rook
      const yDiff = rookPos[1] - kingPos[1]
      const yInc = yDiff > 0 ? 1 : -1

      newBoard[kingPos[0]][kingPos[1]+(2*yInc)] = getPieceAt(kingPos, boardState)
      newBoard[kingPos[0]][kingPos[1]+(2*yInc)-(yInc)] = getPieceAt(rookPos, boardState)
      newBoard[kingPos[0]][kingPos[1]] = buildPiece(0)
      newBoard[rookPos[0]][rookPos[1]] = buildPiece(0)

    } else if (extraInfo.hasOwnProperty("enpassant") && extraInfo["enpassant"]) {
      newBoard[newSquare[0]][newSquare[1]] = getPieceAt(piece, boardState)
      newBoard[piece[0]][piece[1]] = buildPiece(0)
    
      const movedPiece = getPieceAt(newSquare, boardState)
      const diff = movedPiece.type === PieceType.WHITE_PAWN ? 1 : -1
      newBoard[newSquare[0]-diff][newSquare[1]] = buildPiece(0)
    } else {
      newBoard[newSquare[0]][newSquare[1]] = getPieceAt(piece, boardState)
      newBoard[piece[0]][piece[1]] = buildPiece(0)
    }

    newBoard[newSquare[0]][newSquare[1]].postMove(piece, newSquare, boardState)
    newBoard.forEach((row, y) => {
      row.forEach((elem, x) => {
        elem.turnTick([x,y], newBoard)
      })
    })

    setBoardState(newBoard)
  }

  function selectSquare(newSquare: coordinate) {
    // 1. Check if there is a currently selected square. If not, select newSquare and done.
    if (squaresEqual(newSquare, selectedSquare)) {
      setSelectedSquare([-1, -1])
      return
    } else if (squaresEqual(selectedSquare, [-1, -1])) {
      setSelectedSquare(newSquare)
      return
    }

    // 2. If there is a currently selected square, check if there is a piece there. If not, select newSquare and done.
    const pieceOnSquare: Piece = boardState[selectedSquare[0]][selectedSquare[1]]
    if (pieceOnSquare.type === PieceType.NONE) {
      setSelectedSquare(newSquare)
      return
    }

    const isCurrentTurn = (currTurn === currPlayer)
    if (isCurrentTurn && !oppositeSign(pieceOnSquare.type, currPlayer)) {
      // 3. There is a currently selected piece, check if the new selection is a valid move. If not, select newSquare and done.
      const [isValid, extraInfo] = pieceOnSquare.validateMove(selectedSquare, newSquare, boardState)
      if (isValid) {
        // 4. Move the piece
        makeMove(selectedSquare, newSquare, extraInfo)
        setSelectedSquare([-1, -1])
        setTurn(currTurn*-1)
      }
    }

    setSelectedSquare(newSquare)
  }

  return (
    <div className="board">
      {boardState.map(
        (row, x) => (
          <div className="row" key={x}>
            {row.map((occupant, y) => renderSquare(
              [x,y],
              occupant.type,
              squaresEqual(selectedSquare, [x,y]),
              selectSquare,
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default Board;

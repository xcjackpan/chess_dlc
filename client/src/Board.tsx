import { useState } from "react";
import "./Board.css";
import { PieceType, getPieceAt, oppositeSign, squaresEqual, coordinate, gameprops, PlayerType } from "./Utils";
import { buildPiece, copyPiece, Piece, deserializePiece, serializePiece } from "./Piece";

export function deserializeBoardState(receivedBoardState: string, currPlayer: number) {
  const parsed = JSON.parse(receivedBoardState)
  let boardToReturn: Piece[][] = [[],[],[],[],[],[],[],[]]

  parsed["boardState"].forEach((row: string[], y: number) => {
    row.forEach((pieceAsString) => {
      boardToReturn[y].push(deserializePiece(pieceAsString))
    })
  })

  if (currPlayer === PlayerType.BLACK) {
    boardToReturn = flipBoard(boardToReturn)
  }

  const deserialized = {
    "boardState": boardToReturn,
    "currTurn": parsed["currTurn"],
  }

  return deserialized
}

function serializeBoardState(boardState: Piece[][], currTurn: number, currPlayer: number) {
  // Serializes a board of Piece objects into a sending JSON string
  let boardToSerialize = boardState
  if (currPlayer === PlayerType.BLACK) {
    boardToSerialize = flipBoard(boardToSerialize)
  }
  let serialized: string[][] = [[],[],[],[],[],[],[],[]]
  boardToSerialize.forEach((row, y) => {
    row.forEach((elem) => {
      serialized[y].push(serializePiece(elem))
    })
  })

  const data = {
    "boardState": serialized,
    "currTurn": currTurn,
  }

  return JSON.stringify(data)
}

export function processBoard(board: number[][]) {
  let res: Piece[][] = [[],[],[],[],[],[],[],[]]
  board.forEach((row, y) => {
    row.forEach((elem) => {
      res[y].push(buildPiece(elem))
    })
  })
  return res
}

export function flipBoard(board: Piece[][]) {
  // Will need to reverse each row and then reverse all the columns
  return board.slice(0).reverse().map((row) => {
    return row.slice(0).reverse()
  })
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
  let { currPlayer, currTurn } = props

  const [selectedSquare, setSelectedSquare]: [coordinate, any] = useState([-1,-1])

  async function updateBoardState(newBoard: Piece[][]) {
    const serialized = serializeBoardState(newBoard, currTurn*-1, currPlayer)

    while (true) {
      if (props.sendToSocket(serialized)) {
        props.updateBoardState(newBoard)
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  function makeMove(piece: coordinate, newSquare: coordinate, extraInfo?: any) {
    // Move is guaranteed to be valid
    // Build a copy of the board
    let newBoard: Piece[][] = [[],[],[],[],[],[],[],[]]
    props.boardState.forEach((row, y) => {
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

      newBoard[kingPos[0]][kingPos[1]+(2*yInc)] = getPieceAt(kingPos, props.boardState)
      newBoard[kingPos[0]][kingPos[1]+(2*yInc)-(yInc)] = getPieceAt(rookPos, props.boardState)
      newBoard[kingPos[0]][kingPos[1]] = buildPiece(0)
      newBoard[rookPos[0]][rookPos[1]] = buildPiece(0)

    } else if (extraInfo.hasOwnProperty("enpassant") && extraInfo["enpassant"]) {
      newBoard[newSquare[0]][newSquare[1]] = getPieceAt(piece, props.boardState)
      newBoard[piece[0]][piece[1]] = buildPiece(0)
    
      const movedPiece = getPieceAt(newSquare, props.boardState)
      const diff = movedPiece.type === PieceType.WHITE_PAWN ? 1 : -1
      newBoard[newSquare[0]-diff][newSquare[1]] = buildPiece(0)
    } else {
      newBoard[newSquare[0]][newSquare[1]] = getPieceAt(piece, props.boardState)
      newBoard[piece[0]][piece[1]] = buildPiece(0)
    }

    newBoard[newSquare[0]][newSquare[1]].postMove(piece, newSquare, props.boardState)
    newBoard.forEach((row, y) => {
      row.forEach((elem, x) => {
        elem.turnTick([x,y], newBoard)
      })
    })

    updateBoardState(newBoard)
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
    const pieceOnSquare: Piece = props.boardState[selectedSquare[0]][selectedSquare[1]]
    if (pieceOnSquare.type === PieceType.NONE) {
      setSelectedSquare(newSquare)
      return
    }

    const isCurrentTurn = (currTurn === currPlayer)
    if (isCurrentTurn && !oppositeSign(pieceOnSquare.type, currPlayer)) {
      // 3. There is a currently selected piece, check if the new selection is a valid move. If not, select newSquare and done.
      const [isValid, extraInfo] = pieceOnSquare.validateMove(selectedSquare, newSquare, props.boardState)
      if (isValid) {
        // 4. Move the piece
        makeMove(selectedSquare, newSquare, extraInfo)
        setSelectedSquare([-1, -1])
      }
    }

    setSelectedSquare(newSquare)
  }

  return (
    <div className="board">
      {props.boardState.map(
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

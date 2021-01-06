import { useState } from "react";
import "./Board.css";
import { PieceType, getPieceAt, oppositeSign, squaresEqual, coordinate, move, gameprops, PlayerType } from "./Utils";
import { buildPiece, copyPiece, getValidKnightMoves, getValidKingMoves, isSquareUnderAttack, Piece, deserializePiece, serializePiece } from "./Piece";
import BlackBishop from "./merida_new/bb.svg"
import BlackKnight from "./merida_new/bn.svg"
import BlackPawn from "./merida_new/bp.svg"
import BlackQueen from "./merida_new/bq.svg"
import BlackKing from "./merida_new/bk.svg"
import BlackRook from "./merida_new/br.svg"
import WhiteBishop from "./merida_new/wb.svg"
import WhiteKnight from "./merida_new/wn.svg"
import WhitePawn from "./merida_new/wp.svg"
import WhiteQueen from "./merida_new/wq.svg"
import WhiteKing from "./merida_new/wk.svg"
import WhiteRook from "./merida_new/wr.svg"


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

  let deserialized: any = {
    "boardState": boardToReturn,
    "currTurn": parsed["currTurn"],
  }
  if (parsed.hasOwnProperty("winner")) {
    deserialized["winner"] = parsed["winner"]
    // TODO: Proper modal
    window.alert("Winner is " + (parsed["winner"] === 1 ? "white" : "black"))
  }

  return deserialized
}

function serializeBoardState(boardState: Piece[][], currTurn: number, currPlayer: number, checkmate: boolean) {
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

  let data: any = {
    "boardState": serialized,
    "currTurn": currTurn,
  }
  if (checkmate) {
    data["winner"] = currPlayer
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
  
  function getAsset(piece: number) {
    switch(piece) {
      case PieceType.BLACK_BISHOP:
        return BlackBishop
      case PieceType.BLACK_KING:
        return BlackKing
      case PieceType.BLACK_KNIGHT:
        return BlackKnight
      case PieceType.BLACK_PAWN:
        return BlackPawn
      case PieceType.BLACK_QUEEN:
        return BlackQueen
      case PieceType.BLACK_ROOK:
        return BlackRook
      case PieceType.WHITE_BISHOP:
        return WhiteBishop
      case PieceType.WHITE_KING:
        return WhiteKing
      case PieceType.WHITE_KNIGHT:
        return WhiteKnight
      case PieceType.WHITE_PAWN:
        return WhitePawn
      case PieceType.WHITE_QUEEN:
        return WhiteQueen
      case PieceType.WHITE_ROOK:
        return WhiteRook
    }
  }

  return (
    <div
      className={`square${selected ? ` selected` : ``}`}
      key={`${coord[0]}-${coord[1]}`}
      onClick={()=>{selectSquare(coord)}}
    >
      <img className="piece" src={getAsset(piece)} />
    </div>
  )
}

function makeMove(boardState: Piece[][], oldSquare: coordinate, newSquare: coordinate, extraInfo?: any) {
  // Build a copy of the board
  let newBoard: Piece[][] = [[],[],[],[],[],[],[],[]]
  boardState.forEach((row, y) => {
    row.forEach((elem) => {
      newBoard[y].push(copyPiece(elem))
    })
  })

  let postMovePieces = []

  if (extraInfo.hasOwnProperty("castle") && extraInfo["castle"]) {
    const rookPos = extraInfo["rookPos"]
    const kingPos = extraInfo["kingPos"]

    // King moves two squares in direction of rook
    const yDiff = rookPos[1] - kingPos[1]
    const yInc = yDiff > 0 ? 1 : -1

    const newRookPos = [kingPos[0], kingPos[1]+(2*yInc)-(yInc)]
    const newKingPos = [kingPos[0], kingPos[1]+(2*yInc)]

    newBoard[newKingPos[0]][newKingPos[1]] = getPieceAt(kingPos, boardState)
    newBoard[newRookPos[0]][newRookPos[1]] = getPieceAt(rookPos, boardState)

    postMovePieces.push([kingPos, newKingPos])
    postMovePieces.push([rookPos, newRookPos])

    newBoard[kingPos[0]][kingPos[1]] = buildPiece(PieceType.NONE)
    newBoard[rookPos[0]][rookPos[1]] = buildPiece(PieceType.NONE)
  } else if (extraInfo.hasOwnProperty("enpassant") && extraInfo["enpassant"]) {
    postMovePieces.push([oldSquare, newSquare])

    newBoard[newSquare[0]][newSquare[1]] = getPieceAt(oldSquare, boardState)
    newBoard[oldSquare[0]][oldSquare[1]] = buildPiece(PieceType.NONE)
  
    const movedPiece = getPieceAt(newSquare, boardState)
    const diff = movedPiece.type === PieceType.WHITE_PAWN ? 1 : -1
    newBoard[newSquare[0]-diff][newSquare[1]] = buildPiece(0)
  } else {
    postMovePieces.push([oldSquare, newSquare])

    newBoard[newSquare[0]][newSquare[1]] = getPieceAt(oldSquare, boardState)
    newBoard[oldSquare[0]][oldSquare[1]] = buildPiece(0)
  }

  postMovePieces.forEach((elem) => {
    newBoard[elem[1][0]][elem[1][1]].postMove(elem[0], elem[1], boardState)
  })

  newBoard.forEach((row, y) => {
    row.forEach((elem, x) => {
      elem.turnTick([x,y], newBoard)
    })
  })

  return newBoard
}

function Board(props: gameprops) {
  let { currPlayer, currTurn } = props

  const [selectedSquare, setSelectedSquare]: [coordinate, any] = useState([-1,-1])

  async function updateBoardState(newBoard: Piece[][], checkmate: boolean) {
    const serialized = serializeBoardState(newBoard, currTurn*-1, currPlayer, checkmate)

    while (true) {
      if (props.sendToSocket(serialized)) {
        props.updateBoardState(newBoard)
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  function validateChecks(piece: coordinate, newSquare: coordinate, extraInfo?: any): [boolean, boolean, Piece[][]] {
    const simulatedBoard = makeMove(props.boardState, piece, newSquare, extraInfo)
    let opponentKing: coordinate = [-1,-1]
    let allyKing: coordinate = [-1,-1]
    // Find both kings
    simulatedBoard.forEach((row, x) => {
      row.forEach((elem, y) => {
        if ([PieceType.BLACK_KING, PieceType.WHITE_KING].includes(elem.type)) {
          if (oppositeSign(elem.type, currPlayer)) {
            opponentKing = [x, y]
          } else {
            allyKing = [x, y]
          }
        }
      })
    })

    // A move is valid so long as the player is not in check after the move
    const playerInCheck = isSquareUnderAttack(allyKing, currPlayer, simulatedBoard)
    const opponentInCheck = isSquareUnderAttack(opponentKing, -1*currPlayer, simulatedBoard)
    return [playerInCheck, opponentInCheck, simulatedBoard]
  }

  function isOpponentMated(boardState: Piece[][]) {
    let validMoves: move[] = []
    const cardinalIncs = [
      [1,0],
      [0,1],
      [-1,0],
      [0,-1]
    ]
    const diagonalIncs = [
      [1,1],
      [-1,1],
      [1,-1],
      [-1,-1]
    ]
  
    boardState.forEach((row, x) => {
      row.forEach((elem, y) => {
        if (elem.type !== PieceType.NONE && oppositeSign(currPlayer, elem.type)) {
          // If the piece is not none and they are the opponents
          const piecePos: coordinate = [x, y]
          const candidateNewPos: coordinate[] = []
          if ([PieceType.BLACK_KING, PieceType.WHITE_KING].includes(elem.type)) {
            const possibleKingMoves: coordinate[] = getValidKingMoves(piecePos) // Can't castle out of check!
            possibleKingMoves.forEach((newPos) => {
              candidateNewPos.push(newPos)
            })
          } else if ([PieceType.BLACK_BISHOP, PieceType.WHITE_BISHOP].includes(elem.type)) {
            diagonalIncs.forEach((increments) => {
              // Increments is an [xInc, yInc]
              let xInc = increments[0]
              let yInc = increments[1]
              while (Math.abs(xInc) <= 8 && Math.abs(yInc) <= 8) {
                candidateNewPos.push([x+xInc, y+yInc])
                xInc += increments[0]
                yInc += increments[1]
              }
            })
          } else if ([PieceType.BLACK_KNIGHT, PieceType.WHITE_KNIGHT].includes(elem.type)) {
            const possibleKnightMoves: coordinate[] = getValidKnightMoves(piecePos)
            possibleKnightMoves.forEach((newPos) => {
              candidateNewPos.push(newPos)
            })
          } else if ([PieceType.BLACK_ROOK, PieceType.WHITE_ROOK].includes(elem.type)) {
            cardinalIncs.forEach((increments) => {
              // Increments is an [xInc, yInc]
              let xInc = increments[0]
              let yInc = increments[1]
              while (Math.abs(xInc) <= 8 && Math.abs(yInc) <= 8) {
                candidateNewPos.push([x+xInc, y+yInc])
                xInc += increments[0]
                yInc += increments[1]
              }
            })
          } else if ([PieceType.BLACK_QUEEN, PieceType.WHITE_QUEEN].includes(elem.type)) {
            diagonalIncs.forEach((increments) => {
              // Increments is an [xInc, yInc]
              let xInc = increments[0]
              let yInc = increments[1]
              while (Math.abs(xInc) <= 8 && Math.abs(yInc) <= 8) {
                candidateNewPos.push([x+xInc, y+yInc])
                xInc += increments[0]
                yInc += increments[1]
              }
            })
  
            cardinalIncs.forEach((increments) => {
              // Increments is an [xInc, yInc]
              let xInc = increments[0]
              let yInc = increments[1]
              while (Math.abs(xInc) <= 8 && Math.abs(yInc) <= 8) {
                candidateNewPos.push([x+xInc, y+yInc])
                xInc += increments[0]
                yInc += increments[1]
              }
            })
          } else if ([PieceType.BLACK_PAWN, PieceType.WHITE_PAWN].includes(elem.type)) {
            // Opposing pawn
            candidateNewPos.push([x+1, y])
            candidateNewPos.push([x+1, y+1])
            candidateNewPos.push([x+1, y-1])
          }
  
          candidateNewPos.forEach((newPos) => {
            const validationResult = elem.validateMove([x,y], newPos, boardState)
            if (validationResult[0]) {
              validMoves.push([[x,y], newPos, validationResult[1]])
            }
          })
        }
      })
    })
  
    // Opponent is mated if for every valid move, they are still in check
    // Check this manually
    return validMoves.every((elem) => {
      const simulatedBoard = makeMove(boardState, elem[0], elem[1], elem[2])
      let opponentKing: coordinate = [-1,-1]
      simulatedBoard.forEach((row, x) => {
        row.forEach((elem, y) => {
          if ([PieceType.BLACK_KING, PieceType.WHITE_KING].includes(elem.type)) {
            if (oppositeSign(elem.type, currPlayer)) {
              opponentKing = [x, y]
            }
          }
        })
      })
      return isSquareUnderAttack(opponentKing, -1*currPlayer, simulatedBoard)
    })
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
      const [isValidMove, extraInfo] = pieceOnSquare.validateMove(selectedSquare, newSquare, props.boardState)
      if (isValidMove) {
        // 4. Validate for checks and checkmates
        const [playerInCheck, opponentInCheck, newBoard] = validateChecks(selectedSquare, newSquare, extraInfo)
        if (!playerInCheck) {
          // 5. If the opponent is in check, see if we have a mate
          updateBoardState(newBoard, opponentInCheck && isOpponentMated(newBoard))
          setSelectedSquare([-1, -1])
          return
        }
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

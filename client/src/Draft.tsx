import axios from "axios";
import { useHistory } from "react-router-dom";
import "./Draft.css";
import React, { useEffect, useState } from "react";
import { coordinate, PieceType, PlayerType, squaresContainedBy, squaresEqual } from "./Utils";
import { renderSquare } from "./Board";

const emptyWhiteDraft = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,6,0,0,0],
]

const emptyBlackDraft = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,-6,0,0,0,0],
]

const pointTotal = 39

const bishopSquares: coordinate[] = [[1,2], [1,5]]
const knightSquares: coordinate[] = [[1,1], [1,6]]
const whiteQueenSquare: coordinate = [1,3]
const blackQueenSquare: coordinate = [1,4]
const rookSquares: coordinate[] = [[1,0], [1,7]]

const rookPieces: number[] = [PieceType.NONE, PieceType.WHITE_ROOK]
const bishopPieces: number[] = [PieceType.NONE, PieceType.WHITE_BISHOP]
const knightPieces: number[] = [PieceType.NONE, PieceType.WHITE_KNIGHT]
const queenPieces: number[] = [PieceType.NONE, PieceType.WHITE_QUEEN]
const pawnPieces: number[] = [PieceType.NONE, PieceType.WHITE_PAWN]

function pieceToPoints(piece: number) {
  switch(piece) {
    case PieceType.BLACK_BISHOP:
      return 3
    case PieceType.BLACK_KING:
      return 0
    case PieceType.BLACK_KNIGHT:
      return 3
    case PieceType.BLACK_PAWN:
      return 1
    case PieceType.BLACK_QUEEN:
      return 9
    case PieceType.BLACK_ROOK:
      return 5
    case PieceType.WHITE_BISHOP:
      return 3
    case PieceType.WHITE_KING:
      return 0
    case PieceType.WHITE_KNIGHT:
      return 3
    case PieceType.WHITE_PAWN:
      return 1
    case PieceType.WHITE_QUEEN:
      return 9
    case PieceType.WHITE_ROOK:
      return 5
  }
  return 0
}

function Draft(props: any) {
  const history = useHistory()

  let { currPlayer, submitDraft } = props
  const [currDraft, setCurrDraft]: [number[][], any] = useState(currPlayer === PlayerType.BLACK ? emptyBlackDraft : emptyWhiteDraft)
  const [currPoints, setPoints]: [number, any] = useState(pointTotal)
  const [selectedSquare, setSelectedSquare]: [coordinate, any] = useState([-1,-1])

  function selectSquare(newSquare: coordinate) {
    // 1. Check if there is a currently selected square. If not, select newSquare and done.
    if (squaresEqual(newSquare, selectedSquare)) {
      setSelectedSquare([-1, -1])
      return
    }

    setSelectedSquare(newSquare)
  }

  function availablePieces() {
    let res: number[] = []
    if (selectedSquare[0] === 0) {
      res = pawnPieces
    } else if (currPlayer === PlayerType.WHITE && squaresEqual(selectedSquare, whiteQueenSquare)) {
      res = queenPieces
    } else if (currPlayer === PlayerType.BLACK && squaresEqual(selectedSquare, blackQueenSquare)) {
      res = queenPieces
    } else if (squaresContainedBy(rookSquares, selectedSquare)) {
      res = rookPieces
    } else if (squaresContainedBy(bishopSquares, selectedSquare)) {
      res = bishopPieces
    } else if (squaresContainedBy(knightSquares, selectedSquare)) {
      res = knightPieces
    }

    return res.map((elem) => currPlayer*elem)
  }

  function draftPiece(piece: number) {
    let newDraft: number[][] = [[],[]]
    let newPointTotal = pointTotal
    currDraft.forEach((row, y) => {
      row.forEach((elem, x) => {
        if (squaresEqual(selectedSquare, [y,x])) {
          newDraft[y].push(piece)
          newPointTotal -= pieceToPoints(piece)
        } else {
          newDraft[y].push(elem)
          newPointTotal -= pieceToPoints(elem)
        }
      })
    })
    setCurrDraft(newDraft)
    setPoints(newPointTotal)
  }

  return (
    <div>
      <div className="draft">
        {currDraft.map(
          (row, x) => (
            <div className="row" key={x}>
              {row.map((occupant, y) => renderSquare(
                [x,y],
                occupant,
                squaresEqual(selectedSquare, [x,y]),
                selectSquare,
              ))}
            </div>
          )
        )}
      </div>
      <div className="row">
        {availablePieces().map(
          (piece, idx) => {
            return renderSquare(
              [-1,idx],
              piece,
              squaresEqual(selectedSquare, [-1,idx]),
              () => {draftPiece(piece)},
            )
          }
        )}
      </div>
      <div className="points">{currPoints}</div>
      <div onClick={() => submitDraft(currDraft)}>submit</div>
    </div>
  )
}

export default Draft;
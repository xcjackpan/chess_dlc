import { buildPiece, Piece } from "./Piece";

export type coordinate = [number, number]

export type move = [coordinate, coordinate, any]

export type gameprops = {
  boardState: Piece[][]
  currPlayer: number,
  currTurn: number,
  currWinner: number,
  updateBoardState: any,
  sendToSocket: any,
}

export const GameState = {
  LOADING: -1,
  PLAYER_SELECT: 0,
  DRAFT: 1,
  BOARD: 2,
}

export const PlayerType = {
  UNKNOWN: -100,
  STALEMATE: -99,
  SPECTATOR: 0,
  WHITE: 1,
  BLACK: -1,
}

export const PieceType = {
  INVALID: -100,
  NONE: 0,
  WHITE_PAWN: 1,
  WHITE_KNIGHT: 2,
  WHITE_BISHOP: 3,
  WHITE_ROOK: 4,
  WHITE_QUEEN: 5,
  WHITE_KING: 6,
  WHITE_ELEPHANT: 7,
  BLACK_PAWN: -1,
  BLACK_KNIGHT: -2,
  BLACK_BISHOP: -3,
  BLACK_ROOK: -4,
  BLACK_QUEEN: -5,
  BLACK_KING: -6,
  BLACK_ELEPHANT: -7,
}

export function squaresEqual(a: coordinate, b: coordinate) {
  return a[0] === b[0] && a[1] === b[1]
}

export function squaresContainedBy(arr: coordinate[], target: coordinate) {
  let found = false
  arr.forEach((elem) => {
    if (squaresEqual(elem, target)) {
      found = true
    }
  })
  return found
}

export function getPieceAt(coord: coordinate, boardState: any[][]): Piece {
  if (coord[0] >= 0 && coord[1] >= 0 && coord[0] < 8 && coord[1] < 8) {
    return boardState[coord[0]][coord[1]]
  }
  return buildPiece(PieceType.INVALID)
}

export function oppositeSign(a: number, b: number) {
  if (a === 0 || b === 0) {
    return true
  }
  return a < 0 ? b > 0 : b < 0
}
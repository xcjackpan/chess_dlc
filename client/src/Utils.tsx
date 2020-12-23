export type coordinate = [number, number]

export const PieceType = {
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

export function squaresEqual(a: coordinate, b: coordinate) {
  return a[0] === b[0] && a[1] === b[1]
}

export function getPieceAt(coord: coordinate, boardState: any[][]) {
  return boardState[coord[0]][coord[1]]
}

export function oppositeSign(a: number, b: number) {
  return a < 0 ? b > 0 : b < 0
}
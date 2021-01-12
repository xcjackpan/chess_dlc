import { PieceType, squaresEqual, oppositeSign, getPieceAt, coordinate } from "./Utils";

function coordinateWithinBoard(coord: coordinate) {
  return (coord[0] < 8 && coord[1] < 8 && coord[0] >= 0 && coord[1] >= 0)
}

function validateDiagMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]): boolean {
  let xDiff = newPos[0] - currPos[0]
  let yDiff = newPos[1] - currPos[1]

  let onDiag = (Math.abs(xDiff) === Math.abs(yDiff))
  if (!onDiag || (xDiff === 0 || yDiff === 0)) {
    return false
  }

  let xInc = xDiff > 0 ? 1 : -1
  let yInc = yDiff > 0 ? 1 : -1
  for (let i = 1; i < Math.abs(xDiff); i++) {
    let candidate = getPieceAt([currPos[0]+(i*xInc), currPos[1]+(i*yInc)], boardState)
    if (candidate.type !== PieceType.NONE) {
      return false
    }
  }

  let currPiece = getPieceAt(currPos, boardState)
  let targetPiece = getPieceAt(newPos, boardState)
  return (targetPiece.type === PieceType.NONE || oppositeSign(targetPiece.type, currPiece.type))
}

function validateCardinalMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]): boolean {
  let xDiff = newPos[0] - currPos[0]
  let yDiff = newPos[1] - currPos[1]

  let onCardinal = (xDiff === 0 && yDiff !== 0) || (xDiff !== 0 && yDiff === 0)
  if (!onCardinal) {
    return false
  }

  let xInc = 0
  let yInc = 0
  let diff = 0

  if (xDiff === 0) {
    diff = yDiff
    yInc = yDiff > 0 ? 1 : -1
  } else {
    diff = xDiff
    xInc = xDiff > 0 ? 1 : -1
  }

  for (let i = 1; i < Math.abs(diff); i++) {
    let candidate = getPieceAt([currPos[0]+(i*xInc), currPos[1]+(i*yInc)], boardState)
    if (candidate.type !== PieceType.NONE) {
      return false
    }
  }

  let currPiece = getPieceAt(currPos, boardState)
  let targetPiece = getPieceAt(newPos, boardState)
  return (targetPiece.type === PieceType.NONE || oppositeSign(targetPiece.type, currPiece.type))
}

function validateCastle(kingPos: coordinate, rookPos: coordinate, boardState: Piece[][]): boolean {
  const king = getPieceAt(kingPos, boardState)
  const rook = getPieceAt(rookPos, boardState)
  const currPlayer = king.type > 0 ? 1 : -1

  if (king.hasMoved || rook.hasMoved || kingPos[0] !== rookPos[0]) {
    return false
  }

  const yDiff = rookPos[1] - kingPos[1]
  const yInc = yDiff > 0 ? 1 : -1
  for (let i = 1; i < Math.abs(yDiff); i++) {
    let candidate = getPieceAt([kingPos[0], kingPos[1]+(i*yInc)], boardState)

    if (candidate.type !== PieceType.NONE) {
      return false
    }
  }

  // Can't castle while in check or through check
  if (
    isSquareUnderAttack(kingPos, currPlayer, boardState)
    || isSquareUnderAttack([kingPos[0], kingPos[1]+(yInc)], currPlayer, boardState)
    || isSquareUnderAttack([kingPos[0], kingPos[1]+(2*yInc)], currPlayer, boardState)
  ) {
    return false
  }

  return true
}

export function getValidKnightMoves(coords: coordinate): coordinate[] {
  return [
    [coords[0]-1, coords[1]-2],
    [coords[0]+1, coords[1]-2],
    [coords[0]-1, coords[1]+2],
    [coords[0]+1, coords[1]+2],
    [coords[0]-2, coords[1]-1],
    [coords[0]+2, coords[1]-1],
    [coords[0]-2, coords[1]+1],
    [coords[0]+2, coords[1]+1],
  ]
}

export function getValidKingMoves(coords: coordinate): coordinate[] {
  return [
    [coords[0]-1, coords[1]-1],
    [coords[0]+1, coords[1]-1],
    [coords[0]-1, coords[1]+1],
    [coords[0]+1, coords[1]+1],
    [coords[0], coords[1]-1],
    [coords[0]+1, coords[1]],
    [coords[0]-1, coords[1]],
    [coords[0], coords[1]+1],
  ]
}

export function isSquareUnderAttack(targetSquare: coordinate, currPlayer: number, boardState: Piece[][]) {
  const validAttackingKnights: coordinate[] = getValidKnightMoves(targetSquare)
  const isAttackedByKnight = validAttackingKnights.some((elem) => {
    const pieceAt = getPieceAt(elem, boardState)
    return ((Math.abs(pieceAt.type) === PieceType.WHITE_KNIGHT) && oppositeSign(pieceAt.type, currPlayer))
  })

  const validAttackingPawns: coordinate[] = [
    [targetSquare[0]-1, targetSquare[1]-1],
    [targetSquare[0]-1, targetSquare[1]+1],
  ]
  const isAttackedByPawn = validAttackingPawns.some((elem) => {
    const pieceAt = getPieceAt(elem, boardState)
    return ((Math.abs(pieceAt.type) === PieceType.WHITE_PAWN) && oppositeSign(pieceAt.type, currPlayer))
  })

  const validAttackingKings: coordinate[] = getValidKingMoves(targetSquare)
  const isAttackedByKing = validAttackingKings.some((elem) => {
    const pieceAt = getPieceAt(elem, boardState)
    return ((Math.abs(pieceAt.type) === PieceType.WHITE_KING) && oppositeSign(pieceAt.type, currPlayer))
  })

  const cardinalIncs = [
    [1,0],
    [0,1],
    [-1,0],
    [0,-1]
  ]
  const cardinalAttackers = [
    // Use WHITE pieces since we're absolute valuing
    PieceType.WHITE_ROOK,
    PieceType.WHITE_QUEEN,
    PieceType.WHITE_ELEPHANT,
  ]
  const isAttackedCardinally = cardinalIncs.some((increments) => {
    // Increments is an [xInc, yInc]
    let pieceAtType = PieceType.NONE
    let xInc = increments[0]
    let yInc = increments[1]
    while (pieceAtType === PieceType.NONE) {
      pieceAtType = getPieceAt([targetSquare[0] + xInc, targetSquare[1] + yInc], boardState).type
      xInc += increments[0]
      yInc += increments[1]
    }
    if (cardinalAttackers.includes(Math.abs(pieceAtType)) && oppositeSign(pieceAtType, currPlayer)) {
      return true
    }

    /*
    TODO: Elephant
    if (pieceAtType !== PieceType.INVALID && oppositeSign(pieceAtType, currPlayer)) {
      // Elephant cannot crush its own piece
      return false
    } else if (pieceAtType !== PieceType.INVALID) {
      pieceAtType = getPieceAt([targetSquare[0] + xInc, targetSquare[1] + yInc], boardState).type
      while (pieceAtType === PieceType.NONE) {
        xInc += increments[0]
        yInc += increments[1]
        pieceAtType = getPieceAt([targetSquare[0] + xInc, targetSquare[1] + yInc], boardState).type
      }

      if ([PieceType.BLACK_ELEPHANT, PieceType.WHITE_ELEPHANT].includes(pieceAtType) && oppositeSign(pieceAtType, currPlayer)) {
        // Is an opposing elephant
        return true
      }
    }
    // Check if the elephant can deliver a mate through crush
    */

    return false
  })

  const diagonalIncs = [
    [1,1],
    [-1,1],
    [1,-1],
    [-1,-1]
  ]
  const diagonalAttackers = [
    // Use WHITE pieces since we're absolute valuing
    PieceType.WHITE_BISHOP,
    PieceType.WHITE_QUEEN,
  ]
  const isAttackedDiagonally = diagonalIncs.some((increments) => {
    // Increments is an [xInc, yInc]
    let pieceAtType = 0
    let xInc = increments[0]
    let yInc = increments[1]
    while (pieceAtType === 0) {
      pieceAtType = getPieceAt([targetSquare[0] + xInc, targetSquare[1] + yInc], boardState).type
      xInc += increments[0]
      yInc += increments[1]
    }
    return (diagonalAttackers.includes(Math.abs(pieceAtType)) && oppositeSign(pieceAtType, currPlayer))
  })

  return (
    isAttackedByKing ||
    isAttackedByKnight ||
    isAttackedByPawn ||
    isAttackedCardinally ||
    isAttackedDiagonally
  )
}

export abstract class Piece {
  public type: number;

  public enPassantable = 0;
  public hasMoved = false;

  abstract validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]): any[];

  // Called after this piece moves
  abstract postMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]): any;

  // Called after a turn ticks
  abstract turnTick(currPos: coordinate, boardState: Piece[][]): any;

  constructor(type: number) {
    this.type = type
  }
}


export class Invalid extends Piece {
  // For board boundaries
  constructor() {
    super(PieceType.INVALID)
  }

  validateMove() {
    return [false, {}];
  }

  postMove() {}

  turnTick() {}
}


export class None extends Piece {
  constructor() {
    super(PieceType.NONE)
  }

  validateMove() {
    return [false, {}];
  }

  postMove() {}

  turnTick() {}
}

export class Pawn extends Piece {
  constructor(type: number) {
    super(type)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    if (!coordinateWithinBoard(newPos)) {
      return [false, {}]
    }
    // TODO: diff = -1 means pawns moving from White's perspective
    let diff: number = -1
    if (currPos[1] === newPos[1]) {
      if (currPos[0]+(diff) === newPos[0]) {
        // Moving one square forward valid only when square empty
        return [getPieceAt(newPos, boardState).type === PieceType.NONE, {}]
      } else if (currPos[0]+(2*diff) === newPos[0]) {
        // Moving two squares valid only when on starting square
        return [(
          getPieceAt(newPos, boardState).type === PieceType.NONE
          && !this.hasMoved
        ), {}]
      }
    } else if ([currPos[1]-1, currPos[1]+1].includes(newPos[1]) && currPos[0]+diff === newPos[0]) {
      // Capture
      if (getPieceAt(newPos, boardState).type !== PieceType.NONE && oppositeSign(getPieceAt(newPos, boardState).type, this.type)) {
        return [true, {}]
      } else if (getPieceAt([newPos[0]-diff, newPos[1]], boardState).type === (this.type*-1) && getPieceAt([newPos[0]-diff, newPos[1]], boardState).enPassantable > 0) {
        return [true, {"enpassant": true}]
      }
    }
    return [false, {}]
  }

  postMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    // TODO: Handle promotion
    let diff: number = this.type > 0 ? -1 : 1
    if (currPos[1] === newPos[1] && currPos[0]+(2*diff) === newPos[0]) {
      this.enPassantable = 2
    }

    if (!this.hasMoved) {
      this.hasMoved = true
    }
  }

  turnTick() {
    if (this.enPassantable > 0) {
      this.enPassantable -= 1
    }
  }
}

export class Bishop extends Piece {
  constructor(type: number) {
    super(type)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    if (!coordinateWithinBoard(newPos)) {
      return [false, {}]
    }
    return [validateDiagMove(currPos, newPos, boardState), {}]
  }

  postMove() {
    if (!this.hasMoved) {
      this.hasMoved = true
    }
  }

  turnTick() {}
}

export class Knight extends Piece {
  constructor(type: number) {
    super(type)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    if (!coordinateWithinBoard(newPos)) {
      return [false, {}]
    }
    let validKnightMoves: coordinate[] = getValidKnightMoves(currPos)
    let validKnightMove = false
    validKnightMoves.forEach((elem) => {
      if (squaresEqual(elem, newPos)) {
        validKnightMove = true
      }
    })

    if (!validKnightMove) {
      return [false, {}]
    }

    let targetPiece = getPieceAt(newPos, boardState)
    return [(targetPiece.type === PieceType.NONE || oppositeSign(targetPiece.type, this.type)), {}]
  }

  postMove() {
    if (!this.hasMoved) {
      this.hasMoved = true
    }
  }

  turnTick() {}
}

export class Rook extends Piece {
  constructor(type: number) {
    super(type)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    if (!coordinateWithinBoard(newPos)) {
      return [false, {}]
    }
    const isValidCardinalMove = validateCardinalMove(currPos, newPos, boardState)
    if (!isValidCardinalMove) {
      // Check castling
      let targetPiece = getPieceAt(newPos, boardState)
      const isTargetFriendlyKing = (
        !oppositeSign(this.type, targetPiece.type) && (targetPiece.type === PieceType.WHITE_KING || targetPiece.type === PieceType.BLACK_KING)
      )
      if (isTargetFriendlyKing) {
        return [(validateCastle(newPos, currPos, boardState)), {"castle": true, "kingPos": newPos, "rookPos": currPos}]
      }
      return [false, {}]
    } else {
      return [true, {}]
    }
  }

  postMove() {
    if (!this.hasMoved) {
      this.hasMoved = true
    }
  }

  turnTick() {}
}

export class King extends Piece {
  constructor(type: number) {
    super(type)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    if (!coordinateWithinBoard(newPos)) {
      return [false, {}]
    }
    let validKingMoves: coordinate[] = getValidKingMoves(currPos)
    let validKingMove = false
    validKingMoves.forEach((elem) => {
      if (squaresEqual(elem, newPos)) {
        validKingMove = true
      }
    })

    let targetPiece = getPieceAt(newPos, boardState)
    if (!validKingMove) {
      // Check castling
      const isTargetFriendlyRook = (
        !oppositeSign(this.type, targetPiece.type) && (targetPiece.type === PieceType.WHITE_ROOK || targetPiece.type === PieceType.BLACK_ROOK)
      )
      if (isTargetFriendlyRook) {
        return [(validateCastle(currPos, newPos, boardState)), {"castle": true, "kingPos": currPos, "rookPos": newPos}]
      }
      return [false, {}]
    } else {
      return [(targetPiece.type === PieceType.NONE || oppositeSign(targetPiece.type, this.type)), {}]
    }
  }

  postMove() {
    if (!this.hasMoved) {
      this.hasMoved = true
    }
  }

  turnTick() {}
}

export class Queen extends Piece {
  constructor(type: number) {
    super(type)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    if (!coordinateWithinBoard(newPos)) {
      return [false, {}]
    }
    const isDiag = validateDiagMove(currPos, newPos, boardState)
    const isCardinal = validateCardinalMove(currPos, newPos, boardState)
    return [(isDiag || isCardinal), {}];
  }

  postMove() {
    if (!this.hasMoved) {
      this.hasMoved = true
    }
  }

  turnTick() {}
}

export class Elephant extends Piece {
  constructor(type: number) {
    super(type)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    // The elephant is a rook with the "crush" ability
    if (!coordinateWithinBoard(newPos)) {
      return [false, {}]
    }

    let xDiff = newPos[0] - currPos[0]
    let yDiff = newPos[1] - currPos[1]
  
    let onCardinal = (xDiff === 0 && yDiff !== 0) || (xDiff !== 0 && yDiff === 0)
    if (!onCardinal) {
      return [false, {}]
    }
  
    let xInc = 0
    let yInc = 0
  
    if (xDiff === 0) {
      yInc = yDiff > 0 ? 1 : -1
    } else {
      xInc = xDiff > 0 ? 1 : -1
    }
  
    let extraInfo: any = {}
    for (let i = 1; i < Math.abs(xDiff); i++) {
      let candidate = getPieceAt([currPos[0]+(i*xInc), currPos[1]+(i*yInc)], boardState)
      if (candidate.type !== PieceType.NONE && oppositeSign(candidate.type, this.type)) {
        if (Object.keys(extraInfo).length !== 0) {
          // If we've already crushed something, we can't crush again
          return [false, {}]
        }
        extraInfo = {"crushed": [currPos[0]+(i*xInc), currPos[1]+(i*yInc)]}
      } else if (candidate.type !== PieceType.NONE && !oppositeSign(candidate.type, this.type)) {
        return [false, {}]
      }
    }
  
    let currPiece = getPieceAt(currPos, boardState)
    let targetPiece = getPieceAt(newPos, boardState)
    return [(targetPiece.type === PieceType.NONE || oppositeSign(targetPiece.type, currPiece.type)), extraInfo]
  }

  postMove() {
    if (!this.hasMoved) {
      this.hasMoved = true
    }
  }

  turnTick() {}
}

export function buildPiece(type: number) {
  if (type === PieceType.INVALID) {
    return new Invalid()
  } else if (type === PieceType.WHITE_PAWN || type === PieceType.BLACK_PAWN) {
    return new Pawn(type)
  } else if (type === PieceType.WHITE_BISHOP || type === PieceType.BLACK_BISHOP) {
    return new Bishop(type)
  } else if (type === PieceType.WHITE_KNIGHT || type === PieceType.BLACK_KNIGHT) {
    return new Knight(type)
  } else if (type === PieceType.WHITE_ROOK || type === PieceType.BLACK_ROOK) {
    return new Rook(type)
  } else if (type === PieceType.WHITE_KING || type === PieceType.BLACK_KING) {
    return new King(type)
  } else if (type === PieceType.WHITE_QUEEN || type === PieceType.BLACK_QUEEN) {
    return new Queen(type)
  } else if (type === PieceType.WHITE_ELEPHANT || type === PieceType.BLACK_ELEPHANT) {
    return new Elephant(type)
  }
  return new None()
}

export function copyPiece(piece: Piece) {
  // For now, this is pretty similar to buildPiece but will copy
  // properties specific to the piece (ie. counters)
  let res
  if (piece.type === PieceType.INVALID) {
    // TODO: Should never happen
    return new Invalid()
  } else if (piece.type === PieceType.WHITE_PAWN || piece.type === PieceType.BLACK_PAWN) {
    res = new Pawn(piece.type)
  } else if (piece.type === PieceType.WHITE_BISHOP || piece.type === PieceType.BLACK_BISHOP) {
    res = new Bishop(piece.type)
  } else if (piece.type === PieceType.WHITE_KNIGHT || piece.type === PieceType.BLACK_KNIGHT) {
    res = new Knight(piece.type)
  } else if (piece.type === PieceType.WHITE_ROOK || piece.type === PieceType.BLACK_ROOK) {
    res = new Rook(piece.type)
  } else if (piece.type === PieceType.WHITE_KING || piece.type === PieceType.BLACK_KING) {
    res = new King(piece.type)
  } else if (piece.type === PieceType.WHITE_QUEEN || piece.type === PieceType.BLACK_QUEEN) {
    res = new Queen(piece.type)
  } else if (piece.type === PieceType.WHITE_ELEPHANT || piece.type === PieceType.BLACK_ELEPHANT) {
    res = new Elephant(piece.type)
  } else {
    res = new None()
  }
  res.enPassantable = piece.enPassantable
  res.hasMoved = piece.hasMoved
  return res
}

export function serializePiece(piece: Piece) {
  let pieceAsJSON: {[key:string]: string} = {}
  for (const [key, value] of Object.entries(piece)) {
    if (key === "hasMoved" && !value) {
      continue
    }
    if (key === "enPassantable" && value === 0) {
      continue
    }
    pieceAsJSON[key] = value
  }

  return JSON.stringify(pieceAsJSON)
}

export function deserializePiece(pieceAsJSON: string) {
  const pieceAsObject = JSON.parse(pieceAsJSON)
  let piece = buildPiece(pieceAsObject.type)
  if (pieceAsObject.hasOwnProperty("enPassantable")) {
    piece.enPassantable = pieceAsObject["enPassantable"]
  } else {
    piece.enPassantable = 0
  }

  if (pieceAsObject.hasOwnProperty("hasMoved")) {
    piece.hasMoved = pieceAsObject["hasMoved"]
  } else {
    piece.hasMoved = false
  }
  return piece
}
import { Colors, PieceType, squaresEqual, oppositeSign, getPieceAt, coordinate } from "./Utils";

function validateDiagMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
  let xDiff = newPos[0] - currPos[0]
  let yDiff = newPos[1] - currPos[1]

  let onDiag = (Math.abs(xDiff) === Math.abs(yDiff))
  if (!onDiag || (xDiff === 0 || yDiff === 0)) {
    return [false, {}]
  }

  let xInc = xDiff > 0 ? 1 : -1
  let yInc = yDiff > 0 ? 1 : -1
  for (let i = 1; i < Math.abs(xDiff); i++) {
    let candidate = getPieceAt([currPos[0]+(i*xInc), currPos[1]+(i*yInc)], boardState)
    if (candidate.type !== PieceType.NONE) {
      return [false, {}]
    }
  }

  let currPiece = getPieceAt(currPos, boardState)
  let targetPiece = getPieceAt(newPos, boardState)
  return [(targetPiece.type === PieceType.NONE || oppositeSign(targetPiece.type, currPiece.type)), {}]
}

function validateCardinalMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
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

  for (let i = 1; i < Math.abs(xDiff); i++) {
    let candidate = getPieceAt([currPos[0]+(i*xInc), currPos[1]+(i*yInc)], boardState)
    if (candidate.type !== PieceType.NONE) {
      return [false, {}]
    }
  }

  let currPiece = getPieceAt(currPos, boardState)
  let targetPiece = getPieceAt(newPos, boardState)
  return [(targetPiece.type === PieceType.NONE || oppositeSign(targetPiece.type, currPiece.type)), {}]
}

export abstract class Piece {
  public type: number;
  public color: number;
  public enPassantable = 0;
  abstract validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]): any[];

  // Called after this piece moves
  abstract postMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]): any;

  // Called after a turn ticks
  abstract turnTick(currPos: coordinate, boardState: Piece[][]): any;

  constructor(type: number, color: number) {
    this.type = type
    this.color = color
  }
}

export class None extends Piece {
  constructor() {
    super(0, -1)
  }

  validateMove() {
    return [false, {}];
  }

  postMove() {}

  turnTick() {}
}

export class Pawn extends Piece {
  constructor(type: number, color: number) {
    super(type, color)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    let diff: number = this.color === Colors.WHITE ? -1 : 1
    if (currPos[1] === newPos[1]) {
      if (currPos[0]+(diff) === newPos[0]) {
        // Moving one square forward valid only when square empty
        return [boardState[newPos[0]][newPos[1]].type === PieceType.NONE, {}]
      } else if (currPos[0]+(2*diff) === newPos[0]) {
        // Moving two squares valid only when on starting square
        return [(
          boardState[newPos[0]][newPos[1]].type === PieceType.NONE
          && currPos[0] === (this.color === Colors.WHITE ? 6 : 1)
        ), {}]
      }
    } else if ([currPos[1]-1, currPos[1]+1].includes(newPos[1]) && currPos[0]+diff === newPos[0]) {
      // Capture
      if (oppositeSign(getPieceAt(newPos, boardState).type, this.type)) {
        return [true, {}]
      } else if (boardState[newPos[0]-diff][newPos[1]].type === (this.type*-1) && boardState[newPos[0]-diff][newPos[1]].enPassantable > 0) {
        return [true, {"enpassant": true}]
      }
    }
    return [false, {}]
  }

  postMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    // TODO: Handle promotion
    let diff: number = this.color === Colors.WHITE ? -1 : 1
    if (currPos[1] === newPos[1] && currPos[0]+(2*diff) === newPos[0]) {
      this.enPassantable = 2
    }
  }

  turnTick() {
    if (this.enPassantable > 0) {
      this.enPassantable -= 1
    }
  }
}

export class Bishop extends Piece {
  constructor(type: number, color: number) {
    super(type, color)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    return [validateDiagMove(currPos, newPos, boardState), {}]
  }

  postMove() {}

  turnTick() {}
}

export class Knight extends Piece {
  constructor(type: number, color: number) {
    super(type, color)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    let validKnightMoves: coordinate[] = [
      [currPos[0]-1, currPos[1]-2],
      [currPos[0]+1, currPos[1]-2],
      [currPos[0]-1, currPos[1]+2],
      [currPos[0]+1, currPos[1]+2],
      [currPos[0]-2, currPos[1]-1],
      [currPos[0]+2, currPos[1]-1],
      [currPos[0]-2, currPos[1]+1],
      [currPos[0]+2, currPos[1]+1],
    ]
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

  postMove() {}

  turnTick() {}
}

export class Rook extends Piece {
  constructor(type: number, color: number) {
    super(type, color)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    // TODO: Castling
    return [validateCardinalMove(currPos, newPos, boardState), {}]
  }

  postMove() {}

  turnTick() {}
}

export class King extends Piece {
  constructor(type: number, color: number) {
    super(type, color)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    // TODO: Castling! And check
    let validKingMoves: coordinate[] = [
      [currPos[0]-1, currPos[1]-1],
      [currPos[0]+1, currPos[1]-1],
      [currPos[0]-1, currPos[1]+1],
      [currPos[0]+1, currPos[1]+1],
      [currPos[0], currPos[1]-1],
      [currPos[0]+1, currPos[1]],
      [currPos[0]-1, currPos[1]],
      [currPos[0], currPos[1]+1],
    ]
    let validKingMove = false
    validKingMoves.forEach((elem) => {
      if (squaresEqual(elem, newPos)) {
        validKingMove = true
      }
    })

    if (!validKingMove) {
      return [false, {}]
    }

    let targetPiece = getPieceAt(newPos, boardState)
    return [(targetPiece.type === PieceType.NONE || oppositeSign(targetPiece.type, this.type)), {}]
  }

  postMove() {}

  turnTick() {}
}

export class Queen extends Piece {
  constructor(type: number, color: number) {
    super(type, color)
  }

  validateMove(currPos: coordinate, newPos: coordinate, boardState: Piece[][]) {
    const isDiag = validateDiagMove(currPos, newPos, boardState)
    const isCardinal = validateCardinalMove(currPos, newPos, boardState)
    return [(isDiag || isCardinal), {}];
  }

  postMove() {}

  turnTick() {}
}

export function buildPiece(type: number) {
  if (type === PieceType.WHITE_PAWN || type === PieceType.BLACK_PAWN) {
    return new Pawn(type, type < 0 ? 1 : 0)
  } else if (type === PieceType.WHITE_BISHOP || type === PieceType.BLACK_BISHOP) {
    return new Bishop(type, type < 0 ? 1 : 0)
  } else if (type === PieceType.WHITE_KNIGHT || type === PieceType.BLACK_KNIGHT) {
    return new Knight(type, type < 0 ? 1 : 0)
  } else if (type === PieceType.WHITE_ROOK || type === PieceType.BLACK_ROOK) {
    return new Rook(type, type < 0 ? 1 : 0)
  } else if (type === PieceType.WHITE_KING || type === PieceType.BLACK_KING) {
    return new King(type, type < 0 ? 1 : 0)
  } else if (type === PieceType.WHITE_QUEEN || type === PieceType.BLACK_QUEEN) {
    return new Queen(type, type < 0 ? 1 : 0)
  }
  return new None()
}

export function copyPiece(piece: Piece) {
  // For now, this is pretty similar to buildPiece but will copy
  // properties specific to the piece (ie. counters)
  if (piece.type === PieceType.WHITE_PAWN || piece.type === PieceType.BLACK_PAWN) {
    return new Pawn(piece.type, piece.color)
  } else if (piece.type === PieceType.WHITE_BISHOP || piece.type === PieceType.BLACK_BISHOP) {
    return new Bishop(piece.type, piece.color)
  } else if (piece.type === PieceType.WHITE_KNIGHT || piece.type === PieceType.BLACK_KNIGHT) {
    return new Knight(piece.type, piece.color)
  } else if (piece.type === PieceType.WHITE_ROOK || piece.type === PieceType.BLACK_ROOK) {
    return new Rook(piece.type, piece.color)
  } else if (piece.type === PieceType.WHITE_KING || piece.type === PieceType.BLACK_KING) {
    return new King(piece.type, piece.color)
  } else if (piece.type === PieceType.WHITE_QUEEN || piece.type === PieceType.BLACK_QUEEN) {
    return new Queen(piece.type, piece.color)
  }
  return new None()
}
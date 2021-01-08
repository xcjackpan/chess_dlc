import axios from "axios";
import React, { useEffect, useState } from "react";
import { useCookies, Cookies } from "react-cookie";
import { useHistory, useLocation } from "react-router-dom";
import { PlayerType, GameState } from "./Utils";
import Board from "./Board";
import { deserializeBoardState, flipBoard, processBoard } from "./Board";
import Draft from "./Draft";
import { Piece } from "./Piece";

import "./Board.css";

const startingBoard = [
  [-4,-2,-3,-5,-6,-3,-2,-4],
  [-1,-1,-1,-1,-1,-1,-1,-1],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1],
  [4,2,3,5,6,3,2,4]
]

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

function Game() {
  // Game will handle all the extra tinkering:
  // 1. Selecting players (remembering with cookies)
  // 2. Initializing the websocket
  // 3. Displaying the select/waiting, the draft, the board

  const [cookies, setCookie, removeCookie] = useCookies(["chess-dlc"]);
  const [gameInfo, setGameInfo] = useState({
    gameId: useLocation().pathname.split("/").pop(),
    gameState: GameState.LOADING,
    currPlayer: PlayerType.UNKNOWN,
    currTurn: PlayerType.WHITE,
    boardState: processBoard(emptyBoard),
  });
  const [webSocket, setWebSocket]: [any, any] = useState(null)

  useEffect(() => {
    // 1. Try to join the game, handle the cases:
    // a) Client has a cookie so they've already joined
    // b) Client has no cookie, game needs a player
    // c) Joining as a spectator
    const cookiePresent = cookies.hasOwnProperty("chess-dlc") && cookies["chess-dlc"].hasOwnProperty("player")
    axios.get(`http://localhost:8080/join/${gameInfo.gameId}`, {params: {cookiePresent: cookiePresent}}).then(res => {
      let currPlayer = PlayerType.SPECTATOR
      if (cookiePresent) {
        // Client has already joined before
        currPlayer = cookies["chess-dlc"]["player"]
      } else if (res.data.timesJoined <= 2) {
        // Accepting a new player
        currPlayer = res.data.waitingFor

        // TODO: Unset the cookie once the game ends
        // removeCookie("chess-dlc", {path: `/game/${gameInfo.gameId}`})
        setCookie(
          "chess-dlc",
          {"player": res.data.waitingFor, "gameId": gameInfo.gameId},
          {path: `/game/${gameInfo.gameId}`, maxAge: 3600*24*3},
        );
      }

      if (res.data.board) {
        const receivedBoardState = deserializeBoardState(res.data.board, currPlayer)
        setGameInfo({
          ...gameInfo,
          currPlayer: currPlayer,
          gameId: gameInfo.gameId,
          gameState: res.data.gameState,
          boardState: receivedBoardState.boardState,
          currTurn: receivedBoardState.currTurn,
        })
      } else {
        // TODO: This case is temporary until draft phase is complete
        // Case happens when game starts and there's no board on Firebase
        setGameInfo({
          ...gameInfo,
          currPlayer: currPlayer,
          gameId: gameInfo.gameId,
          gameState: res.data.gameState,
          currTurn: PlayerType.WHITE,
        })
      }

      // 2. Load up the websocket
      let ws = new WebSocket(`ws://localhost:8080/websocket/${gameInfo.gameId}`)
      ws.onopen = () => {
        setWebSocket(ws)
      };

      // Since event handlers are defined once, the values they "know"
      // are the values at the time of their definition.
      // We use a new => function as a way to get the "fresh" state
      ws.onmessage = (event) => {
        // TODO: Enter draft stage
        setGameInfo((gameInfo) => {
          const receivedBoardState = deserializeBoardState(event.data, gameInfo.currPlayer)
          const updatedGameInfo = {
            ...gameInfo,
            boardState: receivedBoardState.boardState,
            currTurn: receivedBoardState.currTurn,
          }
          return updatedGameInfo
        })
      }
    })
  }, []);

  function sendToSocket(data: string) {
    if (webSocket === null || webSocket.readyState !== 1) {
      return false
    } else {
      webSocket.send(data)
      return true
    }
  }

  function updateBoardState(newBoard: Piece[][]) {
    setGameInfo({
      ...gameInfo,
      currTurn: -1*gameInfo.currTurn,
      boardState: newBoard,
    }) 
  }

  if (gameInfo.gameState === GameState.LOADING) {
    return <div>Loading...</div>
  } else if (gameInfo.gameState === GameState.DRAFT || gameInfo.gameState === GameState.PLAYER_SELECT) {
    return (
      <div className="main">
        <Draft
          currPlayer={gameInfo.currPlayer}
          sendToSocket={sendToSocket}
        />
      </div>
    )
  } else {
    // Both player select and game use the board
    return (
      <div className="main">
        <Board
          boardState={gameInfo.boardState}
          currPlayer={gameInfo.currPlayer}
          currTurn={gameInfo.currTurn}
          sendToSocket={sendToSocket}
          updateBoardState={updateBoardState}
        />
      </div>
    )
  }

}

export default Game;
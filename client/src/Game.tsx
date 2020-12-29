import axios from "axios";
import React, { useEffect, useState } from "react";
import { useCookies, Cookies } from "react-cookie";
import { useHistory, useLocation } from "react-router-dom";
import { PlayerType, GameState } from "./Utils";
import Board from "./Board";

import "./Board.css";

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
    boardState: testBoard,
  });
  const [webSocket, setWebSocket]: [any, any] = useState(null)

  useEffect(() => {
    // 1. Try to join the game, handle the cases:
    // a) Client has a cookie so they've already joined
    // b) Client has no cookie, game needs a player
    // c) Joining as a spectator
    const cookiePresent = cookies.hasOwnProperty("chess-dlc") && cookies["chess-dlc"].hasOwnProperty("player")
    axios.get(`http://localhost:8080/join/${gameInfo.gameId}`, {params: {cookiePresent: cookiePresent}}).then(res => {
      if (cookiePresent) {
        setGameInfo({
          ...gameInfo,
          currPlayer: cookies["chess-dlc"]["player"],
          gameId: gameInfo.gameId,
          gameState: res.data.gameState,
        })
      } else {
        if (res.data.timesJoined <= 2) {
          // Accepting a new player
          setGameInfo({
            ...gameInfo,
            currPlayer: res.data.waitingFor,
            gameId: gameInfo.gameId,
            gameState: res.data.gameState,
          })
    
          // TODO: Unset the cookie once the game ends
          // removeCookie("chess-dlc", {path: `/game/${gameInfo.gameId}`})
          setCookie(
            "chess-dlc",
            {"player": res.data.waitingFor, "gameId": gameInfo.gameId},
            {path: `/game/${gameInfo.gameId}`, maxAge: 3600*24*3}
          );
        } else {
          setGameInfo({
            ...gameInfo,
            currPlayer: PlayerType.SPECTATOR,
            gameId: gameInfo.gameId,
            gameState: res.data.gameState,
          })
        }
      }

      // 2. Load up the websocket
      let ws = new WebSocket(`ws://localhost:8080/websocket/${gameInfo.gameId}`)
      ws.onopen = () => {
        setWebSocket(ws)
      };
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

  if (gameInfo.gameState === GameState.LOADING) {
    return <div>Loading...</div>
  } else {
    // Handle draft phase here
    return (
      <div className="main">
        <Board
          boardState={gameInfo.boardState}
          currPlayer={gameInfo.currPlayer}
          initTurn={PlayerType.WHITE}
          sendToSocket={sendToSocket}
        />
      </div>
    )
  }

}

export default Game;
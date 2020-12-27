import axios from "axios";
import React, { useEffect, useState } from "react";
import { useCookies, Cookies } from "react-cookie";
import { useHistory, useLocation } from "react-router-dom";
import { PlayerType, GameState } from "./Utils";
import Board from "./Board";

import "./Board.css";

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
    numPlayers: 0,
  });

  useEffect(() => {
    axios.get(`http://localhost:8080/join/${gameInfo.gameId}`).then(res => {
      setGameInfo({
        ...gameInfo,
        currPlayer: (
          (cookies.hasOwnProperty("chess-dlc") && cookies["chess-dlc"].hasOwnProperty("player"))
          ? cookies["chess-dlc"]["player"] : gameInfo.currPlayer
        ),
        gameId: gameInfo.gameId,
        gameState: res.data.gameState,
        numPlayers: res.data.numPlayers,
      })
    })
  }, []);

  function pickColor(color: number) {
    // TODO: Unset the cookie once the game ends
    // removeCookie("chess-dlc", {path: `/game/${gameInfo.gameId}`})
    setCookie("chess-dlc", {"player": color, "gameId": gameInfo.gameId}, {path: `/game/${gameInfo.gameId}`, maxAge: 3600*24*3});
    setGameInfo({
      ...gameInfo,
      currPlayer: color,
    })
  }

  if (gameInfo.gameState === GameState.LOADING) {
    return <div>Loading...</div> 
  } else if (gameInfo.currPlayer === PlayerType.UNKNOWN && gameInfo.numPlayers < 2) {
    return (
      <div>
        Pick a color
        <div onClick={() => {pickColor(PlayerType.WHITE)}}>White</div>
        <div onClick={() => {pickColor(PlayerType.BLACK)}}>Black</div>
      </div>
    )
  } else {
    // Handle draft phase here
    return (
      <div className="main">
        <Board
          currPlayer={gameInfo.currPlayer}
          initTurn={PlayerType.WHITE}
        />
      </div>
    )
  }

}

export default Game;
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
  });

  useEffect(() => {
    if (cookies.hasOwnProperty("chess-dlc") && cookies["chess-dlc"].hasOwnProperty("player")) {
      // TODO: Call a new endpoint to get boardstate and gamestate
      console.log("TBD")
    } else {
      // If we have no cookie for this game, try join
      axios.get(`http://localhost:8080/join/${gameInfo.gameId}`).then(res => {
        console.log(res)
        if (res.data.timesJoined <= 2) {
          // Accepting a new player
          setGameInfo({
            ...gameInfo,
            currPlayer: (
              (cookies.hasOwnProperty("chess-dlc") && cookies["chess-dlc"].hasOwnProperty("player"))
              ? cookies["chess-dlc"]["player"] : res.data.waitingFor
            ),
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
          // TODO: Accept a spectator
        }
      })
    }
  }, []);

  console.log(gameInfo)
  if (gameInfo.gameState === GameState.LOADING) {
    return <div>Loading...</div>
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
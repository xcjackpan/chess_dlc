import axios from "axios";
import React, { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { PlayerType, GameState } from "./Utils";
import Board from "./Board";

import "./Board.css";

function Game() {
  // Game will handle all the extra tinkering:
  // 1. Selecting players (remembering with cookies)
  // 2. Initializing the websocket
  // 3. Displaying the select/waiting, the draft, the board

  // Init ... call in a componentDidMount equivalent
  const gameId = useLocation().pathname.split("/").pop()
  axios.get(`http://localhost:8080/join/${gameId}`).then(res => {
    console.log(res)
  })

  return (
    <div className="main">
      <Board
        currPlayer={1}
        initTurn={PlayerType.WHITE}
      />
    </div>
  )
}

export default Game;
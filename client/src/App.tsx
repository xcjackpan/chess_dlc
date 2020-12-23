import React, { useState } from 'react';
import Game from './Game';
import { PlayerType, gameinfo } from "./Utils";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [gameInfo, setInGame]: [gameinfo, any] = useState({
    inGame: false,
    currPlayer: 0,
  });

  function startGame(player: number) {

  }

  if (isLoading) {
    return (
      <div className="main">
        <div>Loading</div>
      </div>
    );
  } else if (gameInfo.inGame) {
    return (
      <div className="main">
        <Game currPlayer={gameInfo.currPlayer} initTurn={PlayerType.WHITE}/>
      </div>
    );
  } else if (!gameInfo.inGame) {
    return (
      <div className="main">
        <div onClick={() => {setInGame({inGame: true, currPlayer: PlayerType.WHITE})}}>Start game as white</div>
        <div onClick={() => {setInGame({inGame: true, currPlayer: PlayerType.BLACK})}}>Start game as black</div>
      </div>
    );
  }
}

export default App;

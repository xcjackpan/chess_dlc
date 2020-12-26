import axios from "axios";
import React, { useState } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Game from "./Game";
import Lobby from "./Lobby";
import { PlayerType, gameinfo } from "./Utils";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [gameInfo, setInGame]: [gameinfo, any] = useState({
    currPlayer: 0, // This is the default player on-refresh
    gameId: '123456',
  });

  function makeRequest() {
    axios.get("http://localhost:8080/create").then(res => {
      console.log(res)
    });
  }

  if (isLoading) {
    return (
      <div className="main">
        <div>Loading</div>
      </div>
    );
  } else {
    return (
      <BrowserRouter>
        <Switch>
          <Route
            path="/game/:gameId"
            render={() => (
              <div className="main">
                <Game
                  currPlayer={gameInfo.currPlayer}
                  initTurn={PlayerType.WHITE}
                />
              </div>
            )}
          />
          <Route
            render={() => (
              <div>
                <Lobby
                  startGame={setInGame}
                  makeRequest={makeRequest}
                />
              </div>
            )}
          />
        </Switch>
      </BrowserRouter>
    )
  }
}

export default App;

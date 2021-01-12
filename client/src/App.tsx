import axios from "axios";
import React, { useState } from "react";
import { CookiesProvider } from "react-cookie";
import { HashRouter, Route, Switch } from "react-router-dom";
import Game from "./Game";
import Lobby from "./Lobby";

function App() {
  const [isLoading, setIsLoading] = useState(false);

  function createGame(history: any, createdBy: number) {
    // 1. Create the record of the game in the backend
    axios.post("/create", {"createdBy": createdBy}).then(res => {
      const gameInfo = res.data

      // 2. Redirect you to the game
      history.push(`/game/${gameInfo.gameId}`)
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
      <CookiesProvider>
        <HashRouter>
          <Switch>
            <Route
              path="/game/:gameId"
              render={() => (
                <div className="main">
                  <Game />
                </div>
              )}
            />
            <Route
              render={() => (
                <div className="main">
                  <Lobby
                    createGame={createGame}
                  />
                </div>
              )}
            />
          </Switch>
        </HashRouter>
      </CookiesProvider>
    )
  }
}

export default App;

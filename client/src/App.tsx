import React, { useState } from 'react';
import Game from './Game';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [inGame, setInGame] = useState(true);

  if (isLoading) {
    return (
      <div className="main">
        <div>Loading</div>
      </div>
    );
  } else if (inGame) {
    return (
      <div className="main">
        <Game/>
      </div>
    );
  } else if (!inGame) {
    return (
      <div className="main">
        <div>In lobby</div>
      </div>
    );
  }
}

export default App;

import { useHistory } from "react-router-dom";
import { PlayerType } from "./Utils";
import Button from '@material-ui/core/Button';
import "./Lobby.css";

function Lobby(props: any) {
  const { createGame } = props
  const history = useHistory()

  return (
    <div className="lobby">
      <div className="info">
        <p>
          <strong>Draft Chess <span style={{"fontSize": "15px"}}>(the name is a WIP)</span></strong>
        </p>

        <p>
          This is a simple web client for an experimental <a href="https://en.wikipedia.org/wiki/Chess_variant">chess variant</a> based on the concept of 
          "drafting a board". Each game has two phases:
          <ul>
            <li><strong>Draft:</strong> Where players draft pieces to build out their initial board</li>
            <li><strong>Game:</strong> Where players play out a game of chess using the board they drafted</li>
          </ul>
        </p>

        <p>
          <strong>How to start:</strong> To start a game, simply click the buttons to be redirected to a generated room. Send the URL for the room to a friend 
          and the first visitor will play with you.
        </p>

        <p><a href="https://github.com/xcjackpan/chess_dlc">Here's the source code if you're a nerd</a></p>
      </div>
      <div className="buttons">
        <Button variant="contained" size="large" onClick={() => {createGame(history, PlayerType.WHITE)}}>
          <span className="button-text">Create game as white</span>
        </Button>
        <Button variant="contained" size="large" onClick={() => {createGame(history, PlayerType.BLACK)}}>
          <span className="button-text">Create game as black</span>
        </Button>
      </div>
    </div>
  )
}

export default Lobby;
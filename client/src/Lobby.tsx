import { useHistory } from "react-router-dom";
import { PlayerType } from "./Utils";
import "./Board.css";

function Lobby(props: any) {
  const { startGame, createGame } = props
  const history = useHistory()

  return (
    <div className="main">
      <div onClick={() => {createGame(history, PlayerType.WHITE)}}>Create game as white</div>
      <div onClick={() => {createGame(history, PlayerType.BLACK)}}>Create game as black</div>
    </div>
  )
}

export default Lobby;
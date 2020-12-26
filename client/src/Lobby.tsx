import { useHistory } from "react-router-dom";
import "./Board.css";

function Lobby(props: any) {
  const { startGame, createGame } = props
  const history = useHistory()

  return (
    <div className="main">
      {
      /*
      <div onClick={() => {sendGameInfo(PlayerType.WHITE)}}>Start game as white</div>
      <div onClick={() => {sendGameInfo(PlayerType.BLACK)}}>Start game as black</div>
      */
      }
      <div onClick={() => {createGame(history)}}>Create game</div>
    </div>
  )
}

export default Lobby;
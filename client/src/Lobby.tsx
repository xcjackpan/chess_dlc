import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { PlayerType, gameinfo } from "./Utils";
import "./Board.css";

function Lobby(props: any) {
  const { startGame, makeRequest } = props
  const history = useHistory()
  const dummyGameId = "123456"

  function sendGameInfo(player: number) {
    history.push(`/game/${dummyGameId}`)
    startGame({
      currPlayer: player,
      gameId: dummyGameId,
    })
  }

  return (
    <div className="main">
      <div onClick={() => {sendGameInfo(PlayerType.WHITE)}}>Start game as white</div>
      <div onClick={() => {sendGameInfo(PlayerType.BLACK)}}>Start game as black</div>
      <div onClick={() => {makeRequest()}}>Make request</div>
    </div>
  )
}

export default Lobby;
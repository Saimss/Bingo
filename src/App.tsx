import { useState } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';

type AppState =
  | { screen: 'lobby' }
  | { screen: 'game'; gameId: string; playerName: string };

function App() {
  const [appState, setAppState] = useState<AppState>({ screen: 'lobby' });

  function handleJoinGame(gameId: string, playerName: string) {
    setAppState({ screen: 'game', gameId, playerName });
  }

  function handleLeaveGame() {
    setAppState({ screen: 'lobby' });
  }

  if (appState.screen === 'game') {
    return (
      <Game
        gameId={appState.gameId}
        playerName={appState.playerName}
        onLeaveGame={handleLeaveGame}
      />
    );
  }

  return <Lobby onJoinGame={handleJoinGame} />;
}

export default App;

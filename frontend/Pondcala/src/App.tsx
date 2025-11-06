import YourPondRow from './components/yourPondRow';
import OpponentPondRow from './components/opponentPondRow';
import LargePond from './components/svg/largePond';
import { useState } from 'react'
import './App.css'

function App() {
  const [counts, setCounts] = useState(Array(6).fill(4));
  const [opponentCounts, setOpponentCounts] = useState(Array(6).fill(4));
  const [yourScore, setYourScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [turnCounter, setTurnCounter] = useState(1);
  const hostID = '123';

  const smallPondParams = {
    counts: {
      get: counts,
      set: setCounts
    },
    score: {
      get: yourScore,
      set: setYourScore
    },
    opCounts: {
      get: opponentCounts,
      set: setOpponentCounts
    },
    turn: {
      get: turnCounter,
      set: setTurnCounter
    }
  };

  return (
    <>
    <h1>Turn {turnCounter}</h1>
      <div style = {{display: 'grid', gap: '0vw', gridTemplateColumns: '1fr 3fr 1fr'}}>
        <LargePond score={null} />
        <div style = {{display: 'flex', gap: '5vw', flexDirection: 'column', flex: '1'}}>
          <OpponentPondRow counts={opponentCounts} />
          <YourPondRow props={smallPondParams} />
        </div>
        <LargePond score={yourScore} />
      </div>
    </>
  );

  function exportGameState(){
    let countsString = counts.join(',');
    let opString = opponentCounts.join(',');

    /* 
      What is important for game state:
      - Whos the host
      - host board state
      - opponent board state
      - turn number
      - host score
      - opponent score

    */

    

    let gameStateString = `${hostID},${turnCounter},${yourScore},${opponentScore}|${countsString}|${opString}`;
    return gameStateString;
  }

  function importGameString() {
    let userInput;
    while(!userInput){
      userInput = prompt("Enter your name:");
    }
    let state = userInput.split('|');
    let scores = state[0];
    let hostCounts = state[1];
    let opponentCounts = state[2];
  }

}

export default App

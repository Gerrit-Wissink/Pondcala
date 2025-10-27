import YourPondRow from './components/yourPondRow';
import OpponentPondRow from './components/opponentPondRow';
import LargePond from './components/svg/largePond';
import { useState } from 'react'
import './App.css'

function App() {
  const [counts, setCounts] = useState([...Array(5).fill(4), 20]);
  const [opponentCounts, setOpponentCounts] = useState(Array(6).fill(4));
  const [yourScore, setYourScore] = useState(0);

  return (
    <>
      <div style = {{display: 'grid', gap: '0vw', gridTemplateColumns: '1fr 3fr 1fr'}}>
        <LargePond score={null} />
        <div style = {{display: 'flex', gap: '5vw', flexDirection: 'column', flex: '1'}}>
          <OpponentPondRow counts={opponentCounts} />
          <YourPondRow counts={{get: counts, set: setCounts}} score={{get: yourScore, set: setYourScore}} opCounts={{get: opponentCounts, set: setOpponentCounts}}/>
        </div>
        <LargePond score={yourScore} />
      </div>
    </>
  );
}

export default App

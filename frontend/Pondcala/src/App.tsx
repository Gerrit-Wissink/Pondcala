import Game from './pages/Game'
import Lobby from './pages/Lobby';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Lobby />}/>
          <Route path='/game' element={<Game />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

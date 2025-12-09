import Game from './pages/Game'
import Lobby from './pages/Lobby';
import Login from './pages/Login';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './App.css'

function App() {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route path='/' element={<Lobby />}/>
          <Route path='/game' element={<Game />}/>
          <Route path='/login' element={<Login />}/>
        </Routes>
      </HashRouter>
    </>
  )
}

export default App

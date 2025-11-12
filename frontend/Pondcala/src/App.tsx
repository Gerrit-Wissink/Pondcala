import Game from './pages/Game'
import Lobby from './pages/Lobby';
import Login from './pages/Login';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Lobby />}/>
          <Route path='/game' element={<Game />}/>
          <Route path='/login' element={<Login />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

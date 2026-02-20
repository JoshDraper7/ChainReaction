import { Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { UserProvider } from './context/UserContext'
import { CreateGame } from './pages/CreateGame'
import { GameProvider } from './context/GameContext'
import { LiveGameServiceProvider } from './context/LiveGameServiceContext'
import { JoinGame } from './pages/JoinGame'
import "./css/App.css"
import { PlayGame } from './pages/PlayGame'

function App() {

  return (
    <UserProvider>
      <LiveGameServiceProvider>
        <GameProvider>
          <main className='main-content'>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/home' element={<Home />} />
              <Route path='/login' element={<Login />} />
              <Route path="/create-game" element={<CreateGame />} />
              <Route path="/join-game" element={<JoinGame />} />
              <Route path="/play-game" element={<PlayGame />} />
            </Routes>
          </main>
        </GameProvider>
      </LiveGameServiceProvider>
    </UserProvider>
  )
}

export default App

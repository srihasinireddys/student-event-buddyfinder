import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Profile from './pages/Profile.jsx'
import FindPartners from './pages/FindPartners.jsx'
import CreateEvent from './pages/CreateEvent.jsx'
import Messages from './pages/Messages.jsx'
import NavBar from './components/NavBar.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/find" element={<FindPartners />} />
          <Route path="/events/new" element={<CreateEvent />} />
          <Route path="/messages" element={<Messages />} />
        </Routes>
      </main>
      <footer className="border-t bg-white/80 navbar-blur">
        <div className="container-narrow py-6 text-sm text-gray-600 flex items-center justify-between">
          <p>© {new Date().getFullYear()} EventBuddy</p>
          <div className="space-x-4">
            <a href="#" className="hover:underline">About</a>
            <a href="#" className="hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

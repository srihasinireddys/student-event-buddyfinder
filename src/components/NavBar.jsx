import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { auth, googleProvider } from '../lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { subscribeIsAdmin } from '../lib/dataService'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [me, setMe] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubRole = null
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setMe(user ? { uid: user.uid, name: user.displayName || 'Student', email: user.email } : null)
      setLoading(false)
      if (unsubRole) { unsubRole(); unsubRole = null }
      if (user) unsubRole = subscribeIsAdmin(user.uid, setIsAdmin)
      else setIsAdmin(false)
    })
    return () => { unsubAuth(); if (unsubRole) unsubRole() }
  }, [location.pathname])

  async function login() {
    try { await signInWithPopup(auth, googleProvider); navigate('/profile') }
    catch (err) { console.error(err); alert('Sign-in failed. Check Firebase config.') }
  }

  async function logout() {
    try { await signOut(auth); navigate('/') }
    catch (err) { console.error(err); alert('Sign-out failed.') }
  }

  const links = [
    ['/', 'Home'],
    ['/find', 'Find partners'],
    ...(isAdmin ? [['/events/new', 'Post event']] : []),
    ['/messages', 'Messages'],
    ['/profile', 'My profile'],
  ]

  return (
    <header className="border-b bg-white/70 navbar-blur sticky top-0 z-40">
      <div className="container-narrow py-4 flex items-center gap-3">
        <div onClick={()=>navigate('/')} className="font-extrabold text-xl tracking-tight cursor-pointer">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">EventBuddy</span>
        </div>

        <nav className="ml-6 hidden md:flex items-center gap-5 text-gray-700">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({isActive}) => isActive ? 'font-semibold' : 'hover:underline'}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto">
          {loading ? null : me ? (
            <div className="flex items-center gap-3">
              <span className="text-sm">Hi, {me.name}{isAdmin ? ' (admin)' : ''}</span>
              <button onClick={logout} className="btn btn-light">Sign out</button>
            </div>
          ) : (
            <button onClick={login} className="btn btn-primary">Get Started</button>
          )}
        </div>
      </div>
    </header>
  )
}

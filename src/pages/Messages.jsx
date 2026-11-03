import { useEffect, useState, useRef } from 'react'
import { subscribeThread, sendMessage, listMyThreads } from '../lib/dataService'
import { auth } from '../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useLocation, useNavigate } from 'react-router-dom'

function useThreadId() {
  const { search } = useLocation()
  const p = new URLSearchParams(search)
  return p.get('t') || 'admin-lobby'
}

export default function Messages() {
  const [me, setMe] = useState(null)
  const [threads, setThreads] = useState([]) // inbox list (DMs only)
  const threadId = useThreadId()
  const [thread, setThread] = useState({ id: threadId, messages: [] })
  const [text, setText] = useState('')
  const endRef = useRef(null)
  const navigate = useNavigate()

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setMe(user ? { uid: user.uid, name: user.displayName || 'Student' } : null)
    })
    return () => unsub()
  }, [])

  // load inbox list (DMs) whenever signed in or after route change
  useEffect(() => {
    (async () => {
      if (!auth.currentUser) { setThreads([]); return }
      const list = await listMyThreads()
      setThreads(list)
    })()
  }, [threadId, me?.uid])

  // live messages for the current thread
  useEffect(() => {
    const unsub = subscribeThread(threadId, setThread)
    return () => unsub()
  }, [threadId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.messages.length])

  async function handleSend() {
    if (!me) { alert('Please sign in first.'); return }
    const t = text.trim()
    if (!t) return
    try {
      await sendMessage(threadId, t)
      setText('')
    } catch (e) {
      console.error(e)
      alert('Failed to send message.')
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function openThread(id) {
    navigate(`/messages?t=${encodeURIComponent(id)}`)
  }

  return (
    <div className="container-narrow">
      <div className="grid md:grid-cols-[280px_1fr] gap-4">
        {/* Sidebar / Inbox */}
        <aside className="card p-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Inbox</h2>
          </div>

          <div className="divide-y">
            {/* Pinned admin group */}
            <button
              onClick={() => openThread('admin-lobby')}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${threadId === 'admin-lobby' ? 'bg-gray-50 font-semibold' : ''}`}
            >
              # admin-lobby
              <div className="text-xs text-gray-500">Public group chat</div>
            </button>

            {/* Direct messages */}
            {threads.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-500">No conversations yet.</div>
            )}
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => openThread(t.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${threadId === t.id ? 'bg-gray-50 font-semibold' : ''}`}
              >
                <div className="truncate">{t.id}</div>
                {t.lastMessage && <div className="text-xs text-gray-500 truncate">{t.lastMessage}</div>}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat panel */}
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">#{threadId}</h1>
          </div>

          <div className="border rounded-2xl p-3 h-[28rem] overflow-auto bg-gray-50">
            {thread.messages.length === 0 && <div className="text-gray-600">No messages yet.</div>}
            <ul className="space-y-2">
              {thread.messages.map(m => {
                const mine = me && m.authorUid === me.uid
                return (
                  <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-3 py-2 rounded-2xl border bg-white max-w-[75%] ${mine ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent' : ''}`}>
                      {!mine && <div className="text-xs opacity-70 mb-0.5">{m.authorName || 'Student'}</div>}
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    </div>
                  </li>
                )
              })}
              <div ref={endRef} />
            </ul>
          </div>

          <div className="flex gap-2">
            <textarea
              rows="2"
              className="input flex-1"
              placeholder={me ? "Type a message…" : "Sign in to chat"}
              value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={onKey}
            />
            <button onClick={handleSend} className="btn btn-primary">Send</button>
          </div>
        </section>
      </div>
    </div>
  )
}

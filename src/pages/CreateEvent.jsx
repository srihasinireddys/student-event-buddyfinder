import { useEffect, useState } from 'react'
import { createEvent } from '../lib/dataService.js'
import { useNavigate, Link } from 'react-router-dom'
import { auth } from '../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { subscribeIsAdmin } from '../lib/dataService'

// Study-focused event types
const EVENT_TYPES = [
  { value: 'ideathon',        label: 'Ideathon' },
  { value: 'hackathon',       label: 'Hackathon' },
  { value: 'coding-contest',  label: 'Coding contest' },
  { value: 'study-group',     label: 'Study group' },
  { value: 'workshop',        label: 'Workshop' },
  { value: 'seminar',         label: 'Seminar' },
  { value: 'research-meetup', label: 'Research meetup' },
  { value: 'tutoring',        label: 'Tutoring' },
  { value: 'project-partner', label: 'Project partner' },
]

export default function CreateEvent() {
  const [form, setForm] = useState({ title:'', type:'ideathon', description:'', tags:'' })
  const [saving, setSaving] = useState(false)
  const [me, setMe] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let unsubRole = null
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setMe(user || null)
      if (unsubRole) { unsubRole(); unsubRole = null }
      if (user) unsubRole = subscribeIsAdmin(user.uid, setIsAdmin)
      else setIsAdmin(false)
    })
    return () => { unsubAuth(); if (unsubRole) unsubRole() }
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!me) { alert('Please sign in first.'); return }
    if (!isAdmin) { alert('Only admins can post events. Use Messages to request.'); return }
    try {
      setSaving(true)
      await createEvent({
        ...form,
        tags: form.tags.split(',').map(s=>s.trim()).filter(Boolean)
      })
      navigate('/')
    } catch (err) {
      console.error(err)
      alert('Failed to create event. Check Firestore rules.')
    } finally {
      setSaving(false)
    }
  }

  if (!me || !isAdmin) {
    return (
      <div className="container-narrow">
        <div className="max-w-xl card space-y-3">
          <h1 className="text-2xl font-bold">Post a new event</h1>
          <p className="text-gray-700">
            Only <span className="font-semibold">admins</span> can post events.
            If you want to publish an event, please contact the admins in the group chat.
          </p>
          <Link to="/messages?t=admin-lobby" className="btn btn-primary w-max">Message admins</Link>
          {!me && <p className="text-sm text-gray-600">Tip: sign in first using the top-right button.</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="container-narrow">
      <div className="max-w-xl card">
        <h1 className="text-2xl font-bold mb-4">Post a new event</h1>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Title</label>
            <input
              required
              value={form.title}
              onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              className="input"
              placeholder="e.g., Ideathon @ CSE Block"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Type</label>
            <select
              value={form.type}
              onChange={e=>setForm(f=>({...f,type:e.target.value}))}
              className="input"
            >
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Description</label>
            <textarea
              rows="4"
              value={form.description}
              onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              className="input"
              placeholder="What, when, where, eligibility, team size…"
            ></textarea>
          </div>

          <div>
            <label className="text-sm text-gray-600">Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={e=>setForm(f=>({...f,tags:e.target.value}))}
              className="input"
              placeholder="web, genAI, beginners"
            />
          </div>

          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create event'}
          </button>
        </form>
      </div>
    </div>
  )
}

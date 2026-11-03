import { useEffect, useState } from 'react'
import { upsertProfile, getMyProfile } from '../lib/dataService.js'
import { auth } from '../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Study-focused event types
const EVENT_TYPES = [
  { value: 'ideathon',         label: 'Ideathon' },
  { value: 'hackathon',        label: 'Hackathon' },
  { value: 'coding-contest',   label: 'Coding contest' },
  { value: 'study-group',      label: 'Study group' },
  { value: 'workshop',         label: 'Workshop' },
  { value: 'seminar',          label: 'Seminar' },
  { value: 'research-meetup',  label: 'Research meetup' },
  { value: 'tutoring',         label: 'Tutoring' },
  { value: 'project-partner',  label: 'Project partner' },
  { value: 'any',              label: 'Any' },
]

export default function Profile() {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    uid: '',
    name: '',
    bio: '',
    skills: [],
    eventTypes: ['ideathon'],
  })

  // Keep form in sync with Firebase Auth + Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setMe(null)
        setLoading(false)
        return
      }
      const basic = { uid: user.uid, name: user.displayName || '', email: user.email || '' }
      setMe(basic)

      // Load profile doc if exists, else seed with auth info
      const prof = await getMyProfile(user.uid)
      setForm(prof || { uid: user.uid, name: basic.name, bio: '', skills: [], eventTypes: ['ideathon'] })
      setLoading(false)
    })
    return () => unsub()
  }, [])

  function updateField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function save() {
    if (!me) {
      alert('Please sign in first (click Get Started).')
      return
    }
    try {
      await upsertProfile({ ...form, uid: me.uid })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      console.error(e)
      alert('Failed to save profile. If you just enabled Firestore, refresh and try again.')
    }
  }

  function toggleType(value) {
    setForm(f => {
      const next = new Set(f.eventTypes || [])
      next.has(value) ? next.delete(value) : next.add(value)
      return { ...f, eventTypes: Array.from(next) }
    })
  }

  if (loading) {
    return (
      <div className="container-narrow">
        <div className="card">Loading…</div>
      </div>
    )
  }

  return (
    <div className="container-narrow">
      <div className="card space-y-6">
        <h1 className="text-2xl font-bold">My profile</h1>

        {!me && (
          <div className="text-sm text-gray-600">
            You’re not signed in. Click <span className="font-semibold">Get Started</span> in the top-right and come back.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Name</label>
            <input value={form.name} onChange={e=>updateField('name', e.target.value)} className="input" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Short bio</label>
            <input value={form.bio} onChange={e=>updateField('bio', e.target.value)} className="input" placeholder="I love JS, UI/UX..." />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Skills (comma separated)</label>
          <input
            value={(form.skills||[]).join(', ')}
            onChange={e=>updateField('skills', e.target.value.split(',').map(x=>x.trim()).filter(Boolean))}
            className="input"
            placeholder="React, Node, Design"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Interested event types</label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(t => {
              const active = (form.eventTypes||[]).includes(t.value)
              return (
                <button
                  type="button"
                  key={t.value}
                  onClick={()=>toggleType(t.value)}
                  className={active
                    ? 'px-3 py-1.5 rounded-full border bg-gray-900 text-white'
                    : 'px-3 py-1.5 rounded-full border bg-white'}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={save} className="btn btn-primary">Save profile</button>
          {saved && <span className="text-green-600 self-center">Saved!</span>}
        </div>
      </div>
    </div>
  )
}

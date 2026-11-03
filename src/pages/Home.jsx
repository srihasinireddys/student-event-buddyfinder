// src/pages/Home.jsx
import { useEffect, useState } from 'react'
import {
  listEvents,
  amIInterested,
  markInterested,
  unmarkInterested,
  listInterested,
  dmThreadId,
  ensureDMThread,
} from '../lib/dataService'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../lib/firebase'

const PILL = ({ label }) => <span className="badge bg-gray-50">{label}</span>

export default function Home() {
  const [events, setEvents] = useState([])
  const [menuOpenFor, setMenuOpenFor] = useState(null)
  const [interestMap, setInterestMap] = useState({}) // {eventId: boolean}
  const [participants, setParticipants] = useState([]) // modal data
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  // Load events
  useEffect(() => { listEvents().then(setEvents) }, [])

  // For each event, check if I'm interested
  useEffect(() => {
    (async () => {
      const map = {}
      for (const evt of events) {
        map[evt.id] = await amIInterested(evt.id)
      }
      setInterestMap(map)
    })()
  }, [events])

  function closeMenus() { setMenuOpenFor(null) }

  async function toggleInterest(evt) {
    if (!auth.currentUser) { alert('Please sign in first.'); return }
    const isIn = !!interestMap[evt.id]
    try {
      if (isIn) await unmarkInterested(evt.id)
      else await markInterested(evt.id)
      setInterestMap(s => ({ ...s, [evt.id]: !isIn }))
      closeMenus()
    } catch (e) {
      console.error(e); alert('Could not update interest.')
    }
  }

  // Open/ensure a DM thread with the host, then navigate to it
  function messageHost(evt) {
    if (!auth.currentUser) { alert('Please sign in first.'); return }
    const myUid = auth.currentUser.uid
    ensureDMThread(evt.ownerUid, evt.id)
      .then(() => {
        const tid = dmThreadId(evt.ownerUid, evt.id, myUid)
        navigate(`/messages?t=${encodeURIComponent(tid)}`)
        closeMenus()
      })
      .catch((e) => { console.error(e); alert('Could not open DM.') })
  }

  async function openParticipants(evt) {
    try {
      const list = await listInterested(evt.id)
      setParticipants(list)
      setShowModal(true)
      closeMenus()
    } catch (e) {
      console.error(e); alert('Failed to load participants.')
    }
  }

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="hero-gradient">
        <div className="container-narrow py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Find Your Perfect Teammate
          </h1>
          <p className="mt-4 text-white/90 max-w-2xl mx-auto text-lg">
            Discover ideathons, hackathons, workshops, study groups and more — and connect fast.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/find" className="btn btn-primary">Browse partners</Link>
            <Link to="/events/new" className="btn btn-ghost">Post an event</Link>
          </div>
        </div>
      </section>

      {/* EVENTS FEED */}
      <section className="container-narrow space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Latest events</h2>
          <Link to="/events/new" className="text-sm hover:underline">Create event</Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {events.length === 0 && (
            <div className="col-span-full card text-gray-600">
              No events yet. Be the first to <Link to="/events/new" className="underline">post one</Link>!
            </div>
          )}

          {events.map(evt => (
            <article key={evt.id} className="card space-y-2 relative">
              {/* 3-dot menu button */}
              <div className="absolute right-4 top-4">
                <button
                  className="w-8 h-8 rounded-full border bg-white hover:bg-gray-50"
                  onClick={() => setMenuOpenFor(menuOpenFor === evt.id ? null : evt.id)}
                >
                  ⋯
                </button>
                {menuOpenFor === evt.id && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-2xl shadow-lg p-2 z-10">
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50"
                      onClick={() => toggleInterest(evt)}
                    >
                      {interestMap[evt.id] ? 'Un-participate' : 'Participate / I’m interested'}
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50"
                      onClick={() => messageHost(evt)}
                    >
                      Message host
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50"
                      onClick={() => openParticipants(evt)}
                    >
                      View participants
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pr-12">
                <h3 className="font-semibold">{evt.title}</h3>
                <PILL label={evt.type} />
              </div>
              <p className="text-sm text-gray-600">{evt.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {(evt.tags || []).map(t => <PILL key={t} label={t} />)}
              </div>
              {interestMap[evt.id] && (
                <div className="text-xs text-green-600">You marked interest in this event.</div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* PARTICIPANTS MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Participants</h3>
              <button className="px-3 py-1.5 rounded-full border" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
            {participants.length === 0 ? (
              <div className="text-sm text-gray-600">No one has marked interest yet.</div>
            ) : (
              <ul className="space-y-2">
                {participants.map(p => (
                  <li key={p.uid} className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full border bg-gray-50">
                      {p.name || p.uid}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

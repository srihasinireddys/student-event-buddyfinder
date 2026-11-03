// FINAL inbox-enabled dataService.js

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { db, auth } from './firebase'

/* ===========================
   PROFILES
=========================== */
export async function upsertProfile(profile) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const uid = auth.currentUser.uid
  await setDoc(doc(db, 'profiles', uid), { ...profile, uid }, { merge: true })
  return { ...profile, uid }
}

export async function getMyProfile(uid) {
  if (!uid) return null
  const snap = await getDoc(doc(db, 'profiles', uid))
  return snap.exists() ? snap.data() : null
}

export async function searchProfiles({ query: qStr = '', skills = [], eventType = 'any' } = {}) {
  const base = collection(db, 'profiles')
  const qRef = eventType === 'any'
    ? base
    : query(base, where('eventTypes', 'array-contains', eventType))

  const snap = await getDocs(qRef)
  const all = snap.docs.map(d => d.data())

  const q = qStr.toLowerCase()
  return all.filter(p => {
    const matchesQuery =
      !q || p.name?.toLowerCase().includes(q) || p.bio?.toLowerCase().includes(q)
    const matchesSkills =
      !skills.length || skills.every(s => (p.skills || []).includes(s))
    return matchesQuery && matchesSkills
  })
}

/* ===========================
   EVENTS
=========================== */
export async function createEvent(evt) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const ref = await addDoc(collection(db, 'events'), {
    ...evt,
    ownerUid: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  })
  const snap = await getDoc(ref)
  return { id: ref.id, ...snap.data() }
}

export async function listEvents() {
  const qRef = query(collection(db, 'events'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(qRef)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/* ===========================
   EVENT INTEREST / PARTICIPANTS
=========================== */
export async function markInterested(eventId) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const uid = auth.currentUser.uid
  const user = auth.currentUser
  await setDoc(doc(db, 'events', eventId, 'interested', uid), {
    uid,
    name: user.displayName || 'Student',
    joinedAt: serverTimestamp(),
  })
}

export async function unmarkInterested(eventId) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const uid = auth.currentUser.uid
  await deleteDoc(doc(db, 'events', eventId, 'interested', uid))
}

export async function amIInterested(eventId) {
  if (!auth.currentUser) return false
  const uid = auth.currentUser.uid
  const snap = await getDoc(doc(db, 'events', eventId, 'interested', uid))
  return snap.exists()
}

export async function listInterested(eventId) {
  const snap = await getDocs(collection(db, 'events', eventId, 'interested'))
  return snap.docs.map(d => d.data())
}

/* ===========================
   MESSAGES / THREADS (Group + DM)
   - Public group:  threadId = "admin-lobby" (pinned in UI)
   - DM threadId:   "event-{eventId}-dm-{sortedUidA}_{sortedUidB}"
   Each thread doc (threads/{threadId}) stores:
   { participants: [uidA, uidB], isDM: true, eventId, updatedAt, lastMessage }
=========================== */
export function dmThreadId(hostUid, eventId, viewerUid) {
  const pair = [hostUid, viewerUid].sort().join('_')
  return `event-${eventId}-dm-${pair}`
}

// Ensure a DM thread doc exists with proper participants before chatting.
// Safe to call multiple times; uses merge: true.
export async function ensureDMThread(hostUid, eventId) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const viewerUid = auth.currentUser.uid
  const tid = dmThreadId(hostUid, eventId, viewerUid)
  await setDoc(
    doc(db, 'threads', tid),
    {
      participants: [hostUid, viewerUid],
      isDM: true,
      eventId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
  return tid
}

// List all DM threads that involve the current user.
// We query by array-contains and sort on the client by updatedAt (avoids composite index).
export async function listMyThreads() {
  if (!auth.currentUser) return []
  const uid = auth.currentUser.uid
  const qRef = query(collection(db, 'threads'), where('participants', 'array-contains', uid))
  const snap = await getDocs(qRef)
  const threads = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  // sort newest first
  threads.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0))
  return threads
}

// Real-time subscribe to a single thread's messages
export function subscribeThread(threadId, onChange) {
  const msgs = collection(db, 'threads', threadId, 'messages')
  const qRef = query(msgs, orderBy('createdAt', 'asc'))
  return onSnapshot(qRef, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    onChange({ id: threadId, messages: list })
  })
}

// Send a message and update the thread metadata for inbox
export async function sendMessage(threadId, text) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const user = auth.currentUser

  // write message
  await addDoc(collection(db, 'threads', threadId, 'messages'), {
    text,
    authorUid: user.uid,
    authorName: user.displayName || 'Student',
    createdAt: serverTimestamp(),
  })

  // update meta for inbox list (won't break if doc doesn't exist)
  await setDoc(
    doc(db, 'threads', threadId),
    {
      updatedAt: serverTimestamp(),
      lastMessage: text.slice(0, 120)
    },
    { merge: true }
  )
}

/* ===========================
   ADMIN ROLE SUBSCRIPTION
=========================== */
export function subscribeIsAdmin(uid, cb) {
  if (!uid) { cb(false); return () => {} }
  return onSnapshot(doc(db, 'roles', uid), (snap) => {
    cb(snap.exists() && snap.data().admin === true)
  })
}

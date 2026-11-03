import { useEffect, useState } from 'react'
import { searchProfiles } from '../lib/dataService.js'

// Study-focused filter options (dropdown)
const EVENT_TYPES = [
  { value: 'any',             label: 'any' },
  { value: 'ideathon',        label: 'ideathon' },
  { value: 'hackathon',       label: 'hackathon' },
  { value: 'coding-contest',  label: 'coding contest' },
  { value: 'study-group',     label: 'study group' },
  { value: 'workshop',        label: 'workshop' },
  { value: 'seminar',         label: 'seminar' },
  { value: 'research-meetup', label: 'research meetup' },
  { value: 'tutoring',        label: 'tutoring' },
  { value: 'project-partner', label: 'project partner' },
]

export default function FindPartners() {
  const [filters, setFilters] = useState({ query:'', skills:[], eventType:'any' })
  const [results, setResults] = useState([])

  async function runSearch() {
    const list = await searchProfiles(filters)
    setResults(list)
  }
  useEffect(()=>{ runSearch() }, [])  // initial load

  return (
    <div className="container-narrow space-y-4">
      <div className="card">
        <div className="grid md:grid-cols-3 gap-3">
          <input
            placeholder="Search by name or bio"
            value={filters.query}
            onChange={e=>setFilters(f=>({...f, query:e.target.value}))}
            className="input"
          />
          <input
            placeholder="Required skills: e.g. React, C++"
            onChange={e=>setFilters(f=>({...f, skills:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)}))}
            className="input"
          />
          <select
            value={filters.eventType}
            onChange={e=>setFilters(f=>({...f, eventType:e.target.value}))}
            className="input"
          >
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="mt-3">
          <button onClick={runSearch} className="btn btn-primary">Search</button>
        </div>
      </div>

      <ul className="grid md:grid-cols-2 gap-4">
        {results.map(p => (
          <li key={p.uid} className="card space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{p.name}</h3>
              <span className="text-xs px-2 py-1 rounded-full border bg-gray-50">
                {(p.eventTypes||[]).join(', ')}
              </span>
            </div>
            <p className="text-sm text-gray-600">{p.bio}</p>
            <div className="flex gap-2 flex-wrap">
              {(p.skills||[]).map(s => <span key={s} className="badge bg-gray-50">{s}</span>)}
            </div>
            <button className="btn btn-light">Message</button>
          </li>
        ))}
        {results.length === 0 && <div className="text-gray-600">No matches yet. Try changing filters.</div>}
      </ul>
    </div>
  )
}

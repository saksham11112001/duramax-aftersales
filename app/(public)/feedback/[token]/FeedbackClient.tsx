'use client'

import { useState } from 'react'

interface Props {
  token: string
  ticketNumber: string
  clientName: string
  siteAddress: string
}

const CATEGORIES = [
  { key: 'supervisor_rating', label: 'Technician' },
  { key: 'quality_rating',    label: 'Work Quality' },
  { key: 'timeliness_rating', label: 'Timeliness' },
]

function StarRating({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={['text-2xl transition-colors', (hover || value) >= n ? 'text-amber-400' : 'text-gray-200'].join(' ')}>
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export default function FeedbackClient({ token, ticketNumber, clientName, siteAddress }: Props) {
  const [ratings, setRatings]  = useState({ overall_rating: 0, supervisor_rating: 0, quality_rating: 0, timeliness_rating: 0 })
  const [comment, setComment]  = useState('')
  const [loading, setLoading]  = useState(false)
  const [done,    setDone]     = useState(false)
  const [error,   setError]    = useState('')

  function setRating(key: string, val: number) {
    setRatings(r => ({ ...r, [key]: val }))
  }

  async function submit() {
    if (!ratings.overall_rating) { setError('Please give an overall rating.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/feedback/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ratings, comment: comment.trim() || null }),
      })
      if (!res.ok) throw new Error('Submission failed')
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Thank you, {clientName}!</h1>
          <p className="text-sm text-gray-500">Your feedback helps us serve you better.</p>
          <div className="mt-4 text-amber-400 text-3xl">{'★'.repeat(ratings.overall_rating)}<span className="text-gray-200">{'★'.repeat(5 - ratings.overall_rating)}</span></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-teal-700 p-5 text-white">
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">Service Feedback</div>
          <div className="font-semibold">{ticketNumber} — {clientName}</div>
          <div className="text-white/60 text-xs mt-0.5">{siteAddress}</div>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-500 mb-5">How was your experience? Takes 30 seconds. Completely optional.</p>

          {/* Overall rating */}
          <div className="mb-5 text-center">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Overall Rating</div>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setRating('overall_rating', n)}
                  className={['text-4xl transition-colors', ratings.overall_rating >= n ? 'text-amber-400' : 'text-gray-200'].join(' ')}>
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Category ratings */}
          <div className="mb-4">
            {CATEGORIES.map(cat => (
              <StarRating key={cat.key} label={cat.label}
                value={ratings[cat.key as keyof typeof ratings]}
                onChange={val => setRating(cat.key, val)} />
            ))}
          </div>

          {/* Comment */}
          <div className="mb-4">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us what went well or what could be better… (optional)"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              rows={3}
            />
          </div>

          {error && <div className="text-sm text-red-500 mb-3">{error}</div>}

          <div className="flex gap-2">
            <button onClick={() => setDone(true)}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
              Skip
            </button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white rounded-lg text-sm font-semibold transition-colors">
              {loading ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

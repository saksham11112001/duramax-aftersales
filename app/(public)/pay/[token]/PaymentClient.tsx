'use client'

import { useState } from 'react'
import Script from 'next/script'

interface Props {
  token:         string
  paymentId:     string
  amountPaise:   number
  paymentType:   string
  ticketNumber:  string
  clientName:    string
  clientMobile:  string
  siteAddress:   string
  razorpayKeyId: string
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export default function PaymentClient({
  token, paymentId, amountPaise, paymentType,
  ticketNumber, clientName, clientMobile, siteAddress, razorpayKeyId
}: Props) {
  const [loading,  setLoading]  = useState(false)
  const [paid,     setPaid]     = useState(false)
  const [error,    setError]    = useState('')
  const [txnId,    setTxnId]    = useState('')
  const [rzLoaded, setRzLoaded] = useState(false)

  const amountRupees = amountPaise / 100
  const isVisitFee   = paymentType === 'visit_fee'

  async function handlePay() {
    if (!rzLoaded) { setError('Payment SDK not loaded. Please refresh.'); return }
    setLoading(true)
    setError('')

    try {
      // Create Razorpay order
      const res  = await fetch(`/api/pay/${token}/create-order`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create order')

      // Open Razorpay checkout — handles UPI, net banking, cards, wallets automatically
      const rzp = new window.Razorpay({
        key:         razorpayKeyId,
        order_id:    data.order_id,
        amount:      amountPaise,
        currency:    'INR',
        name:        'Duromax UPVC',
        description: isVisitFee ? 'Site Visit Fee' : 'Spare Parts + Labour',
        image:       '',
        prefill: {
          name:    clientName,
          contact: clientMobile,
        },
        notes: {
          ticket_number: ticketNumber,
          payment_token: token,
        },
        theme: { color: '#0C6E58' },

        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Payment succeeded on Razorpay — webhook also fires server-side
          // We just update UI here; webhook handles DB update
          setTxnId(response.razorpay_payment_id)
          setPaid(true)
          setLoading(false)
        },

        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
      })
      rzp.open()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Payment failed. Please try again.')
      setLoading(false)
    }
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-teal-400">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Payment Successful!</h1>
            <p className="text-sm text-gray-500">
              ₹{amountRupees.toLocaleString('en-IN')} paid successfully.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction ID</span>
              <span className="font-mono text-xs font-medium">{txnId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ticket</span>
              <span className="font-medium">{ticketNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount</span>
              <span className="font-medium">₹{amountRupees.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">WhatsApp Receipt</span>
              <span className="text-teal-600 font-medium">✓ Sent</span>
            </div>
          </div>
          <div className="mt-5 bg-teal-50 border border-teal-100 rounded-xl p-3 text-center text-sm text-teal-700">
            💬 A receipt has been sent to your WhatsApp.
          </div>
          <a href={`/?track=${ticketNumber}`}
            className="mt-4 block text-center text-sm text-teal-600 hover:text-teal-800 font-medium">
            Track your request →
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRzLoaded(true)}
      />

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden max-w-sm w-full shadow-sm">

          {/* Header */}
          <div className="bg-teal-700 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-white text-lg">🏠</div>
              <div>
                <div className="text-white font-semibold text-sm">Duromax UPVC</div>
                <div className="text-white/60 text-xs">Secure Payment</div>
              </div>
            </div>
            <div>
              <div className="text-white/60 text-xs mb-0.5 uppercase tracking-wide font-medium">
                {isVisitFee ? 'Site Visit Fee' : 'Spare Parts + Labour'}
              </div>
              <div className="text-white text-3xl font-bold">
                ₹{amountRupees.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Security badges */}
          <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">🔒 SSL Secured</span>
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">🛡️ PCI DSS</span>
            <span className="text-xs text-gray-400 font-medium ml-auto">Powered by Razorpay</span>
          </div>

          {/* Order summary */}
          <div className="p-5">
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm border border-gray-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Ticket</span>
                <span className="font-medium">{ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Customer</span>
                <span className="font-medium">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Site</span>
                <span className="text-right font-medium max-w-[55%] text-xs leading-tight">{siteAddress}</span>
              </div>
            </div>

            {/* Payment methods info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-700">
              <div className="font-semibold mb-1">All payment methods accepted</div>
              <div className="text-blue-600">GPay · PhonePe · Paytm · BHIM UPI · All bank net banking · Debit &amp; credit cards</div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {isVisitFee && (
              <p className="text-xs text-gray-400 mb-4 text-center">
                This fee covers the technician's visit and diagnosis.
              </p>
            )}
            {!isVisitFee && (
              <p className="text-xs text-gray-400 mb-4 text-center">
                Pay only after you are satisfied with the repair.
              </p>
            )}

            <button
              onClick={handlePay}
              disabled={loading || !rzLoaded}
              className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Opening payment…
                </>
              ) : !rzLoaded ? 'Loading…' : `Pay ₹${amountRupees.toLocaleString('en-IN')} →`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

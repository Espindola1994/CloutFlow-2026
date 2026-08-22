'use client';

import { useState } from 'react';

export default function UnsubscribeClient({ email, token, initialValid }: { email: string; token: string; initialValid: boolean }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!initialValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h1>
          <p className="text-gray-600">This unsubscribe link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const handleUnsubscribe = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to unsubscribe');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error occurred. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unsubscribed Successfully</h1>
          <p className="text-gray-600 mb-6">
            <strong>{email}</strong> has been removed from our marketing emails.
          </p>
          <p className="text-sm text-gray-500">
            You will still receive important transactional emails related to your orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Confirm Unsubscribe</h1>
        <p className="text-gray-600 mb-6">
          Are you sure you want to stop receiving promotional and recovery emails for <strong>{email}</strong>?
        </p>
        {status === 'error' && (
          <p className="text-red-600 text-sm mb-4">{errorMessage}</p>
        )}
        <button
          onClick={handleUnsubscribe}
          disabled={status === 'loading'}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? 'Unsubscribing...' : 'Yes, Unsubscribe'}
        </button>
        <p className="text-xs text-gray-400 mt-4">
          Transactional messages regarding active orders will not be affected.
        </p>
      </div>
    </div>
  );
}

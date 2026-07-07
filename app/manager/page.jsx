"use client";

import React, { useState } from 'react';

export default function ManagerDashboard() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to talk to our Node.js Inject Funds route
  const handleInjectFunds = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Processing...');

    try {
      const response = await fetch('http://localhost:3001/api/manager/inject-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      });
      
      const data = await response.json();
      setMessage(data.message || `Error: ${data.error}`);
    } catch (error) {
      setMessage('Failed to connect to the backend server. Is it running on port 3001?');
    }
    
    setLoading(false);
  };

  // Function to talk to our Node.js Toggle Status route
  const handleToggleStatus = async (newStatus) => {
    if (!userId) {
      setMessage('Please enter a User ID first.');
      return;
    }
    
    setLoading(true);
    setMessage('Updating status...');

    try {
      const response = await fetch('http://localhost:3001/api/manager/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newStatus }),
      });
      
      const data = await response.json();
      setMessage(data.message || `Error: ${data.error}`);
    } catch (error) {
      setMessage('Failed to connect to the backend server.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 font-sans text-slate-200">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 border-b border-slate-700 pb-6">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <svg className="w-8 h-8 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            System Administration
          </h1>
          <p className="text-slate-400 mt-2">Manage client accounts and perform manual ledger adjustments.</p>
        </div>

        {/* Status Message Display */}
        {message && (
          <div className="bg-slate-800 border-l-4 border-emerald-500 p-4 mb-8 rounded shadow-lg">
            <p className="font-mono text-emerald-400 text-sm">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Target User Card */}
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 md:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4">Target User ID</h2>
            <p className="text-xs text-slate-400 mb-4">Enter the UUID of the client from the Supabase Profiles table.</p>
            <input 
              type="text" 
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000" 
              className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          {/* Inject Funds Card */}
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Inject Funds</h2>
            <form onSubmit={handleInjectFunds} className="flex flex-col space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="500.00" 
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !userId}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Execute Deposit
              </button>
            </form>
          </div>

          {/* Account Restriction Card */}
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Account Security</h2>
            <p className="text-sm text-slate-400 mb-6">Instantly freeze or unfreeze a client account. Restrictions disable outbound transfers.</p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => handleToggleStatus('restricted')}
                disabled={loading || !userId}
                className="bg-rose-900/50 border border-rose-700 text-rose-400 hover:bg-rose-800 hover:text-white font-bold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                RESTRICT Account
              </button>
              <button 
                onClick={() => handleToggleStatus('active')}
                disabled={loading || !userId}
                className="bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white font-bold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                UN-RESTRICT Account
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
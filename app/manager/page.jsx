"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function ManagerDashboard() {
  const router = useRouter();
  const [managerId, setManagerId] = useState(null);
  
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const [newUser, setNewUser] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardAction, setRewardAction] = useState('add');
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fetch the manager's UUID and Audit Logs on load
  const fetchManagerData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    setManagerId(user.id);
    
    // Fetch Operations Audit Trail
    const { data: logs } = await supabase
      .from('manager_audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });
      
    if (logs) setAuditLogs(logs);
  };

  useEffect(() => {
    fetchManagerData();
  }, [router]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('Creating secure profile...');
    try {
      const response = await fetch(`${API_URL}/api/manager/create-user`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      setMessage(data.message || `Error: ${data.error}`);
      if (!data.error) setNewUser({ email: '', password: '', firstName: '', lastName: '', phone: '' }); 
    } catch (error) { setMessage('Failed to connect to the backend server.'); }
    setLoading(false);
  };

  const handleInjectFunds = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('Processing ledger update...');
    try {
      const response = await fetch(`${API_URL}/api/manager/inject-funds`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, amount, description, managerId }), // Pass managerId for audit log
      });
      const data = await response.json();
      setMessage(data.message || `Error: ${data.error}`);
      if (!data.error) { 
          setAmount(''); 
          setDescription(''); 
          fetchManagerData(); // Refresh logs after action
      }
    } catch (error) { setMessage('Failed to connect to the backend server.'); }
    setLoading(false);
  };

  const handleToggleStatus = async (newStatus) => {
    if (!identifier) return setMessage('Please enter an Email or UUID first.');
    setLoading(true); setMessage('Updating security status...');
    try {
      const response = await fetch(`${API_URL}/api/manager/toggle-status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, newStatus, managerId }), // Pass managerId for audit log
      });
      const data = await response.json();
      setMessage(data.message || `Error: ${data.error}`);
      if (!data.error) fetchManagerData(); // Refresh logs after action
    } catch (error) { setMessage('Failed to connect to the backend server.'); }
    setLoading(false);
  };
const handleUpdateRewards = async (e) => {
  e.preventDefault();
  if (!identifier) return setMessage('Please enter an Email or UUID first in Step 2.');
  setLoading(true); setMessage('Updating rewards balance...');
  try {
    const response = await fetch(`${API_URL}/api/manager/update-rewards`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, amount: rewardAmount, action: rewardAction }),
    });
    const data = await response.json();
    setMessage(data.message || `Error: ${data.error}`);
    if (!data.error) setRewardAmount('');
  } catch (error) { setMessage('Failed to connect to the backend server.'); }
  setLoading(false);
};
  return (
    <div className="min-h-screen bg-slate-900 p-8 font-sans text-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 border-b border-slate-700 pb-6">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <svg className="w-8 h-8 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            Private Wealth Administration
          </h1>
          <p className="text-slate-400 mt-2">Manage client profiles, generate accounts, and perform manual ledger adjustments.</p>
        </div>

        {message && (
          <div className={`border-l-4 p-4 mb-8 rounded shadow-lg bg-slate-800 ${message.includes('Error') ? 'border-rose-500 text-rose-400' : 'border-emerald-500 text-emerald-400'}`}>
            <p className="font-mono text-sm">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 md:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">1. Register New Client</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">First Name</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500" value={newUser.firstName} onChange={(e) => setNewUser({...newUser, firstName: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Last Name</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500" value={newUser.lastName} onChange={(e) => setNewUser({...newUser, lastName: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Client Email (Login)</label>
                <input type="email" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Assign Password</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required minLength={6} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                <input type="tel" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} required />
              </div>
              <div className="md:col-span-2 mt-2">
                <button type="submit" disabled={loading} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded transition disabled:opacity-50">Generate Profile & Bank Accounts</button>
              </div>
            </form>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 md:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-2">2. Select Target User</h2>
            <p className="text-xs text-slate-400 mb-4">Enter an email or UUID to inject funds or restrict access.</p>
            <input 
              type="text" placeholder="client@email.com or UUID" 
              className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
              value={identifier} onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Inject / Deduct Funds</h2>
            <form onSubmit={handleInjectFunds} className="flex flex-col space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Amount ($) <span className="lowercase text-slate-500">- Use minus for deduction</span></label>
                <input 
                  type="number" step="0.01" placeholder="500.00" 
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  value={amount} onChange={(e) => setAmount(e.target.value)} required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Custom Description (Optional)</label>
                <input 
                  type="text" placeholder="e.g. Wire Transfer from XYZ" 
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading || !identifier} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded transition disabled:opacity-50 mt-2">Execute Ledger Adjustment</button>
            </form>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 mt-6">
            <h2 className="text-lg font-semibold text-white mb-4">Manage Rewards (Miles)</h2>
            <form onSubmit={handleUpdateRewards} className="flex flex-col space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Action</label>
                  <select className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500" value={rewardAction} onChange={(e) => setRewardAction(e.target.value)}>
                    <option value="add">Add Miles (Bonus/Earned)</option>
                    <option value="subtract">Subtract Miles (Redeemed)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Amount (Miles)</label>
                  <input 
                    type="number" placeholder="50000" 
                    className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || !identifier} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded transition disabled:opacity-50 mt-2">Update Rewards Balance</button>
            </form>
          </div>
          

          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Account Security</h2>
            <p className="text-sm text-slate-400 mb-6">Freeze or unfreeze a client account. Restrictions disable all money movement.</p>
            <div className="flex flex-col space-y-3">
              <button onClick={() => handleToggleStatus('restricted')} disabled={loading || !identifier} className="bg-rose-900/50 border border-rose-700 text-rose-400 hover:bg-rose-800 hover:text-white font-bold py-3 rounded transition disabled:opacity-50">RESTRICT Account</button>
              <button onClick={() => handleToggleStatus('active')} disabled={loading || !identifier} className="bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white font-bold py-3 rounded transition disabled:opacity-50">UN-RESTRICT Account</button>
            </div>
          </div>

          {/* New Audit Trail Section */}
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 md:col-span-2 mt-4">
            <h2 className="text-lg font-semibold text-white mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">
               Compliance Audit Trail
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-600 bg-slate-900/50">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Timestamp</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Action Taken</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Target UUID</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Operation Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-slate-500">No audit records found.</td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                        <td className="p-4 text-sm font-mono text-slate-300">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 text-sm">
                          <span className={`px-3 py-1 rounded text-xs font-bold tracking-wide ${
                            log.action_taken === 'INJECT_FUNDS' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50' : 'bg-rose-900/50 text-rose-400 border border-rose-700/50'
                          }`}>
                            {log.action_taken}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono text-slate-400">
                          {log.target_user_id}
                        </td>
                        <td className="p-4 text-sm text-slate-300">
                          <pre className="bg-slate-900 p-3 rounded text-xs border border-slate-700 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
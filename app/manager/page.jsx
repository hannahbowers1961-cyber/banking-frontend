"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function ManagerDashboard() {
  const router = useRouter();
  const [managerId, setManagerId] = useState(null);
  const [activeTab, setActiveTab] = useState('onboarding');
  
  // Global Target User
  const [identifier, setIdentifier] = useState('');
  
  // Form States
  const [newUser, setNewUser] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardAction, setRewardAction] = useState('add');
  
  // New Product States
  const [creditData, setCreditData] = useState({ cardName: 'Quicksilver Rewards', creditLimit: 10000, balance: 0 });
  const [loanData, setLoanData] = useState({ loanName: '2024 Auto Loan', principal: 25000, monthlyPayment: 450, nextPaymentDate: '' });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchManagerData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { 
      router.replace('/'); 
      return; 
    }

    // Check if their database profile has the admin badge
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_manager')
      .eq('id', user.id)
      .single();

    // --- THE SILENT REJECTION ---
    // If they aren't a manager, silently wipe this route and send them away
    if (error || !profile?.is_manager) {
      router.replace('/dashboard'); // Silently drops them back at their client dashboard
      return;
    }
    // ----------------------------

    // Only unlock the UI if the check passes 100%
    setIsAuthorized(true);
    setManagerId(user.id);
    
    // Fetch Operations Audit Trail
    const { data: logs } = await supabase
      .from('manager_audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });
      
    if (logs) setAuditLogs(logs);
  };

  useEffect(() => { fetchManagerData(); }, [router]);

  // --- HANDLERS ---
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
    if (!identifier) return setMessage('Please set a Target User UUID/Email at the top.');
    setLoading(true); setMessage('Processing ledger update...');
    try {
      const response = await fetch(`${API_URL}/api/manager/inject-funds`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, amount, description, managerId }), 
      });
      const data = await response.json();
      setMessage(data.message || `Error: ${data.error}`);
      if (!data.error) { setAmount(''); setDescription(''); fetchManagerData(); }
    } catch (error) { setMessage('Failed to connect to the backend server.'); }
    setLoading(false);
  };

  const handleUpdateRewards = async (e) => {
    e.preventDefault();
    if (!identifier) return setMessage('Please set a Target User UUID/Email at the top.');
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

  const handleToggleStatus = async (newStatus) => {
    if (!identifier) return setMessage('Please set a Target User UUID/Email at the top.');
    setLoading(true); setMessage('Updating security status...');
    try {
      const response = await fetch(`${API_URL}/api/manager/toggle-status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, newStatus, managerId }), 
      });
      const data = await response.json();
      setMessage(data.message || `Error: ${data.error}`);
      if (!data.error) fetchManagerData(); 
    } catch (error) { setMessage('Failed to connect to the backend server.'); }
    setLoading(false);
  };

  const handleIssueProduct = async (e, type) => {
    e.preventDefault();
    if (!identifier) return setMessage('Please set a Target User UUID/Email at the top.');
    setLoading(true); setMessage(`Issuing new ${type}...`);
    try {
      const endpoint = type === 'credit' ? '/api/manager/create-credit' : '/api/manager/create-loan';
      const payload = type === 'credit' ? creditData : loanData;
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, ...payload, managerId }),
      });
      const data = await response.json();
      setMessage(data.message || `Error: ${data.error}`);
      if (!data.error) fetchManagerData();
    } catch (error) { setMessage('Failed to connect to the backend server.'); }
    setLoading(false);
  };
// If they aren't verified yet, render an empty screen so nothing leaks/flashes
  if (!isAuthorized) {
    return null; 
  }
  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans text-slate-200">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 border-b border-slate-700 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <svg className="w-8 h-8 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              Core Banking Console
            </h1>
            <p className="text-slate-400 mt-2">Enterprise Administration & Compliance Management</p>
          </div>
          
          {/* GLOBAL TARGET USER INPUT */}
          <div className="w-full md:w-auto bg-slate-800 p-3 rounded-lg border border-slate-600 flex items-center shadow-inner">
            <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" placeholder="Global Target (Email / UUID)" 
              className="bg-transparent border-none text-white focus:outline-none font-mono text-sm w-full md:w-64 placeholder-slate-500"
              value={identifier} onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {message && (
          <div className={`border-l-4 p-4 mb-6 rounded shadow-lg bg-slate-800 animate-in slide-in-from-top-4 ${message.includes('Error') ? 'border-rose-500 text-rose-400' : 'border-emerald-500 text-emerald-400'}`}>
            <div className="flex justify-between items-center">
              <p className="font-mono text-sm">{message}</p>
              <button onClick={() => setMessage('')} className="text-slate-500 hover:text-white">✕</button>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div className="flex overflow-x-auto space-x-2 mb-6 border-b border-slate-700 pb-2">
          {['onboarding', 'ledger', 'products', 'security'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg font-bold text-sm uppercase tracking-wider transition ${activeTab === tab ? 'bg-emerald-600/20 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* TAB CONTENT: ONBOARDING */}
        {activeTab === 'onboarding' && (
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 animate-in fade-in">
            <h2 className="text-xl font-semibold text-white mb-6 border-b border-slate-700 pb-2">Register New Client Entity</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">First Name</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500" value={newUser.firstName} onChange={(e) => setNewUser({...newUser, firstName: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Last Name</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500" value={newUser.lastName} onChange={(e) => setNewUser({...newUser, lastName: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Client Email (Login)</label>
                <input type="email" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Assign Password</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required minLength={6} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Phone Number</label>
                <input type="tel" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} required />
              </div>
              <div className="md:col-span-2 mt-4">
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded shadow-lg transition disabled:opacity-50 flex justify-center items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                  Generate Profile & Accounts
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB CONTENT: LEDGER & REWARDS */}
        {activeTab === 'ledger' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Manual Ledger Injection</h2>
              <form onSubmit={handleInjectFunds} className="flex flex-col space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Amount ($) <span className="lowercase text-slate-500">- Use minus for deduction</span></label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Custom Description</label>
                  <input type="text" placeholder="e.g. ACH Reversal" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <button type="submit" disabled={loading || !identifier} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded transition disabled:opacity-50 mt-4">Execute Ledger Adjustment</button>
              </form>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Rewards Modification</h2>
              <form onSubmit={handleUpdateRewards} className="flex flex-col space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Action</label>
                  <select className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500" value={rewardAction} onChange={(e) => setRewardAction(e.target.value)}>
                    <option value="add">Add Miles (Bonus/Earned)</option>
                    <option value="subtract">Subtract Miles (Redeemed)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Amount (Miles)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading || !identifier} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded transition disabled:opacity-50 mt-4">Update Rewards Balance</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB CONTENT: PRODUCTS & LINES OF CREDIT */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Issue Credit Card</h2>
              <form onSubmit={(e) => handleIssueProduct(e, 'credit')} className="flex flex-col space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Card Type</label>
                  <select className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500" value={creditData.cardName} onChange={(e) => setCreditData({...creditData, cardName: e.target.value})}>
                    <option value="Quicksilver Rewards">Quicksilver Rewards</option>
                    <option value="SavorOne Cash Rewards">SavorOne Cash Rewards</option>
                    <option value="Venture X">Venture X</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Limit ($)</label>
                    <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white font-mono" value={creditData.creditLimit} onChange={(e) => setCreditData({...creditData, creditLimit: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Start Bal ($)</label>
                    <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white font-mono" value={creditData.balance} onChange={(e) => setCreditData({...creditData, balance: e.target.value})} required />
                  </div>
                </div>
                <button type="submit" disabled={loading || !identifier} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition disabled:opacity-50 mt-4">Issue Card</button>
              </form>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Originate Auto / Personal Loan</h2>
              <form onSubmit={(e) => handleIssueProduct(e, 'loan')} className="flex flex-col space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Loan Title</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500" value={loanData.loanName} onChange={(e) => setLoanData({...loanData, loanName: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Principal ($)</label>
                    <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white font-mono" value={loanData.principal} onChange={(e) => setLoanData({...loanData, principal: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Monthly ($)</label>
                    <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white font-mono" value={loanData.monthlyPayment} onChange={(e) => setLoanData({...loanData, monthlyPayment: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">First Payment Date</label>
                  <input type="date" className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white" value={loanData.nextPaymentDate} onChange={(e) => setLoanData({...loanData, nextPaymentDate: e.target.value})} required />
                </div>
                <button type="submit" disabled={loading || !identifier} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded transition disabled:opacity-50 mt-4">Originate Loan</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB CONTENT: SECURITY & AUDIT */}
        {activeTab === 'security' && (
          <div className="animate-in fade-in">
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 mb-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white mb-2">Status & Feature Lock</h2>
                <p className="text-sm text-slate-400">Restricting an account disables all money movement for the targeted user immediately.</p>
              </div>
              <div className="flex space-x-3 w-full md:w-auto">
                <button onClick={() => handleToggleStatus('restricted')} disabled={loading || !identifier} className="flex-1 md:flex-none bg-rose-900/50 border border-rose-700 text-rose-400 hover:bg-rose-800 hover:text-white font-bold py-3 px-6 rounded transition disabled:opacity-50">LOCK</button>
                <button onClick={() => handleToggleStatus('active')} disabled={loading || !identifier} className="flex-1 md:flex-none bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white font-bold py-3 px-6 rounded transition disabled:opacity-50">UNLOCK</button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
              <h2 className="text-lg font-semibold text-white p-6 border-b border-slate-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                Master Audit Ledger
              </h2>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-900 shadow">
                    <tr>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Timestamp</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Action</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Target UUID</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan="4" className="p-6 text-center text-slate-500">No audit records found.</td></tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                          <td className="p-4 text-xs font-mono text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-4 text-xs">
                            <span className="px-2 py-1 rounded font-bold tracking-wide bg-slate-700 text-slate-300 border border-slate-600">
                              {log.action_taken}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-mono text-slate-500">{log.target_user_id.split('-')[0]}...</td>
                          <td className="p-4 text-xs text-slate-300">
                            <pre className="bg-slate-900 p-2 rounded text-[10px] border border-slate-700 overflow-x-auto">
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
        )}

      </div>
    </div>
  );
}
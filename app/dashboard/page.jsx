"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

// --- ENHANCED STATIC MOCK DATA ---
const upcomingTransactions = [
  { id: 8, name: "Netflix", category: "Entertainment", amount: "-15.49", date: "Jul 15, 2026", color: "bg-[#e50914]", initial: "N" },
  { id: 9, name: "GEICO Auto", category: "Insurance", amount: "-125.00", date: "Jul 18, 2026", color: "bg-[#00529b]", initial: "G" },
  { id: 10, name: "Planet Fitness", category: "Health & Fitness", amount: "-10.00", date: "Jul 20, 2026", color: "bg-[#673ab7]", initial: "P" },
  { id: 11, name: "Spotify", category: "Entertainment", amount: "-11.99", date: "Jul 22, 2026", color: "bg-[#1db954]", initial: "S" },
];

const navItems = [
  { id: "checking", name: "Checking... 0096", icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> },
  { id: "savings", name: "Savings... 3886", icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
  { id: "credit", name: "Credit Cards... 9794", icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> },
  { id: "loans", name: "Loans... 2284", icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg> },
  { id: "rewards", name: "Rewards & Deals", icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> },
  { id: "activity", name: "Recent Activity", icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> },
];

export default function ClientDashboard() {
  const router = useRouter();
  
  // UI & View State
  const [activeTab, setActiveTab] = useState('checking'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState('none'); 
  
  // Animation States
  const [scoreAnim, setScoreAnim] = useState(0); 
  const [displayedScore, setDisplayedScore] = useState(0);

  // Form & Toggle States
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDirection, setTransferDirection] = useState('c2s');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isDebitLocked, setIsDebitLocked] = useState(false);
  const [isCreditLocked, setIsCreditLocked] = useState(false);

  // Database State
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingBalance, setCheckingBalance] = useState("0.00");
  const [savingsBalance, setSavingsBalance] = useState("0.00");
  const [transactions, setTransactions] = useState([]);

  // Fetch Data
  const fetchUserData = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      router.push('/');
      return;
    }
    setUserId(user.id);

    const { data: account } = await supabase.from('accounts').select('balance, savings_balance').eq('user_id', user.id).single();
    if (account) {
      setCheckingBalance(account.balance);
      setSavingsBalance(account.savings_balance || "0.00");
    }

    const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (txs) setTransactions(txs);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserData();
    
    // Animate SVG Circle
    const timer = setTimeout(() => setScoreAnim(85), 300);
    
    // Animate Number Counter
    let current = 0;
    const target = 790;
    const step = Math.ceil(target / 60); 
    const counter = setInterval(() => {
      current += step;
      if (current >= target) {
        setDisplayedScore(target);
        clearInterval(counter);
      } else {
        setDisplayedScore(current);
      }
    }, 16);

    return () => {
      clearTimeout(timer);
      clearInterval(counter);
    };
  }, [router]);

  // Database Execution
  const executeTransfer = async () => {
    if (!transferAmount || transferAmount <= 0) return;
    setIsTransferring(true);
    
    await fetch('http://localhost:3001/api/client/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount: transferAmount, direction: transferDirection }),
    });

    await fetchUserData(); 
    setActiveModal('none');
    setTransferAmount('');
    setIsTransferring(false);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Renders the transaction list logic
  const renderTransactionList = (limit = null) => {
    if (transactions.length === 0) return <div className="p-8 text-center text-gray-400">No recent transactions.</div>;
    
    const displayTxs = limit ? transactions.slice(0, limit) : transactions;
    
    return displayTxs.map((tx) => {
      const rawAmount = Number(tx.amount);
      const isActuallyWithdrawal = tx.type === 'withdrawal' || rawAmount < 0;
      const isTransfer = tx.type === 'transfer';
      const absAmount = Math.abs(rawAmount).toFixed(2);
      
      let txPrefix = '+'; let txColor = 'bg-emerald-500'; let textColor = 'text-emerald-600'; let iconChar = '+';
      if (isActuallyWithdrawal) { txPrefix = '-'; txColor = 'bg-[#dd0031]'; textColor = 'text-[#dd0031]'; iconChar = '-'; } 
      else if (isTransfer) { txPrefix = '-'; txColor = 'bg-[#0071ce]'; textColor = 'text-[#0071ce]'; iconChar = '⇄'; }

      return (
        <div key={tx.id} className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b border-gray-50 hover:bg-gray-50 transition">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full ${txColor} text-white flex items-center justify-center font-bold text-xl shadow-sm`}>{iconChar}</div>
            <div>
              <div className="font-bold text-base text-gray-800 capitalize">{tx.type}</div>
              <div className="text-xs text-gray-500 capitalize">{tx.status}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-semibold text-base ${textColor}`}>{txPrefix}${absAmount}</div>
            <div className="text-xs text-gray-500">{formatDate(tx.created_at)}</div>
          </div>
        </div>
      );
    });
  };

  if (isLoading) return <div className="min-h-screen bg-[#e8eef3] flex items-center justify-center font-bold text-[#004879]">Securely loading your accounts...</div>;

  return (
    <>
      <div className="min-h-screen bg-[#e8eef3] font-sans md:pb-10 print:hidden text-gray-800">
        
        {/* HEADER */}
        <header className="bg-white px-4 md:px-6 shadow-sm z-30 relative md:rounded-t-xl max-w-[1400px] mx-auto md:mt-4 flex justify-between items-center py-3">
          <div className="flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden mr-4 text-[#004879] focus:outline-none">
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              )}
            </button>
            <Image src="/capitalone-com-wordmark.png" alt="Logo" width={130} height={40} style={{ width: 'auto', height: '35px' }} className="object-contain" priority />
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="text-xs font-bold text-gray-500 hover:text-red-600 hidden md:block">Sign Out</button>
            <div className="w-9 h-9 rounded-full bg-[#004879] text-white flex items-center justify-center font-bold text-sm">US</div>
          </div>

          {/* MOBILE DROPDOWN - Moved inside the relative header container! */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full bg-[#00426b] shadow-2xl border-t border-[#003456] z-[100] rounded-b-xl overflow-hidden">
              <nav className="flex flex-col py-2">
                {navItems.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`flex items-center px-6 py-4 cursor-pointer transition-colors ${activeTab === item.id ? 'bg-[#005a8f] border-l-4 border-blue-300' : 'text-gray-300 hover:bg-[#004f80] border-l-4 border-transparent'}`}
                  >
                    {item.icon} <span className={`text-sm ${activeTab === item.id ? 'font-bold text-white' : 'font-medium'}`}>{item.name}</span>
                  </div>
                ))}
              </nav>
              <div className="px-6 pb-6 pt-2 space-y-3">
                 <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="w-full text-center text-gray-300 hover:text-white text-sm font-bold py-2">Sign Out</button>
              </div>
            </div>
          )}
        </header>

        {/* MAIN APP CONTAINER */}
        <div className="max-w-[1400px] mx-auto bg-[#00426b] md:rounded-b-xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative z-10">
          
          {/* LEFT SIDEBAR */}
          <aside className="hidden md:flex w-64 flex-shrink-0 flex-col py-6">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id)} 
                  className={`flex items-center px-6 py-3 cursor-pointer transition-colors ${activeTab === item.id ? 'bg-[#005a8f] border-l-4 border-blue-300' : 'text-gray-300 hover:bg-[#004f80] border-l-4 border-transparent'}`}
                >
                  {item.icon} <span className={`text-sm ${activeTab === item.id ? 'font-bold text-white' : 'font-medium'}`}>{item.name}</span>
                </div>
              ))}
            </nav>

            <div className="mt-8 px-6">
              <div className="bg-[#003456] rounded-xl p-4 flex flex-col items-center shadow-inner relative overflow-hidden group cursor-pointer hover:bg-[#002844] transition-colors">
                <span className="text-white font-semibold text-sm mb-4">CreditWise</span>
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="absolute w-full h-full -rotate-90">
                    <path className="text-[#002844]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-[#00e396] transition-all duration-[1500ms] ease-out" strokeDasharray={`${scoreAnim}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div className="text-center flex flex-col items-center z-10">
                    <span className="text-3xl font-bold text-white leading-tight">{displayedScore}</span>
                    <span className="text-xs text-white font-medium">Excellent</span>
                  </div>
                </div>
                <div className="mt-4 text-center w-full"><button className="text-white text-xs font-bold group-hover:underline focus:outline-none">SEE YOUR SCORE &gt;</button></div>
              </div>
            </div>
          </aside>

          {/* DYNAMIC CONTENT GRID */}
          <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 bg-[#00426b]">
            
            {/* THE DYNAMIC MIDDLE COLUMN */}
            <div className="lg:col-span-7 flex flex-col space-y-4 md:space-y-6">
              
              {/* Checking View */}
              {activeTab === 'checking' && (
                <>
                  <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">360 Checking</h2>
                    <div className="text-[40px] font-bold text-[#004879] leading-none mb-6">
                      ${Number(checkingBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="border-t border-gray-100 pt-5 mb-6">
                      <h2 className="text-xl font-bold text-gray-800 mb-1">360 Savings</h2>
                      <div className="text-2xl font-bold text-[#004879] leading-none">
                        ${Number(savingsBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button onClick={() => setActiveModal('transfer')} className="w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded text-sm transition shadow-sm focus:outline-none">
                      Transfer Funds
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow flex-1 flex flex-col min-h-[300px] animate-in fade-in duration-300">
                    <div className="p-5 md:p-6 pb-2 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                      <button onClick={() => setActiveTab('activity')} className="text-sm font-bold text-[#0071ce] hover:underline focus:outline-none">View All</button>
                    </div>
                    <div className="flex-1 flex flex-col">
                      {renderTransactionList(5)}
                    </div>
                  </div>
                </>
              )}

              {/* Savings View */}
              {activeTab === 'savings' && (
                <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300 min-h-[500px]">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">360 Performance Savings</h2>
                  <p className="text-gray-500 text-sm mb-6">Account ending in ...3886</p>
                  
                  <div className="bg-[#e8eef3] rounded-lg p-6 mb-8 flex justify-between items-center border border-blue-100">
                    <div>
                      <div className="text-sm text-gray-600 font-bold uppercase tracking-wider mb-1">Available Balance</div>
                      <div className="text-[48px] font-bold text-[#004879] leading-none">
                         ${Number(savingsBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold text-emerald-600">4.25%</div>
                      <div className="text-xs text-gray-500 font-bold mt-1">Annual Percentage Yield (APY)</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button onClick={() => { setTransferDirection('c2s'); setActiveModal('transfer'); }} className="bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded transition shadow-sm focus:outline-none">Add Money</button>
                    <button onClick={() => { setTransferDirection('s2c'); setActiveModal('transfer'); }} className="bg-blue-50 text-[#0071ce] hover:bg-blue-100 font-bold py-3 rounded transition shadow-sm focus:outline-none">Transfer Out</button>
                  </div>
                </div>
              )}

              {/* Credit Card View */}
              {activeTab === 'credit' && (
                <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300 min-h-[500px]">
                  <div className="flex items-start justify-between mb-8 border-b pb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Quicksilver Rewards</h2>
                      <p className="text-gray-500 text-sm">Card ending in ...9794</p>
                    </div>
                    <div className="w-24 h-16 bg-gradient-to-tr from-gray-200 to-gray-400 rounded-lg shadow-sm flex items-center justify-center relative overflow-hidden">
                       <span className="text-white font-bold italic text-xs z-10 drop-shadow-md">Quicksilver</span>
                       <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-full -mr-4 -mt-4 blur-sm"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <div className="text-sm text-gray-600 font-bold mb-1">Current Balance</div>
                      <div className="text-3xl font-bold text-gray-800">$450.20</div>
                      <p className="text-xs text-[#dd0031] font-bold mt-2">Payment Due: Aug 12, 2026</p>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 font-bold mb-1">Available Credit</div>
                      <div className="text-3xl font-bold text-emerald-600">$9,549.80</div>
                      <p className="text-xs text-gray-500 mt-2">Total Credit Line: $10,000</p>
                    </div>
                  </div>

                  <button className="w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded mb-8 transition shadow-sm focus:outline-none">
                    Make a Payment
                  </button>
                </div>
              )}

              {/* Loans View */}
              {activeTab === 'loans' && (
                <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300 min-h-[500px]">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">2024 Toyota Camry Auto Loan</h2>
                  <p className="text-gray-500 text-sm mb-8">Account ending in ...2284</p>
                  
                  <div className="bg-gray-50 rounded-xl p-6 mb-8 shadow-sm">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <div className="text-sm text-gray-600 font-bold uppercase mb-1">Remaining Principal</div>
                        <div className="text-[40px] font-bold text-gray-800 leading-none">$18,430.00</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#dd0031]">$410.00</div>
                        <div className="text-xs text-gray-500 font-bold">Due Aug 1, 2026</div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-2 shadow-inner">
                      <div className="bg-emerald-500 h-full" style={{ width: '35%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>$6,570 Paid</span>
                      <span>$25,000 Total Loan</span>
                    </div>
                  </div>

                  <button className="w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded transition shadow-sm focus:outline-none">
                    Pay Auto Loan
                  </button>
                </div>
              )}

              {/* Rewards View */}
              {activeTab === 'rewards' && (
                <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300 min-h-[500px]">
                  <div className="flex items-center justify-center flex-col py-10 border-b border-gray-100">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner">🏆</div>
                    <h2 className="text-2xl font-bold text-gray-800">Your Rewards Balance</h2>
                    <div className="text-[48px] font-extrabold text-[#0071ce] mt-2">45,200 <span className="text-xl text-gray-500">Miles</span></div>
                    <p className="text-sm text-emerald-600 font-bold mt-2">≈ $452.00 in Travel Value</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <button className="bg-gray-50 hover:bg-gray-100 hover:shadow-md p-6 rounded-xl flex flex-col items-center text-center transition focus:outline-none">
                      <span className="text-2xl mb-2">✈️</span>
                      <span className="font-bold text-gray-800">Book Travel</span>
                      <span className="text-xs text-gray-500 mt-1">Flights, hotels, & car rentals</span>
                    </button>
                    <button className="bg-gray-50 hover:bg-gray-100 hover:shadow-md p-6 rounded-xl flex flex-col items-center text-center transition focus:outline-none">
                      <span className="text-2xl mb-2">💵</span>
                      <span className="font-bold text-gray-800">Redeem for Cash</span>
                      <span className="text-xs text-gray-500 mt-1">Get a statement credit</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dedicated Recent Activity Tab View */}
              {activeTab === 'activity' && (
                <div className="bg-white rounded-xl shadow flex-1 flex flex-col min-h-[600px] animate-in fade-in duration-300">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Master Ledger</h3>
                      <p className="text-sm text-gray-500 mt-1">All historical transactions across your accounts</p>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search transactions..." 
                        className="border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 placeholder-gray-400 bg-white" 
                      />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col overflow-y-auto max-h-[600px]">
                    {renderTransactionList()}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN (Static Tools & Upgrades) */}
            <div className="lg:col-span-5 flex flex-col space-y-4 md:space-y-6">
              
              <div className="bg-white rounded-xl shadow flex flex-col">
                <div className="p-5 md:p-6 pb-4 border-b border-gray-50"><h3 className="text-lg font-bold text-gray-800">Upcoming Transactions</h3></div>
                {upcomingTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center px-4 md:px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${tx.color}`}>{tx.initial}</div>
                      <div>
                        <div className="font-bold text-sm text-gray-800">{tx.name}</div>
                        <div className="text-[11px] text-gray-500">{tx.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm text-gray-800">{tx.amount}</div>
                      <div className="text-[11px] text-gray-500">{tx.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* The Enhanced Interactive Banking Features */}
              <div className="bg-white rounded-xl shadow p-5 md:p-6 relative">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Banking Features</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <button onClick={() => setActiveModal('zelle')} className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-[#f1e6ff] rounded-lg transition group focus:outline-none">
                    <span className="text-[14px] font-bold text-[#7413dc] italic mb-1">Zelle<span className="text-[8px] align-top">®</span></span>
                    <span className="text-[11px] text-gray-600 font-medium group-hover:text-[#7413dc]">Send Money</span>
                  </button>
                  <button onClick={() => setActiveModal('transfer')} className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition group focus:outline-none">
                    <svg className="w-6 h-6 text-[#004879] group-hover:text-[#0071ce] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                    <span className="text-[11px] text-gray-600 font-medium group-hover:text-[#0071ce]">Wire / Transfer</span>
                  </button>
                  <button onClick={() => setActiveModal('lock')} className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-red-50 rounded-lg transition group focus:outline-none">
                    <svg className="w-6 h-6 text-[#004879] group-hover:text-red-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    <span className="text-[11px] text-gray-600 font-medium group-hover:text-red-500">Lock Cards</span>
                  </button>
                  <button onClick={() => setActiveModal('statement')} className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-emerald-50 rounded-lg transition group focus:outline-none">
                    <svg className="w-6 h-6 text-[#004879] group-hover:text-emerald-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span className="text-[11px] text-gray-600 font-medium group-hover:text-emerald-500">Statements</span>
                  </button>
                </div>
              </div>

              {/* Redesigned Spending Box */}
              <div className="bg-white rounded-xl shadow p-5 md:p-6 relative">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-4">Spending Summary</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex text-sm mb-2 justify-between">
                      <span className="font-bold text-gray-800">Total Inflow</span> 
                      <span className="font-bold text-emerald-600">+$3,995.47</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex text-sm mb-2 justify-between">
                      <span className="font-bold text-gray-800">Total Outflow</span> 
                      <span className="font-bold text-[#dd0031]">-$3,722.68</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden shadow-inner">
                      <div className="bg-[#dd0031] h-full rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>

      {/* --------------------------------------------------------------------------------
          MODALS ENGINE
          -------------------------------------------------------------------------------- */}

      {/* 1. TRANSFER MODAL */}
      {activeModal === 'transfer' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-[#004879] mb-6">Move Money</h2>
            <label className="block text-sm font-bold text-gray-700 mb-2">Direction</label>
            
            <select 
              className="w-full border border-gray-300 rounded px-3 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white"
              value={transferDirection} onChange={(e) => setTransferDirection(e.target.value)}
            >
              <option value="c2s">360 Checking  →  360 Savings</option>
              <option value="s2c">360 Savings  →  360 Checking</option>
            </select>
            
            <label className="block text-sm font-bold text-gray-700 mb-2">Amount</label>
            <div className="relative mb-8">
              <span className="absolute left-4 top-3 text-gray-700 font-bold">$</span>
              <input 
                type="number" 
                className="w-full border border-gray-300 rounded pl-8 pr-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 placeholder-gray-400 bg-white"
                placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button onClick={() => setActiveModal('none')} className="text-gray-500 font-bold hover:text-gray-800 focus:outline-none">Cancel</button>
              <button onClick={executeTransfer} disabled={isTransferring} className="bg-[#0071ce] hover:bg-[#005a8f] text-white px-6 py-2 rounded font-bold transition disabled:opacity-50 focus:outline-none">
                {isTransferring ? 'Processing...' : 'Transfer Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ZELLE MODAL */}
      {activeModal === 'zelle' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200 border-t-8 border-[#7413dc]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-extrabold text-[#7413dc] italic tracking-tighter">Zelle<span className="text-sm align-top">®</span></h2>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-6">Send money to friends, family, and others you trust, right from your app.</p>
            
            <input 
              type="text" 
              placeholder="Recipient Email or U.S. Mobile Number" 
              className="w-full border border-gray-300 rounded px-4 py-3 mb-4 focus:outline-none focus:border-[#7413dc] text-gray-900 placeholder-gray-400 bg-white" 
            />
            
            <div className="relative mb-8">
              <span className="absolute left-4 top-3 text-gray-700 font-bold">$</span>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full border border-gray-300 rounded pl-8 pr-4 py-3 font-mono focus:outline-none focus:border-[#7413dc] text-gray-900 placeholder-gray-400 bg-white" 
              />
            </div>
            
            <button onClick={() => { alert('Simulation: Zelle transfer initiated!'); setActiveModal('none'); }} className="w-full bg-[#7413dc] hover:bg-[#5b0ea8] text-white font-bold py-3 rounded transition shadow-md focus:outline-none">
              Review & Send
            </button>
          </div>
        </div>
      )}

      {/* 3. LOCK CARD MODAL */}
      {activeModal === 'lock' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Manage Card Security</h2>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-8">Misplaced your card? Lock it instantly to prevent unauthorized transactions.</p>
            
            <div className="flex justify-between items-center p-4 rounded-lg mb-4 bg-gray-50">
              <div>
                <div className="font-bold text-gray-800">360 Debit Card</div>
                <div className="text-xs text-gray-500">Ending in ...0096</div>
              </div>
              <button 
                onClick={() => setIsDebitLocked(!isDebitLocked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDebitLocked ? 'bg-red-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDebitLocked ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex justify-between items-center p-4 rounded-lg mb-8 bg-gray-50">
              <div>
                <div className="font-bold text-gray-800">Quicksilver Credit Card</div>
                <div className="text-xs text-gray-500">Ending in ...9794</div>
              </div>
              <button 
                onClick={() => setIsCreditLocked(!isCreditLocked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isCreditLocked ? 'bg-red-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCreditLocked ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <button onClick={() => setActiveModal('none')} className="w-full bg-[#004879] hover:bg-[#003456] text-white font-bold py-3 rounded transition shadow-sm focus:outline-none">
              Save Security Settings
            </button>
          </div>
        </div>
      )}

      {/* 4. STATEMENT / PDF MODAL */}
      {activeModal === 'statement' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:w-full print:p-8 animate-in slide-in-from-bottom-8">
            
            <div className="flex justify-between items-end border-b-2 border-[#004879] pb-6 mb-6">
              <Image src="/capitalone-com-wordmark.png" alt="Logo" width={180} height={60} className="object-contain" priority />
              <div className="text-right">
                <h1 className="text-2xl font-black text-gray-800 uppercase tracking-widest">Account Statement</h1>
                <p className="text-gray-500 font-mono mt-1">Generated: {new Date().toLocaleDateString()}</p>
                <p className="text-gray-500 font-mono text-sm">Account: 360 Checking (...0096)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 border-b border-gray-200 pb-8">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Account Holder</h3>
                <p className="text-lg font-bold text-gray-800">John Doe</p>
                <p className="text-gray-600">123 Financial Way</p>
                <p className="text-gray-600">Richmond, VA 23218</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Statement Balance</h3>
                <div className="text-3xl font-black text-[#004879]">
                  ${Number(checkingBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-4">Transaction Ledger</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-2 text-sm font-bold text-gray-600">Date</th>
                  <th className="py-2 text-sm font-bold text-gray-600">Description</th>
                  <th className="py-2 text-sm font-bold text-gray-600 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-600 font-mono">{formatDate(tx.created_at)}</td>
                    <td className="py-3 text-sm font-bold text-gray-800 capitalize">{tx.type} <span className="text-xs font-normal text-gray-400 block">{tx.status}</span></td>
                    <td className="py-3 text-sm font-bold text-right font-mono text-gray-800">
                      {tx.type === 'withdrawal' || Number(tx.amount) < 0 ? '-' : '+'}${Math.abs(Number(tx.amount)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-10 flex justify-end space-x-4 print:hidden">
              <button onClick={() => setActiveModal('none')} className="text-gray-500 font-bold hover:text-black focus:outline-none">Close window</button>
              <button 
                onClick={() => window.print()} 
                className="bg-[#0071ce] hover:bg-[#005a8f] text-white px-6 py-2 rounded font-bold shadow-md flex items-center focus:outline-none"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
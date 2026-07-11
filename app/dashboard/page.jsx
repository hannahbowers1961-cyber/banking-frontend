"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function ClientDashboard() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  const [activeTab, setActiveTab] = useState('checking'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState('none'); 
  const [selectedTx, setSelectedTx] = useState(null); 
  
  const [scoreAnim, setScoreAnim] = useState(0); 
  const [displayedScore, setDisplayedScore] = useState(0);

  const [transferAmount, setTransferAmount] = useState('');
  const [transferDirection, setTransferDirection] = useState('c2s');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isDebitLocked, setIsDebitLocked] = useState(false);
  const [isCreditLocked, setIsCreditLocked] = useState(false);
  
  // External Transfer & Debt States
  const [receiverId, setReceiverId] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [targetDebt, setTargetDebt] = useState(null); 

  // Core User & Ledger States
  const [userId, setUserId] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [accountNumber, setAccountNumber] = useState('----');
  const [savingsAccountNumber, setSavingsAccountNumber] = useState('----');
  const [isLoading, setIsLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState('active'); 
  const [legalName, setLegalName] = useState('Account Holder'); 
  const [checkingBalance, setCheckingBalance] = useState("0.00");
  const [savingsBalance, setSavingsBalance] = useState("0.00");
  
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMoreTxs, setHasMoreTxs] = useState(true);
  const TX_LIMIT = 15;

  // Dynamic Products States (Empty by default)
  const [creditAccounts, setCreditAccounts] = useState([]);
  const [loanAccounts, setLoanAccounts] = useState([]);
  const [upcomingTxs, setUpcomingTxs] = useState([]);
  
  // MOVE IT HERE: Declare the state before using it!
  const [rewardsBalance, setRewardsBalance] = useState(0); 

  // --- Dynamic Math ---
  const totalOutflow = transactions.filter(tx => tx.sender_account_id === accountId || tx.type === 'withdrawal').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalInflow = transactions.filter(tx => tx.receiver_account_id === accountId || tx.type === 'deposit').reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  const rewardMiles = rewardsBalance; 
  const rewardValue = rewardMiles * 0.01; 

  // --- Dynamic Sidebar Navigation ---
  const navItems = [
    { id: "checking", name: `Checking... ${accountNumber}`, icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> },
    { id: "savings", name: `Savings... ${savingsAccountNumber}`, icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
    { id: "credit", name: `Credit Cards... ${creditAccounts[0]?.card_number?.slice(-4) || '----'}`, icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> },
    { id: "loans", name: `Loans... ${loanAccounts[0]?.account_number?.slice(-4) || '----'}`, icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg> },
    { id: "rewards", name: "Rewards & Deals", icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> },
    { id: "activity", name: "Recent Activity", icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> },
  ];

  const fetchUserData = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { router.push('/'); return; }
    setUserId(user.id);

    const { data: profile } = await supabase.from('profiles').select('account_status, legal_name').eq('id', user.id).single();
    if (profile) {
      setAccountStatus(profile.account_status);
      if (profile.legal_name) setLegalName(profile.legal_name);
    }

    const { data: account } = await supabase.from('accounts').select('account_id, account_number, balance, savings_balance, rewards_balance').eq('user_id', user.id).single();
    if (account) {
      setAccountId(account.account_id);
      setAccountNumber(account.account_number ? account.account_number.slice(-4) : '----');
      setSavingsAccountNumber(account.account_number ? account.account_number.slice(-4) : '----'); 
      setCheckingBalance(account.balance);
      setSavingsBalance(account.savings_balance || "0.00");
      setRewardsBalance(parseFloat(account.rewards_balance || 0));
      fetchTransactions(account.account_id, 0, true);
    }

    const [creditRes, loanRes, scheduledRes] = await Promise.all([
      supabase.from('credit_accounts').select('*').eq('user_id', user.id),
      supabase.from('loan_accounts').select('*').eq('user_id', user.id),
      supabase.from('scheduled_transactions').select('*').eq('user_id', user.id).order('next_date', { ascending: true })
    ]);
    
    if (creditRes.data) setCreditAccounts(creditRes.data);
    if (loanRes.data) setLoanAccounts(loanRes.data);
    if (scheduledRes.data) setUpcomingTxs(scheduledRes.data);

    setIsLoading(false);
  };

  const fetchTransactions = async (accId, pageNum, isReset = false) => {
    const from = pageNum * TX_LIMIT;
    const to = from + TX_LIMIT - 1;
    
    const { data: txs, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`sender_account_id.eq.${accId},receiver_account_id.eq.${accId}`)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && txs) {
        if (txs.length < TX_LIMIT) setHasMoreTxs(false);
        if (isReset) setTransactions(txs);
        else setTransactions(prev => [...prev, ...txs]);
    }
  };

  const loadMoreTransactions = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(accountId, nextPage);
  };

  useEffect(() => {
    fetchUserData();
    const timer = setTimeout(() => setScoreAnim(85), 300);
    let current = 0; const target = 790; const step = Math.ceil(target / 60); 
    const counter = setInterval(() => {
      current += step;
      if (current >= target) { setDisplayedScore(target); clearInterval(counter); } 
      else { setDisplayedScore(current); }
    }, 16);
    return () => { clearTimeout(timer); clearInterval(counter); };
  }, [router]);

  useEffect(() => {
    if (!accountId) return;
    const channel = supabase.channel('realtime-banking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `account_id=eq.${accountId}` }, (payload) => {
          if (payload.new) {
              setCheckingBalance(payload.new.balance);
              setSavingsBalance(payload.new.savings_balance);
          }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
          if (payload.new.sender_account_id === accountId || payload.new.receiver_account_id === accountId) {
              setTransactions(prev => [payload.new, ...prev]);
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [accountId]);

  const handleSecureAction = (actionName) => {
    setErrorMsg(''); setReceiverId(''); setTransferAmount(''); setDescription('');
    if (accountStatus === 'restricted' && !['lock', 'statement'].includes(actionName)) {
      setActiveModal('restricted');
      return;
    }
    setActiveModal(actionName);
  };

  const handlePayDebtModal = (type, item) => {
    setTargetDebt({
      type,
      id: item.id,
      name: type === 'credit' ? item.card_name : item.loan_name,
      balance: type === 'credit' ? item.balance : item.current_balance
    });
    setErrorMsg(''); setTransferAmount('');
    setActiveModal('pay_debt');
  };

  const executeDebtPayment = async (e) => {
    e.preventDefault();
    if (!transferAmount || transferAmount <= 0) return;
    setIsTransferring(true); setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/api/client/pay-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sourceAccountId: accountId,
          debtId: targetDebt.id,
          debtType: targetDebt.type,
          amount: parseFloat(transferAmount)
        }),
      });

      const result = await response.json();
      if (!response.ok) setErrorMsg(result.error || 'Payment failed');
      else {
        setActiveModal('none');
        setTransferAmount('');
        fetchUserData(); 
      }
    } catch (err) { setErrorMsg('Network error. Please try again later.'); }
    finally { setIsTransferring(false); }
  };

  const executeInternalTransfer = async () => {
    if (!transferAmount || transferAmount <= 0) return;
    setIsTransferring(true);
    
    await fetch(`${API_URL}/api/client/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount: transferAmount, direction: transferDirection }),
    });

    await fetchUserData(); 
    setActiveModal('none'); setTransferAmount(''); setIsTransferring(false);
  };

  const handleExternalTransfer = async (e, type) => {
    e.preventDefault();
    if (!transferAmount || transferAmount <= 0 || !receiverId) return;
    setIsTransferring(true); setErrorMsg('');

    try {
      const endpoint = type === 'wire' ? '/api/client/wire' : '/api/client/zelle';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderUserId: userId, receiverAccountId: receiverId, amount: parseFloat(transferAmount), description }),
      });
      const result = await response.json();
      if (!response.ok) setErrorMsg(result.error || 'Transfer failed');
      else {
        setActiveModal('none');
        setReceiverId(''); setTransferAmount(''); setDescription('');
      }
    } catch (err) { setErrorMsg('Network error. Please try again later.'); } 
    finally { setIsTransferring(false); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const renderTransactionList = (limit = null) => {
    if (transactions.length === 0) return <div className="p-8 text-center text-gray-400 font-bold">No recent transactions.</div>;
    const displayTxs = limit ? transactions.slice(0, limit) : transactions;
    
    return displayTxs.map((tx) => {
      const rawAmount = Number(tx.amount);
      const isActuallyWithdrawal = tx.sender_account_id === accountId;
      const isTransfer = tx.type === 'transfer';
      const absAmount = Math.abs(rawAmount).toFixed(2);
      
      let txPrefix = '+'; let txColor = 'bg-emerald-500'; let textColor = 'text-emerald-600'; let iconChar = '+';
      if (isActuallyWithdrawal) { txPrefix = '-'; txColor = 'bg-[#dd0031]'; textColor = 'text-[#dd0031]'; iconChar = '-'; } 
      else if (isTransfer) { txPrefix = '-'; txColor = 'bg-[#0071ce]'; textColor = 'text-[#0071ce]'; iconChar = '⇄'; }

      const txDescription = tx.description || (tx.type === 'deposit' ? 'Online Deposit' : tx.type === 'transfer' ? 'Account Transfer' : 'Card Purchase');
      const accountName = tx.type === 'transfer' ? 'Multiple Accounts' : `360 Checking (...${accountNumber})`;

      return (
        <div 
          key={tx.id} 
          onClick={() => { 
            setSelectedTx({ 
              ...tx, txPrefix, txColor, textColor, absAmount, description: txDescription, account: accountName, 
              formattedDate: formatDate(tx.created_at), formattedTime: formatTime(tx.created_at) 
            }); 
            setActiveModal('tx_details'); 
          }}
          className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b last:border-b-0 border-gray-50 hover:bg-gray-50 transition cursor-pointer group"
        >
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full ${txColor} text-white flex items-center justify-center font-bold text-xl shadow-sm group-hover:scale-105 transition-transform`}>{iconChar}</div>
            <div>
              <div className="font-bold text-base text-gray-800 capitalize">{txDescription}</div>
              <div className="text-xs text-gray-500 capitalize">{tx.status}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-semibold text-base ${textColor}`}>{txPrefix}{absAmount}</div>
            <div className="text-xs text-gray-500">{formatDate(tx.created_at)}</div>
          </div>
        </div>
      );
    });
  };

  if (isLoading) return <div className="min-h-screen bg-[#e8eef3] flex items-center justify-center font-bold text-[#004879]">Securely loading your accounts...</div>;

  return (
    <>
      <div className="min-h-screen bg-[#e8eef3] font-sans md:pb-10 print:hidden text-gray-800 flex flex-col">
        
        <header className="sticky top-0 z-[100] w-full bg-white shadow-md border-b border-gray-200">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
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
              <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="text-xs font-bold text-gray-500 hover:text-red-600 hidden md:block focus:outline-none">Sign Out</button>
              <div className="w-9 h-9 rounded-full bg-[#004879] text-white flex items-center justify-center font-bold text-sm uppercase">
                {legalName.substring(0, 2)}
              </div>
            </div>
          </div>
          
          {isMobileMenuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full bg-[#00426b] shadow-2xl border-t border-[#003456] z-[100] rounded-b-xl overflow-hidden">
              <nav className="flex flex-col py-2">
                {navItems.map((item) => (
                  <div 
                    key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`flex items-center px-6 py-4 cursor-pointer transition-colors ${activeTab === item.id ? 'bg-[#005a8f] border-l-4 border-blue-300' : 'text-gray-300 hover:bg-[#004f80] border-l-4 border-transparent'}`}
                  >
                    {item.icon} <span className={`text-sm ${activeTab === item.id ? 'font-bold text-white' : 'font-medium'}`}>{item.name}</span>
                  </div>
                ))}
              </nav>
            </div>
          )}
        </header>

        <div className="max-w-[1400px] w-full mx-auto bg-[#00426b] md:rounded-b-xl flex flex-col md:flex-row shadow-2xl relative z-10 flex-1">
          
          <aside className="hidden md:flex w-64 flex-shrink-0 flex-col py-6">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <div 
                  key={item.id} onClick={() => setActiveTab(item.id)} 
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
              </div>
            </div>
          </aside>

          <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 bg-[#00426b]">
            
            <div className="lg:col-span-7 flex flex-col space-y-4 md:space-y-6">
              {activeTab === 'checking' && (
                <>
                  <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">360 Checking (...{accountNumber})</h2>
                    <div className="text-[40px] font-bold text-[#004879] leading-none mb-6">
                      ${Number(checkingBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="border-t border-gray-100 pt-5 mb-6">
                      <h2 className="text-xl font-bold text-gray-800 mb-1">360 Savings (...{savingsAccountNumber})</h2>
                      <div className="text-2xl font-bold text-[#004879] leading-none">
                        ${Number(savingsBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button onClick={() => handleSecureAction('transfer')} className="w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded text-sm transition shadow-sm focus:outline-none">
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

              {activeTab === 'savings' && (
                <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300 min-h-[500px]">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">360 Performance Savings</h2>
                  <p className="text-gray-500 text-sm mb-6">Account ending in ...{savingsAccountNumber}</p>
                  <div className="bg-[#e8eef3] rounded-lg p-6 mb-8 flex justify-between items-center border border-blue-100">
                    <div>
                      <div className="text-sm text-gray-600 font-bold uppercase tracking-wider mb-1">Available Balance</div>
                      <div className="text-[48px] font-bold text-[#004879] leading-none">
                        ${Number(savingsBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button onClick={() => handleSecureAction('transfer')} className="bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded transition shadow-sm focus:outline-none">Add Money</button>
                    <button onClick={() => handleSecureAction('transfer')} className="bg-blue-50 text-[#0071ce] hover:bg-blue-100 font-bold py-3 rounded transition shadow-sm focus:outline-none">Transfer Out</button>
                  </div>
                </div>
              )}

              {activeTab === 'credit' && (
                <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300 min-h-[500px]">
                  {creditAccounts.length > 0 ? creditAccounts.map(credit => (
                    <div key={credit.id} className="mb-10 border-b pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">{credit.card_name}</h2>
                          <p className="text-gray-500 text-sm">Card ending in ...{credit.card_number.slice(-4)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                          <div className="text-sm text-gray-600 font-bold mb-1">Current Balance</div>
                          <div className="text-3xl font-bold text-gray-800">${parseFloat(credit.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 font-bold mb-1">Available Credit</div>
                          <div className="text-3xl font-bold text-emerald-600">${(parseFloat(credit.credit_limit) - parseFloat(credit.balance)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                      <button onClick={() => handlePayDebtModal('credit', credit)} className="w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded mb-8 transition shadow-sm focus:outline-none">
                        Make a Payment
                      </button>
                    </div>
                  )) : (
                     <div className="text-center py-20 text-gray-400 font-bold">No Credit Accounts Found.</div>
                  )}
                </div>
              )}

              {activeTab === 'loans' && (
                <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300 min-h-[500px]">
                  {loanAccounts.length > 0 ? loanAccounts.map(loan => {
                    const paidPct = ((loan.original_principal - loan.current_balance) / loan.original_principal) * 100;
                    return (
                      <div key={loan.id} className="mb-10 border-b pb-6 last:border-b-0">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">{loan.loan_name}</h2>
                        <p className="text-gray-500 text-sm mb-8">Account ending in ...{loan.account_number.slice(-4)}</p>
                        <div className="bg-gray-50 rounded-xl p-6 mb-8 shadow-sm">
                          <div className="flex justify-between items-end mb-4">
                            <div>
                              <div className="text-sm text-gray-600 font-bold uppercase mb-1">Remaining Principal</div>
                              <div className="text-[40px] font-bold text-gray-800 leading-none">${parseFloat(loan.current_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-[#dd0031]">${parseFloat(loan.monthly_payment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              <div className="text-xs text-gray-500 font-bold">Due {formatDate(loan.next_payment_date)}</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-2 shadow-inner">
                            <div className="bg-emerald-500 h-full" style={{ width: `${paidPct}%` }}></div>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-gray-500">
                            <span>${(loan.original_principal - loan.current_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Paid</span>
                            <span>${parseFloat(loan.original_principal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total Loan</span>
                          </div>
                        </div>
                        <button onClick={() => handlePayDebtModal('loan', loan)} className="w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded transition shadow-sm focus:outline-none">
                          Pay Auto Loan
                        </button>
                      </div>
                    )
                  }) : (
                     <div className="text-center py-20 text-gray-400 font-bold">No Active Loans.</div>
                  )}
                </div>
              )}

              {activeTab === 'rewards' && (
                <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300 min-h-[500px]">
                  <div className="flex items-center justify-center flex-col py-10 border-b border-gray-100">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner">🏆</div>
                    <h2 className="text-2xl font-bold text-gray-800">Your Rewards Balance</h2>
                    <div className="text-[48px] font-extrabold text-[#0071ce] mt-2">
                      {rewardMiles.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl text-gray-500">Miles</span>
                    </div>
                    <p className="text-sm text-emerald-600 font-bold mt-2">
                      ≈ ${rewardValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in Travel Value
                    </p>
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

              {activeTab === 'activity' && (
                <div className="bg-white rounded-xl shadow flex-1 flex flex-col min-h-[600px] animate-in fade-in duration-300">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Master Ledger</h3>
                      <p className="text-sm text-gray-500 mt-1">Click any transaction to view details</p>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col overflow-y-auto max-h-[600px] pb-4">
                    {renderTransactionList()}
                    {hasMoreTxs && transactions.length > 0 && (
                        <button onClick={loadMoreTransactions} className="mt-4 mx-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded text-sm transition">
                            Load Older Transactions
                        </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 flex flex-col space-y-4 md:space-y-6">
              
              <div className="bg-white rounded-xl shadow p-5 md:p-6 relative">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Banking Features</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <button onClick={() => handleSecureAction('zelle')} className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-[#f1e6ff] rounded-lg transition group focus:outline-none">
                    <span className="text-[14px] font-bold text-[#7413dc] italic mb-1">Zelle<span className="text-[8px] align-top">®</span></span>
                    <span className="text-[11px] text-gray-600 font-medium group-hover:text-[#7413dc]">Send Money</span>
                  </button>
                  <button onClick={() => handleSecureAction('wire')} className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition group focus:outline-none">
                    <svg className="w-6 h-6 text-[#004879] group-hover:text-[#0071ce] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                    <span className="text-[11px] text-gray-600 font-medium group-hover:text-[#0071ce]">Wire Transfer</span>
                  </button>
                  <button onClick={() => handleSecureAction('lock')} className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-red-50 rounded-lg transition group focus:outline-none">
                    <svg className="w-6 h-6 text-[#004879] group-hover:text-red-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    <span className="text-[11px] text-gray-600 font-medium group-hover:text-red-500">Lock Cards</span>
                  </button>
                  <button onClick={() => handleSecureAction('statement')} className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-emerald-50 rounded-lg transition group focus:outline-none">
                    <svg className="w-6 h-6 text-[#004879] group-hover:text-emerald-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span className="text-[11px] text-gray-600 font-medium group-hover:text-emerald-500">Statements</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow flex flex-col">
                <div className="p-5 md:p-6 pb-4 border-b border-gray-50"><h3 className="text-lg font-bold text-gray-800">Upcoming Transactions</h3></div>
                {upcomingTxs.length === 0 && <div className="p-6 text-center text-gray-400 font-bold text-sm">No scheduled payments.</div>}
                {upcomingTxs.map((tx) => (
                  <div 
                    key={tx.id} 
                    onClick={() => {
                      setSelectedTx({
                        id: tx.id,
                        txPrefix: '-',
                        txColor: tx.color || 'bg-slate-500',
                        textColor: 'text-gray-800',
                        absAmount: Math.abs(Number(tx.amount)).toFixed(2),
                        description: tx.name,
                        type: 'Scheduled Payment',
                        account: `360 Checking (...${accountNumber})`,
                        formattedDate: tx.date || formatDate(tx.next_date),
                        status: 'Pending'
                      });
                      setActiveModal('tx_details');
                    }}
                    className="flex justify-between items-center px-4 md:px-6 py-4 border-b last:border-b-0 border-gray-50 hover:bg-gray-50 transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform ${tx.color || 'bg-slate-500'}`}>{tx.initial || tx.name[0]}</div>
                      <div>
                        <div className="font-bold text-sm text-gray-800">{tx.name}</div>
                        <div className="text-[11px] text-gray-500">{tx.category || 'General'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm text-gray-800">-${Math.abs(Number(tx.amount)).toFixed(2)}</div>
                      <div className="text-[11px] text-gray-500">{tx.date || formatDate(tx.next_date)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div 
                onClick={() => setActiveModal('spending_details')}
                className="bg-white rounded-xl shadow p-5 md:p-6 relative cursor-pointer hover:shadow-md transition group border border-transparent hover:border-[#0071ce]"
              >
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#0071ce] transition">Spending Summary</h3>
                  <span className="text-[#0071ce] font-bold text-sm opacity-0 group-hover:opacity-100 transition">View Details &rarr;</span>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex text-sm mb-2 justify-between">
                      <span className="font-bold text-gray-800">Total Inflow</span> 
                      <span className="font-bold text-emerald-600">+${totalInflow.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalInflow === 0 ? 0 : (totalInflow / (totalInflow+totalOutflow)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex text-sm mb-2 justify-between">
                      <span className="font-bold text-gray-800">Total Outflow</span> 
                      <span className="font-bold text-[#dd0031]">-${totalOutflow.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden shadow-inner">
                      <div className="bg-[#dd0031] h-full rounded-full" style={{ width: `${totalOutflow === 0 ? 0 : (totalOutflow / (totalInflow+totalOutflow)) * 100}%` }}></div>
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

      {/* PAY DEBT MODAL (NEW) */}
      {activeModal === 'pay_debt' && targetDebt && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200 border-t-8 border-[#0071ce]">
            <form onSubmit={executeDebtPayment}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Make a Payment</h2>
                <button type="button" onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none">✕</button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Paying Towards</div>
                <div className="font-bold text-gray-800">{targetDebt.name}</div>
                <div className="text-sm text-gray-600 mt-1">Current Balance: <span className="font-bold text-[#dd0031]">${parseFloat(targetDebt.balance).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
              </div>

              {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 font-bold text-sm border border-red-200">{errorMsg}</div>}

              <label className="block text-sm font-bold text-gray-700 mb-2">Pay From</label>
              <select className="w-full border border-gray-300 rounded px-3 py-3 mb-6 text-gray-900 bg-white" required>
                <option value="checking">360 Checking (...{accountNumber}) - ${parseFloat(checkingBalance).toFixed(2)}</option>
              </select>

              <label className="block text-sm font-bold text-gray-700 mb-2">Payment Amount</label>
              <div className="relative mb-8">
                <span className="absolute left-4 top-3 text-gray-700 font-bold">$</span>
                <input type="number" step="0.01" required className="w-full border border-gray-300 rounded pl-8 pr-4 py-3 font-mono text-gray-900 bg-white" placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setActiveModal('none')} className="text-gray-500 font-bold disabled:opacity-50" disabled={isTransferring}>Cancel</button>
                <button type="submit" disabled={isTransferring} className="bg-[#0071ce] hover:bg-[#005a8f] text-white px-6 py-2 rounded font-bold transition disabled:opacity-50">
                  {isTransferring ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTRICTED ACCOUNT MODAL */}
      {activeModal === 'restricted' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200 border-t-8 border-[#dd0031] text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#dd0031]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Temporarily Restricted</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              For your safety, access to money movement features has been suspended on this account. Please visit a branch in person with a valid government-issued ID to restore access.
            </p>
            <button onClick={() => setActiveModal('none')} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-full transition shadow-sm focus:outline-none">
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}

      {/* TRANSACTION DETAILS MODAL */}
      {activeModal === 'tx_details' && selectedTx && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Transaction Details</h2>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none">✕</button>
            </div>
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-white shadow-sm ${selectedTx.txColor}`}>
                {selectedTx.txPrefix === '+' ? '+' : '-'}
              </div>
              <div className={`text-4xl font-black ${selectedTx.textColor}`}>
                {selectedTx.txPrefix}${selectedTx.absAmount}
              </div>
              <div className="text-gray-500 font-medium capitalize mt-1">{selectedTx.status}</div>
            </div>
            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex justify-between"><span className="text-gray-500 text-sm">Description</span><span className="font-bold text-gray-800 text-right">{selectedTx.description}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 text-sm">Type</span><span className="font-bold text-gray-800 capitalize text-right">{selectedTx.type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 text-sm">Account</span><span className="font-bold text-gray-800 text-right">{selectedTx.account}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 text-sm">Date</span><span className="font-bold text-gray-800 text-right">{selectedTx.formattedDate}</span></div>
              
              {selectedTx.formattedTime && (
                <div className="flex justify-between"><span className="text-gray-500 text-sm">Time</span><span className="font-bold text-gray-800 text-right">{selectedTx.formattedTime}</span></div>
              )}
              {selectedTx.id && !selectedTx.id.toString().startsWith('up-') && (
                <div className="flex justify-between"><span className="text-gray-500 text-sm">Reference ID</span><span className="font-mono text-xs text-gray-800 mt-1 text-right">{selectedTx.reference_id || selectedTx.id.split('-')[0].toUpperCase()}</span></div>
              )}
            </div>
            <button onClick={() => setActiveModal('none')} className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded transition focus:outline-none">Close Details</button>
          </div>
        </div>
      )}

      {/* SPENDING DETAILS MODAL */}
      {activeModal === 'spending_details' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 md:p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Cash Flow Insights</h2>
                <p className="text-sm text-gray-500 mt-1">Dynamic Breakdown</p>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center">
                <div className="w-12 h-12 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">↓</div>
                <div className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Money In</div>
                <div className="text-3xl font-black text-emerald-600 mt-1">+${totalInflow.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
              </div>
              <div className="bg-red-50 border border-red-100 p-6 rounded-xl text-center">
                <div className="w-12 h-12 bg-red-200 text-red-700 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">↑</div>
                <div className="text-sm font-bold text-red-700 uppercase tracking-wider">Money Out</div>
                <div className="text-3xl font-black text-[#dd0031] mt-1">-${totalOutflow.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Top Spending Categories</h3>
            <div className="space-y-4">
              {['Food', 'Bills', 'Shopping', 'Transfer', 'General'].map(cat => {
                 const amount = transactions.filter(tx => tx.sender_account_id === accountId && tx.category === cat).reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
                 if (amount === 0) return null;
                 const pct = totalOutflow > 0 ? (amount / totalOutflow) * 100 : 0;
                 return (
                  <div key={cat} className="mb-3">
                    <div className="flex justify-between text-sm mb-1"><span className="font-bold text-gray-700">{cat}</span><span className="font-bold text-gray-800">${amount.toFixed(2)}</span></div>
                    <div className="w-full bg-gray-100 h-2 rounded-full"><div className="bg-[#0071ce] h-full rounded-full" style={{ width: `${pct}%` }}></div></div>
                  </div>
                 )
              })}
              {totalOutflow === 0 && <p className="text-gray-500 text-sm">No spending data available yet.</p>}
            </div>

            <button onClick={() => setActiveModal('none')} className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded transition focus:outline-none">
              Close Insights
            </button>
          </div>
        </div>
      )}

      {/* WIRE TRANSFER DASHBOARD */}
      {activeModal === 'wire' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 md:p-8 animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <form onSubmit={(e) => handleExternalTransfer(e, 'wire')}>
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#004879]">Wire Transfer</h2>
                  <p className="text-sm text-gray-500 mt-1">Secure International & Domestic Routing</p>
                </div>
                <button type="button" onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none">✕</button>
              </div>

              {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded mb-6 font-bold text-sm border border-red-200">{errorMsg}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recipient Name / Business</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recipient Bank Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white" placeholder="Standard Chartered Bank" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number / UUID</label>
                  <input type="text" required value={receiverId} onChange={(e) => setReceiverId(e.target.value)} className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white font-mono" placeholder="Enter recipient UUID" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Routing Number / SWIFT</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white font-mono" placeholder="BOFAUS3N" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wire Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-700 font-bold text-xl">$</span>
                  <input type="number" step="0.01" required value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full border border-gray-300 rounded pl-10 pr-4 py-3 font-mono text-xl focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white" placeholder="0.00" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setActiveModal('none')} className="text-gray-500 font-bold hover:text-gray-800 focus:outline-none disabled:opacity-50" disabled={isTransferring}>Cancel</button>
                <button type="submit" disabled={isTransferring} className="bg-[#0071ce] hover:bg-[#005a8f] text-white px-8 py-3 rounded font-bold transition shadow-md focus:outline-none disabled:opacity-50">
                  {isTransferring ? 'Processing...' : 'Authorize Wire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERNAL TRANSFER MODAL */}
      {activeModal === 'transfer' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-[#004879] mb-6">Internal Transfer</h2>
            <label className="block text-sm font-bold text-gray-700 mb-2">Direction</label>
            <select className="w-full border border-gray-300 rounded px-3 py-3 mb-6 text-gray-900 bg-white" value={transferDirection} onChange={(e) => setTransferDirection(e.target.value)}>
              <option value="c2s">360 Checking (...{accountNumber})  →  360 Savings (...{savingsAccountNumber})</option>
              <option value="s2c">360 Savings (...{savingsAccountNumber})  →  360 Checking (...{accountNumber})</option>
            </select>
            <label className="block text-sm font-bold text-gray-700 mb-2">Amount</label>
            <div className="relative mb-8">
              <span className="absolute left-4 top-3 text-gray-700 font-bold">$</span>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded pl-8 pr-4 py-3 font-mono text-gray-900 bg-white" placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
            </div>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setActiveModal('none')} className="text-gray-500 font-bold disabled:opacity-50" disabled={isTransferring}>Cancel</button>
              <button onClick={executeInternalTransfer} disabled={isTransferring} className="bg-[#0071ce] hover:bg-[#005a8f] text-white px-6 py-2 rounded font-bold transition disabled:opacity-50">
                {isTransferring ? 'Processing...' : 'Transfer Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZELLE MODAL */}
      {activeModal === 'zelle' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200 border-t-8 border-[#7413dc]">
            <form onSubmit={(e) => handleExternalTransfer(e, 'zelle')}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-[#7413dc] italic tracking-tighter">Zelle<span className="text-sm align-top">®</span></h2>
                <button type="button" onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none">✕</button>
              </div>
              <p className="text-sm text-gray-600 mb-6">Send money to friends, family, and others you trust, right from your app.</p>
              
              {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 font-bold text-sm border border-red-200">{errorMsg}</div>}

              <input type="text" required value={receiverId} onChange={(e) => setReceiverId(e.target.value)} placeholder="Recipient Account UUID" className="w-full border border-gray-300 rounded px-4 py-3 mb-4 focus:outline-none focus:border-[#7413dc] text-gray-900 placeholder-gray-400 bg-white" />
              <div className="relative mb-4">
                <span className="absolute left-4 top-3 text-gray-700 font-bold">$</span>
                <input type="number" step="0.01" required value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="0.00" className="w-full border border-gray-300 rounded pl-8 pr-4 py-3 font-mono focus:outline-none focus:border-[#7413dc] text-gray-900 placeholder-gray-400 bg-white" />
              </div>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this for? (Optional)" className="w-full border border-gray-300 rounded px-4 py-3 mb-8 focus:outline-none focus:border-[#7413dc] text-gray-900 placeholder-gray-400 bg-white text-sm" />

              <button type="submit" disabled={isTransferring} className="w-full bg-[#7413dc] hover:bg-[#5b0ea8] text-white font-bold py-3 rounded transition shadow-md focus:outline-none disabled:opacity-50">
                {isTransferring ? 'Processing...' : 'Review & Send'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOCK CARD MODAL */}
      {activeModal === 'lock' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Manage Card Security</h2>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-8">Misplaced your card? Lock it instantly to prevent unauthorized transactions.</p>
            <div className="flex justify-between items-center p-4 rounded-lg mb-4 bg-gray-50">
              <div>
                <div className="font-bold text-gray-800">360 Debit Card</div>
                <div className="text-xs text-gray-500">Ending in ...{accountNumber}</div>
              </div>
              <button onClick={() => setIsDebitLocked(!isDebitLocked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDebitLocked ? 'bg-red-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDebitLocked ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {creditAccounts.map(credit => (
              <div key={credit.id} className="flex justify-between items-center p-4 rounded-lg mb-4 bg-gray-50">
                <div>
                  <div className="font-bold text-gray-800">{credit.card_name}</div>
                  <div className="text-xs text-gray-500">Ending in ...{credit.card_number.slice(-4)}</div>
                </div>
                <button onClick={() => setIsCreditLocked(!isCreditLocked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isCreditLocked ? 'bg-red-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCreditLocked ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
            <button onClick={() => setActiveModal('none')} className="w-full mt-4 bg-[#004879] hover:bg-[#003456] text-white font-bold py-3 rounded transition shadow-sm focus:outline-none">
              Save Security Settings
            </button>
          </div>
        </div>
      )}

      {/* STATEMENT / PDF MODAL (RESTORED) */}
      {activeModal === 'statement' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:w-full print:p-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-end border-b-2 border-[#004879] pb-6 mb-6">
              <Image src="/capitalone-com-wordmark.png" alt="Logo" width={180} height={60} className="object-contain" priority />
              <div className="text-right">
                <h1 className="text-2xl font-black text-gray-800 uppercase tracking-widest">Account Statement</h1>
                <p className="text-gray-500 font-mono mt-1">Generated: {new Date().toLocaleDateString()}</p>
                <p className="text-gray-500 font-mono text-sm">Account: 360 Checking (...{accountNumber})</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-8 border-b border-gray-200 pb-8">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Account Holder</h3>
                <p className="text-lg font-bold text-gray-800 uppercase">{legalName}</p>
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
                    <td className="py-3 text-sm font-bold text-gray-800 capitalize">{tx.description || tx.type} <span className="text-xs font-normal text-gray-400 block">{tx.status}</span></td>
                    <td className="py-3 text-sm font-bold text-right font-mono text-gray-800">
                      {tx.sender_account_id === accountId ? '-' : '+'}${Math.abs(Number(tx.amount)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-10 flex justify-end space-x-4 print:hidden">
              <button onClick={() => setActiveModal('none')} className="text-gray-500 font-bold hover:text-black focus:outline-none">Close window</button>
              <button onClick={() => window.print()} className="bg-[#0071ce] hover:bg-[#005a8f] text-white px-6 py-2 rounded font-bold shadow-md flex items-center focus:outline-none">
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
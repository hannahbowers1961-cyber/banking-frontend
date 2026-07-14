"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function ClientDashboard() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://banking-backend-rg44.onrender.com';
  
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
  const [notification, setNotification] = useState({ isOpen: false, type: 'success', title: '', message: '' });
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
  const TX_LIMIT = 25; 

  // Dynamic Products States
  const [creditAccounts, setCreditAccounts] = useState([]);
  const [loanAccounts, setLoanAccounts] = useState([]);
  const [upcomingTxs, setUpcomingTxs] = useState([]);
  
  const [rewardsBalance, setRewardsBalance] = useState(0); 
  const rewardMiles = rewardsBalance || 0; 
  const rewardValue = rewardMiles * 0.01;

  // Profile, Security & Limits States
  const [userEmail, setUserEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ssn, setSsn] = useState('');
  const [address, setAddress] = useState('');
  const [showAddress, setShowAddress] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [accountTier, setAccountTier] = useState('360 Premier Gold');
  const [dailyLimit, setDailyLimit] = useState(5000);
  const [logoutCountdown, setLogoutCountdown] = useState(900); 
  
  // Spending & Activity States
  const [spendingTimeframe, setSpendingTimeframe] = useState('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Active & Historical Device Sessions State
  const [deviceSessions, setDeviceSessions] = useState([]);

  // Helper: Format balances into dollars and superscript cents
  const formatBalanceParts = (amount) => {
    const num = Number(amount || 0);
    const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const parts = formatted.split('.');
    return { dollars: parts[0], cents: parts[1] };
  };

  useEffect(() => {
    const savedTab = localStorage.getItem('capitalOne_activeTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('capitalOne_activeTab', activeTab);
  }, [activeTab]);

  const handleRevokeDevice = (sessionId) => {
    if (sessionId === 'all-others') {
      supabase.auth.signOut({ scope: 'others' });
      setDeviceSessions(prev => prev.filter(s => s.isCurrent));
      setNotification({ isOpen: true, type: 'success', title: 'Devices Revoked', message: 'Success! All other active device sessions have been terminated.' });
    } else {
      setDeviceSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  useEffect(() => {
    if (logoutCountdown <= 0) {
      supabase.auth.signOut();
      router.push('/');
      return;
    }
    const timer = setInterval(() => setLogoutCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [logoutCountdown, router]);

  useEffect(() => {
    const handleActivity = () => {
      setLogoutCountdown((prev) => {
        if (prev <= 60) return prev; 
        if (prev > 890) return prev; 
        return 900; 
      });
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const ua = window.navigator.userAgent;
    let os = "Unknown OS";
    if (ua.indexOf("Win") !== -1) os = "Windows PC";
    else if (ua.indexOf("Mac") !== -1) os = "MacBook / macOS";
    else if (ua.indexOf("Linux") !== -1) os = "Linux Machine";
    else if (ua.indexOf("Android") !== -1) os = "Android Device";
    else if (ua.indexOf("like Mac") !== -1 || ua.indexOf("iPhone") !== -1 || ua.indexOf("iPad") !== -1) os = "iPhone / iPad";

    let browser = "Web Browser";
    if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Edg") === -1 && ua.indexOf("OPR") === -1) browser = "Chrome Browser";
    else if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) browser = "Safari Browser";
    else if (ua.indexOf("Firefox") !== -1) browser = "Firefox Browser";
    else if (ua.indexOf("Edg") !== -1) browser = "Edge Browser";
    else if (ua.indexOf("OPR") !== -1 || ua.indexOf("Opera") !== -1) browser = "Opera Browser";

    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const ipMasked = data.ip ? data.ip.replace(/\.\d+\.\d+$/, '.***.***') : '192.168.***.***';
        const loc = data.city && data.country_name ? `${data.city}, ${data.country_name} (IP: ${ipMasked})` : `Current Location (IP: ${ipMasked})`;
        setDeviceSessions([
          { id: 'curr-real', type: deviceType, device: `${os} • ${browser}`, location: loc, status: 'Active Now', isCurrent: true, lastSeen: 'Just now' },
          { id: 'hist-real', type: deviceType === 'desktop' ? 'mobile' : 'desktop', device: deviceType === 'desktop' ? `Mobile Companion App` : `Desktop Web • ${browser}`, location: loc, status: 'Signed in recently', isCurrent: false, lastSeen: '1 day ago' }
        ]);
      })
      .catch(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Network";
        setDeviceSessions([
          { id: 'curr-real', type: deviceType, device: `${os} • ${browser}`, location: `${tz} (IP: Active)`, status: 'Active Now', isCurrent: true, lastSeen: 'Just now' },
          { id: 'hist-real', type: deviceType === 'desktop' ? 'mobile' : 'desktop', device: deviceType === 'desktop' ? `Mobile Companion App` : `Desktop Web • ${browser}`, location: `${tz} (IP: Known)`, status: 'Signed in recently', isCurrent: false, lastSeen: '1 day ago' }
        ]);
      });
  }, []);

  const fetchUserData = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { router.push('/'); return; }
    setUserId(user.id);
    setUserEmail(user.email || '');

    const { data: profile } = await supabase.from('profiles').select('account_status, legal_name, profile_photo, phone, ssn, address').eq('id', user.id).single();
    if (profile) {
      setAccountStatus(profile.account_status);
      if (profile.legal_name) setLegalName(profile.legal_name);
      if (profile.profile_photo) setProfilePhoto(profile.profile_photo);
      if (profile.phone) setPhone(profile.phone);
      if (profile.ssn) setSsn(profile.ssn);
      if (profile.address) setAddress(profile.address);
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

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setProfilePhoto(base64String); 
      try {
        await fetch(`${API_URL}/api/client/update-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, profilePhoto: base64String })
        });
      } catch (err) { console.error("Failed to sync photo to server:", err); }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setProfilePhoto(null);
    try {
      await fetch(`${API_URL}/api/client/update-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profilePhoto: null })
      });
    } catch (err) { console.error("Failed to remove photo on server:", err); }
  };

  const getSpendingMetrics = (timeframe) => {
    const now = new Date();
    const filtered = transactions.filter(tx => {
      if (!tx.created_at) return true;
      const txDate = new Date(tx.created_at);
      const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
      if (timeframe === 'daily') return diffDays <= 1;
      if (timeframe === 'weekly') return diffDays <= 7;
      if (timeframe === 'monthly') return diffDays <= 30;
      if (timeframe === 'yearly') return diffDays <= 365;
      return true;
    });

    const validTxs = filtered.length > 0 ? filtered : transactions.slice(0, timeframe === 'daily' ? 4 : timeframe === 'weekly' ? 8 : transactions.length);

    const inflow = validTxs.filter(tx => tx.receiver_account_id === accountId || tx.type === 'deposit').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const outflow = validTxs.filter(tx => tx.sender_account_id === accountId || tx.type === 'withdrawal').reduce((acc, curr) => acc + Number(curr.amount), 0);

    return { inflow, outflow, validTxs };
  };

  const dailyMetrics = getSpendingMetrics('daily');
  const modalMetrics = getSpendingMetrics(spendingTimeframe);

  const totalInflow = transactions.filter(tx => tx.receiver_account_id === accountId || tx.type === 'deposit').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalOutflow = transactions.filter(tx => tx.sender_account_id === accountId || tx.type === 'withdrawal').reduce((acc, curr) => acc + Number(curr.amount), 0);

  const getFilteredAndGroupedTransactions = () => {
    let filtered = transactions;
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        (tx.description && tx.description.toLowerCase().includes(lowerQuery)) ||
        (tx.amount && tx.amount.toString().includes(lowerQuery)) ||
        (tx.category && tx.category.toLowerCase().includes(lowerQuery))
      );
    }
    if (filterType === 'inflow') {
      filtered = filtered.filter(tx => tx.receiver_account_id === accountId || tx.type === 'deposit');
    } else if (filterType === 'outflow') {
      filtered = filtered.filter(tx => tx.sender_account_id === accountId || tx.type === 'withdrawal');
    }
    const grouped = {};
    filtered.forEach(tx => {
      const dateStr = new Date(tx.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(tx);
    });
    return grouped;
  };

  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Date,Description,Category,Type,Amount,Status\n";
    transactions.forEach(tx => {
      const amt = tx.sender_account_id === accountId ? `-${tx.amount}` : `+${tx.amount}`;
      const row = `${formatDate(tx.created_at)},"${tx.description || tx.type}","${tx.category || 'General'}","${tx.type}",${amt},${tx.status}`;
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Statement_360_Checking_${accountNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      balance: type === 'credit' ? item.balance : item.current_balance,
      limit: type === 'credit' ? item.credit_limit : null
    });
    setErrorMsg(''); setTransferAmount('');
    setActiveModal('pay_debt');
  };

  const executeDebtPayment = async (e) => {
    e.preventDefault();
    if (!transferAmount || transferAmount <= 0) return;
    
    const numAmount = parseFloat(transferAmount);
    const targetBal = parseFloat(targetDebt.balance);
    
    setIsTransferring(true); 
    setErrorMsg('');

    if (numAmount > targetBal) {
      setErrorMsg(`Payment cannot exceed the remaining balance of $${targetBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
      setIsTransferring(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/client/pay-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sourceAccountId: accountId,
          debtId: targetDebt.id,
          debtType: targetDebt.type,
          amount: numAmount
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Payment failed');
      
      setNotification({ isOpen: true, type: 'success', title: 'Payment Successful', message: 'Your payment has been processed and posted to your account.' });
      setActiveModal('none');
      setTransferAmount('');
      fetchUserData(); 
    } catch (err) { 
      setErrorMsg(err.message || 'Network error. Please try again later.'); 
    } finally { 
      setIsTransferring(false); 
    }
  };

  const executeInternalTransfer = async () => {
    if (!transferAmount || transferAmount <= 0) return;
    setIsTransferring(true);
    setErrorMsg('');

    try {
      // Custom handler for Credit Card to Savings
      if (transferDirection.startsWith('cc-')) {
        const ccId = transferDirection.replace('cc-', '');
        const cc = creditAccounts.find(c => c.id == ccId);
        const numAmount = parseFloat(transferAmount);
        const avail = parseFloat(cc.credit_limit) - parseFloat(cc.balance);
        
        if (numAmount > avail) { 
          throw new Error("Declined: Insufficient available credit for cash advance."); 
        }

        const newCcBal = parseFloat(cc.balance) + numAmount;
        const { error: ccErr } = await supabase.from('credit_accounts').update({ balance: newCcBal }).eq('id', ccId);
        if (ccErr) throw ccErr;

        const newSavBal = parseFloat(savingsBalance) + numAmount;
        const { error: savErr } = await supabase.from('accounts').update({ savings_balance: newSavBal }).eq('account_id', accountId);
        if (savErr) throw savErr;

        await supabase.from('transactions').insert([{
           sender_account_id: ccId,
           receiver_account_id: accountId,
           type: 'transfer',
           amount: numAmount,
           status: 'approved',
           description: 'Cash Advance to Savings',
           category: 'Transfer'
        }]);

        setNotification({ isOpen: true, type: 'success', title: 'Transfer Complete', message: 'Funds have been successfully added to your savings.'});
        setActiveModal('none'); 
        setTransferAmount(''); 
        fetchUserData();
        setIsTransferring(false);
        return;
      }

      // Standard Checking <-> Savings Transfer
      const response = await fetch(`${API_URL}/api/client/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: transferAmount, direction: transferDirection }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Transfer failed');

      setNotification({ isOpen: true, type: 'success', title: 'Transfer Complete', message: 'Your funds have been moved successfully.' });
      setActiveModal('none'); 
      setTransferAmount(''); 
      fetchUserData(); 
    } catch(err) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleExternalTransfer = async (e, type) => {
    e.preventDefault();
    if (!transferAmount || transferAmount <= 0 || !receiverId) return;
    setIsTransferring(true); 
    setErrorMsg('');

    try {
      const endpoint = type === 'wire' ? '/api/client/wire' : '/api/client/zelle';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderUserId: userId, receiverAccountId: receiverId, amount: parseFloat(transferAmount), description }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Transfer failed');
      
      setNotification({ isOpen: true, type: 'success', title: 'Transfer Sent', message: `${type === 'wire' ? 'Wire Transfer' : 'Zelle Transfer'} sent successfully!` });
      setActiveModal('none');
      setReceiverId(''); setTransferAmount(''); setDescription('');
      fetchUserData();
    } catch (err) { 
      setErrorMsg(err.message || 'Network error. Please try again later.'); 
    } finally { 
      setIsTransferring(false); 
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const formatStatementDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const statementTxs = [...transactions].reverse();
  const statementStartBal = Number(checkingBalance) - totalInflow + totalOutflow;
  let runningBal = statementStartBal;

  const renderTransactionList = (limit = null) => {
    if (transactions.length === 0) return <div className="p-8 text-center text-gray-400 font-bold">No recent transactions.</div>;
    const displayTxs = limit ? transactions.slice(0, limit) : transactions;
    
    return displayTxs.map((tx) => {
      const rawAmount = Number(tx.amount);
      const isActuallyWithdrawal = tx.sender_account_id === accountId;
      const isTransfer = tx.type === 'transfer';
      
      const absAmount = Math.abs(rawAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      let txPrefix = '+'; let txColor = 'bg-emerald-500'; let textColor = 'text-emerald-600'; let iconChar = '+';
      if (isActuallyWithdrawal) { txPrefix = '-'; txColor = 'bg-[#dd0031]'; textColor = 'text-gray-900'; iconChar = '-'; } 
      else if (isTransfer) { txPrefix = '-'; txColor = 'bg-[#0071ce]'; textColor = 'text-gray-900'; iconChar = '⇄'; }

      const txDescription = tx.description || (tx.type === 'deposit' ? 'Online Deposit' : tx.type === 'transfer' ? 'Account Transfer' : 'Card Purchase');
      const accountName = tx.type === 'transfer' ? 'Multiple Accounts' : `360 Checking (...${accountNumber})`;

      return (
        <div 
          key={tx.id} 
          onClick={() => { 
            setSelectedTx({ 
              ...tx, txPrefix, txColor, textColor: txPrefix === '+' ? 'text-emerald-600' : 'text-[#dd0031]', absAmount, description: txDescription, account: accountName, 
              formattedDate: formatDate(tx.created_at), formattedTime: formatTime(tx.created_at) 
            }); 
            setActiveModal('tx_details'); 
          }}
          className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b last:border-b-0 border-gray-50 hover:bg-gray-50 transition cursor-pointer group"
        >
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full ${txColor} text-white flex items-center justify-center font-bold text-xl shadow-sm group-hover:scale-105 transition-transform`}>{iconChar}</div>
            <div>
              <div className="font-bold text-base text-gray-800 capitalize line-clamp-1">{txDescription}</div>
              <div className="text-xs text-gray-500 capitalize">{tx.status}</div>
            </div>
          </div>
          <div className="text-right shrink-0 ml-2">
            <div className={`font-semibold text-base ${textColor}`}>{txPrefix}${absAmount}</div>
            <div className="text-xs text-gray-500">{formatDate(tx.created_at)}</div>
          </div>
        </div>
      );
    });
  };

  if (isLoading) return <div className="min-h-screen bg-[#e8eef3] flex items-center justify-center font-bold text-[#004879]">Securely loading your accounts...</div>;

  const navItems = [
    { id: "checking", name: `Checking... ${accountNumber}`, icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> },
    { id: "savings", name: `Savings... ${savingsAccountNumber}`, icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08-.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
    { id: "credit", name: `Credit Cards... ${creditAccounts[0]?.card_number?.slice(-4) || '----'}`, icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> },
    { id: "loans", name: `Loans... ${loanAccounts[0]?.account_number?.slice(-4) || '----'}`, icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg> },
    { id: "rewards", name: "Rewards & Deals", icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> },
    { id: "activity", name: "Recent Activity", icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> },
    { id: "profile", name: "Profile & Settings", icon: <svg className="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> },
  ];

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
            <div className="flex items-center gap-3 sm:gap-6">
              <button 
                onClick={() => { supabase.auth.signOut(); router.push('/'); }} 
                className="text-xs font-bold text-gray-500 hover:text-red-600 focus:outline-none mr-2 sm:mr-0 shrink-0"
              >
                Sign Out
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-10 h-10 shrink-0 rounded-full bg-[#004879] text-white flex items-center justify-center font-bold text-sm uppercase shadow-md hover:ring-2 hover:ring-[#0071ce] hover:scale-105 transition-all overflow-hidden relative focus:outline-none"
                title="Manage Profile & Security"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{legalName.substring(0, 2)}</span>
                )}
              </button>
            </div>
          </div>
          
          {isMobileMenuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full bg-[#00426b] shadow-2xl border-t border-[#003456] z-[100] rounded-b-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col py-2">
                {navItems.map((item) => (
                  <div 
                    key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`flex items-center px-6 py-4 cursor-pointer transition-colors ${activeTab === item.id ? 'bg-[#005a8f] border-l-4 border-blue-300' : 'text-gray-300 hover:bg-[#004f80] border-l-4 border-transparent'}`}
                  >
                    {item.icon} <span className={`text-sm ${activeTab === item.id ? 'font-bold text-white' : 'font-medium'}`}>{item.name}</span>
                  </div>
                ))}

                <div className="border-t border-[#003456] mt-2 pt-2">
                  <div 
                    onClick={() => { supabase.auth.signOut(); router.push('/'); }}
                    className="flex items-center px-6 py-4 cursor-pointer text-red-300 hover:bg-[#004f80] hover:text-red-200 transition-colors border-l-4 border-transparent"
                  >
                    <svg className="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    <span className="text-sm font-bold">Sign Out</span>
                  </div>
                </div>
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
            
            <div className={`${['checking', 'savings'].includes(activeTab) ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col space-y-4 md:space-y-6 transition-all duration-300`}>
              
              {activeTab === 'checking' && (
                <>
                  <div className="space-y-4 animate-in fade-in duration-300">
                    
                    {/* 360 Checking Card */}
                    <div className="bg-[#186585] text-white rounded-xl p-5 md:p-6 shadow-md relative overflow-hidden transition-all hover:shadow-lg">
                      <div className="flex items-baseline">
                        <span className="text-lg md:text-xl font-semibold tracking-wide">360 Checking</span>
                        <span className="text-white/80 text-sm md:text-base font-normal ml-2">...{accountNumber}</span>
                      </div>
                      <div className="flex items-start my-3 font-light">
                        <span className="text-xl md:text-2xl font-normal mt-1.5 mr-0.5">$</span>
                        <span className="text-4xl md:text-5xl font-normal tracking-tight leading-none">
                          {formatBalanceParts(checkingBalance).dollars}
                        </span>
                        <span className="text-xl md:text-2xl font-normal mt-1.5 ml-0.5">
                          {formatBalanceParts(checkingBalance).cents}
                        </span>
                      </div>
                      <div className="text-sm md:text-base text-white/90 font-normal">Available Balance</div>
                    </div>

                    {/* 360 Savings Card */}
                    <div className="bg-[#0c2b4e] text-white rounded-xl p-5 md:p-6 shadow-md relative overflow-hidden transition-all hover:shadow-lg">
                      <div className="flex items-baseline">
                        <span className="text-lg md:text-xl font-semibold tracking-wide">360 Savings</span>
                        <span className="text-white/80 text-sm md:text-base font-normal ml-2">...{savingsAccountNumber}</span>
                      </div>
                      <div className="flex items-start my-3 font-light">
                        <span className="text-xl md:text-2xl font-normal mt-1.5 mr-0.5">$</span>
                        <span className="text-4xl md:text-5xl font-normal tracking-tight leading-none">
                          {formatBalanceParts(savingsBalance).dollars}
                        </span>
                        <span className="text-xl md:text-2xl font-normal mt-1.5 ml-0.5">
                          {formatBalanceParts(savingsBalance).cents}
                        </span>
                      </div>
                      <div className="text-sm md:text-base text-white/90 font-normal">Available Balance</div>
                    </div>

                    <button onClick={() => handleSecureAction('transfer')} className="w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3.5 rounded-xl text-sm transition shadow-sm focus:outline-none">
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
                <div className="space-y-4 animate-in fade-in duration-300 min-h-[500px]">
                  <div className="bg-[#0c2b4e] text-white rounded-xl p-5 md:p-6 shadow-md relative overflow-hidden transition-all hover:shadow-lg">
                    <div className="flex items-baseline">
                      <span className="text-lg md:text-xl font-semibold tracking-wide">360 Performance Savings</span>
                      <span className="text-white/80 text-sm md:text-base font-normal ml-2">...{savingsAccountNumber}</span>
                    </div>
                    <div className="flex items-start my-3 font-light">
                      <span className="text-xl md:text-2xl font-normal mt-1.5 mr-0.5">$</span>
                      <span className="text-4xl md:text-5xl font-normal tracking-tight leading-none">
                        {formatBalanceParts(savingsBalance).dollars}
                      </span>
                      <span className="text-xl md:text-2xl font-normal mt-1.5 ml-0.5">
                        {formatBalanceParts(savingsBalance).cents}
                      </span>
                    </div>
                    <div className="text-sm md:text-base text-white/90 font-normal">Available Balance</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => handleSecureAction('transfer')} className="bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3.5 rounded-xl transition shadow-sm focus:outline-none text-sm sm:text-base truncate">Add Money</button>
                    <button onClick={() => handleSecureAction('transfer')} className="bg-white text-[#0071ce] hover:bg-blue-50 font-bold py-3.5 rounded-xl transition shadow-sm focus:outline-none text-sm sm:text-base truncate border border-gray-200">Transfer Out</button>
                  </div>
                </div>
              )}

              {activeTab === 'credit' && (
                <div className="space-y-6 animate-in fade-in duration-300 min-h-[500px]">
                  {creditAccounts.length > 0 ? creditAccounts.map(credit => {
                    const balanceParts = formatBalanceParts(credit.balance);
                    const availCredit = (parseFloat(credit.credit_limit) - parseFloat(credit.balance)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return (
                      <div key={credit.id} className="space-y-3">
                        <div className="bg-[#0c2b4e] text-white rounded-xl p-5 md:p-6 shadow-md relative overflow-hidden transition-all hover:shadow-lg">
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline">
                              <span className="font-serif tracking-[0.2em] font-medium text-lg md:text-xl uppercase">{credit.card_name}</span>
                              <span className="text-white/80 font-sans tracking-normal font-normal text-sm md:text-base ml-2">...{credit.card_number.slice(-4)}</span>
                            </div>
                          </div>
                          <div className="flex items-start my-3 font-light">
                            <span className="text-xl md:text-2xl font-normal mt-1.5 mr-0.5">$</span>
                            <span className="text-4xl md:text-5xl font-normal tracking-tight leading-none">
                              {balanceParts.dollars}
                            </span>
                            <span className="text-xl md:text-2xl font-normal mt-1.5 ml-0.5">
                              {balanceParts.cents}
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-sm md:text-base text-white/90 font-normal">Current Balance</span>
                            <span className="text-xs text-white/70 font-sans">Available Credit: ${availCredit}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 pt-2">
                          <button onClick={() => handlePayDebtModal('credit', credit)} className="w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3.5 rounded-xl transition shadow-sm focus:outline-none text-sm">
                            Make a Payment
                          </button>
                        </div>
                      </div>
                    );
                  }) : (
                     <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400 font-bold">No Credit Accounts Found.</div>
                  )}
                </div>
              )}

              {activeTab === 'loans' && (
                <div className="space-y-6 animate-in fade-in duration-300 min-h-[500px]">
                  {loanAccounts.length > 0 ? loanAccounts.map(loan => {
                    const balanceParts = formatBalanceParts(loan.current_balance);
                    const paidPct = ((loan.original_principal - loan.current_balance) / loan.original_principal) * 100;
                    return (
                      <div key={loan.id} className="space-y-3">
                        <div className="bg-[#186585] text-white rounded-xl p-5 md:p-6 shadow-md relative overflow-hidden transition-all hover:shadow-lg">
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline">
                              <span className="text-lg md:text-xl font-semibold tracking-wide">{loan.loan_name}</span>
                              <span className="text-white/80 font-normal text-sm md:text-base ml-2">...{loan.account_number.slice(-4)}</span>
                            </div>
                            <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full">Due {formatDate(loan.next_payment_date)}</span>
                          </div>
                          
                          <div className="flex items-start my-3 font-light">
                            <span className="text-xl md:text-2xl font-normal mt-1.5 mr-0.5">
                              {loan.current_balance > 0 ? '-$' : '$'}
                            </span>
                            <span className="text-4xl md:text-5xl font-normal tracking-tight leading-none">
                              {balanceParts.dollars}
                            </span>
                            <span className="text-xl md:text-2xl font-normal mt-1.5 ml-0.5">
                              {balanceParts.cents}
                            </span>
                          </div>

                          <div className="flex justify-between items-end mb-4">
                            <span className="text-sm md:text-base text-white/90 font-normal">Remaining Principal</span>
                            <span className="text-xs sm:text-sm font-bold text-[#ffc72c]">${parseFloat(loan.monthly_payment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo</span>
                          </div>
                          <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#00e396] h-full" style={{ width: `${paidPct}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[11px] text-white/70 mt-1.5 font-sans">
                            <span>${(loan.original_principal - loan.current_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Paid</span>
                            <span>${parseFloat(loan.original_principal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total</span>
                          </div>
                        </div>
                        <button onClick={() => handlePayDebtModal('loan', loan)} className="w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3.5 rounded-xl transition shadow-sm focus:outline-none text-sm">
                          Pay Auto Loan
                        </button>
                      </div>
                    );
                  }) : (
                     <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400 font-bold">No Active Loans.</div>
                  )}
                </div>
              )}

              {activeTab === 'rewards' && (
                <div className="bg-white rounded-xl shadow p-5 md:p-6 relative animate-in fade-in duration-300 min-h-[500px]">
                  <div className="flex items-center justify-center flex-col py-10 border-b border-gray-100">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-3xl sm:text-4xl shadow-inner">🏆</div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">Your Rewards Balance</h2>
                    <div className="text-4xl md:text-[48px] font-extrabold text-[#0071ce] mt-2 tracking-tight truncate w-full px-2 sm:px-4 text-center">
                      {rewardMiles.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg sm:text-xl text-gray-500 tracking-normal">Miles</span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-600 font-bold mt-2 text-center truncate w-full px-2">
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
                <div className="bg-white rounded-xl shadow flex-1 flex flex-col min-h-[700px] animate-in fade-in duration-300 overflow-hidden">
                  <div className="p-5 md:p-6 border-b border-gray-200 bg-white z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Transaction History</h3>
                        <p className="text-sm text-gray-500 mt-1">Review and search your past transactions.</p>
                      </div>
                      <button onClick={handleDownloadCSV} className="flex items-center text-[#0071ce] hover:text-[#005a8f] font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-lg transition-colors focus:outline-none">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download CSV
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-3 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </span>
                        <input 
                          type="text" 
                          placeholder="Search by name, category, or amount..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0071ce] focus:bg-white transition-all text-gray-900"
                        />
                      </div>
                      <div className="shrink-0 flex gap-2">
                        <select 
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0071ce] block w-full p-2.5 font-bold transition-all"
                        >
                          <option value="all">All Transactions</option>
                          <option value="inflow">Money In (+)</option>
                          <option value="outflow">Money Out (-)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-gray-50/50 pb-6 relative">
                    {(() => {
                      const groupedTxs = getFilteredAndGroupedTransactions();
                      const dates = Object.keys(groupedTxs);

                      if (dates.length === 0) {
                        return (
                          <div className="p-12 text-center flex flex-col items-center justify-center mt-10">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                            </div>
                            <h4 className="text-lg font-bold text-gray-800 mb-1">No transactions found</h4>
                            <p className="text-sm text-gray-500">Try adjusting your search or filter settings.</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {dates.map(dateStr => (
                            <div key={dateStr} className="mb-0">
                              <div className="sticky top-0 bg-[#f8fafc]/95 border-y border-gray-200/80 px-5 md:px-6 py-2 z-10 flex justify-between items-center backdrop-blur-md">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{dateStr}</span>
                                <span className="text-[11px] font-bold text-gray-400">{groupedTxs[dateStr].length} {groupedTxs[dateStr].length === 1 ? 'item' : 'items'}</span>
                              </div>
                              
                              <div className="divide-y divide-gray-100 bg-white">
                                {groupedTxs[dateStr].map(tx => {
                                  const rawAmount = Number(tx.amount);
                                  const isActuallyWithdrawal = tx.sender_account_id === accountId;
                                  const isTransfer = tx.type === 'transfer';
                                  
                                  const absAmount = Math.abs(rawAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  
                                  let txPrefix = '+'; let txColor = 'bg-emerald-500'; let textColor = 'text-emerald-600'; let iconChar = '+';
                                  if (isActuallyWithdrawal) { txPrefix = '-'; txColor = 'bg-[#dd0031]'; textColor = 'text-gray-900'; iconChar = '-'; } 
                                  else if (isTransfer) { txPrefix = '-'; txColor = 'bg-[#0071ce]'; textColor = 'text-gray-900'; iconChar = '⇄'; }

                                  const txDescription = tx.description || (tx.type === 'deposit' ? 'Online Deposit' : tx.type === 'transfer' ? 'Account Transfer' : 'Card Purchase');
                                  const accountName = tx.type === 'transfer' ? 'Multiple Accounts' : `360 Checking (...${accountNumber})`;

                                  return (
                                    <div 
                                      key={tx.id} 
                                      onClick={() => { 
                                        setSelectedTx({ 
                                          ...tx, txPrefix, txColor, textColor: txPrefix === '+' ? 'text-emerald-600' : 'text-[#dd0031]', absAmount, description: txDescription, account: accountName, 
                                          formattedDate: formatDate(tx.created_at), formattedTime: formatTime(tx.created_at) 
                                        }); 
                                        setActiveModal('tx_details'); 
                                      }}
                                      className="flex justify-between items-center px-5 md:px-6 py-4 hover:bg-gray-50 transition cursor-pointer group"
                                    >
                                      <div className="flex items-center space-x-4 min-w-0 pr-4">
                                        <div className={`w-10 h-10 shrink-0 rounded-full ${txColor} text-white flex items-center justify-center font-bold text-xl shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                                          {iconChar}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-bold text-sm md:text-base text-gray-800 capitalize truncate leading-tight mb-1">
                                            {txDescription}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                                              {tx.status}
                                            </span>
                                            <span className="hidden sm:inline-block w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span className="hidden sm:inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider truncate max-w-[120px]">
                                              {tx.category || 'General'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className={`font-semibold text-base md:text-lg tracking-tight ${textColor}`}>
                                          {txPrefix}${absAmount}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                    
                    {hasMoreTxs && transactions.length > 0 && !searchQuery && filterType === 'all' && (
                        <div className="px-6 py-6 bg-white">
                          <button onClick={loadMoreTransactions} className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-lg text-sm transition focus:outline-none">
                              Load Older Transactions
                          </button>
                        </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-white rounded-xl shadow p-5 md:p-8 relative animate-in fade-in duration-300 min-h-[600px] space-y-8">
                  <div className="border-b border-gray-100 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="min-w-0">
                      <h2 className="text-2xl font-bold text-gray-800 truncate">Profile & Security Management</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage personal identification, transfer limits, and active sessions.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      Tier: {accountTier}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-gray-100 pb-8">
                    <div className="lg:col-span-7 space-y-5">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Personal Identification (Masked)</h3>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Legal Name (Uneditable)</label>
                        <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-bold text-base cursor-not-allowed select-none flex justify-between items-center">
                          <span>{legalName}</span>
                          <span className="text-[11px] font-normal text-gray-400">🔒 Verified by branch</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Registered Email</label>
                        <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800 font-bold truncate">
                          {userEmail || 'loading...'}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                          <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800 font-bold">
                            ***-***-{phone ? phone.slice(-4) : '0000'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase">Social Security Number</label>
                          <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800 font-bold">
                            ***-**-{ssn ? ssn.slice(-4) : '0000'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Registered Address</label>
                        <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800 font-bold flex justify-between items-center">
                          <span className="truncate pr-4">
                            {showAddress ? (address || 'No address on file') : '••••••••••••••••••••••••••••'}
                          </span>
                          <button onClick={() => setShowAddress(!showAddress)} className="text-[#0071ce] hover:underline text-[11px] uppercase tracking-wider focus:outline-none shrink-0 font-bold">
                            {showAddress ? 'Hide' : 'Reveal'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 flex flex-col items-center justify-center bg-gray-50/80 p-6 rounded-xl border-2 border-dashed border-gray-300">
                      <div className="w-24 h-24 rounded-full bg-[#004879] text-white flex items-center justify-center font-bold text-2xl uppercase mb-4 shadow-inner overflow-hidden relative">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span>{legalName.substring(0, 2)}</span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-gray-800 mb-1">Avatar Photo</h4>
                      <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed">Upload a clear photo to personalize your top-right initials circle.</p>
                      
                      <label className="cursor-pointer bg-white hover:bg-gray-100 text-[#0071ce] border border-[#0071ce] font-bold px-4 py-2 rounded-lg text-xs transition shadow-sm inline-block">
                        <span>Choose File...</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handlePhotoUpload(e.target.files[0])}
                        />
                      </label>
                      
                      {profilePhoto && (
                        <button 
                          onClick={handleRemovePhoto} 
                          className="text-[11px] text-red-500 font-bold mt-3 hover:underline block"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-8">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Account Limits & Tier Adjustment</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Adjust your daily outbound ACH and Wire transfer limit.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 font-bold block">Daily Outbound Limit</span>
                        <span className="text-2xl font-black text-[#004879] font-mono">${Number(dailyLimit).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <input 
                        type="range" min="1000" max="50000" step="1000" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0071ce]"
                      />
                      <div className="flex justify-between text-xs font-bold text-gray-400 mt-3 font-mono">
                        <span>$1,000 (Standard)</span>
                        <span>$25,000 (Premier)</span>
                        <span>$50,000 (Private Wealth)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active & Recent Device Sessions</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Review devices currently or recently logged into your account.</p>
                      </div>
                      <div className="flex items-center bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-bold text-blue-900 mr-2">Auto-Signout In:</span>
                        <span className="text-sm font-black font-mono text-[#0071ce]">{formatCountdown(logoutCountdown)}</span>
                        <button onClick={() => setLogoutCountdown(900)} className="ml-2 text-[10px] bg-white border border-blue-200 text-blue-700 font-bold px-1.5 py-0.5 rounded hover:bg-blue-100 transition" title="Reset Timer">⏳ Reset</button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 mb-4 bg-white">
                      {deviceSessions.map((session) => (
                        <div key={session.id} className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${session.isCurrent ? 'bg-emerald-50/40' : 'hover:bg-gray-50'}`}>
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${session.isCurrent ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-gray-100 text-gray-600'}`}>
                              {session.type === 'mobile' ? '📱' : '💻'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-800 truncate">{session.device}</span>
                                {session.isCurrent && (
                                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0">Current Device</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-0.5">{session.location} • <span className="font-medium text-gray-600">{session.status}</span></div>
                            </div>
                          </div>
                          <div className="shrink-0 w-full sm:w-auto text-right">
                            {session.isCurrent ? (
                              <span className="text-xs font-bold text-emerald-600 inline-flex items-center">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                Active Session
                              </span>
                            ) : (
                              <button onClick={() => handleRevokeDevice(session.id)} className="w-full sm:w-auto text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 px-3 py-1.5 rounded-lg transition">
                                Revoke Access
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                      <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
                        <span className="font-bold text-gray-600">Security Notice:</span> Revoking a device immediately invalidates its JWT authentication token. If you recognize an unfamiliar device, revoke access immediately and update your password at a branch.
                      </p>
                      {deviceSessions.length > 1 && (
                        <button onClick={() => handleRevokeDevice('all-others')} className="w-full sm:w-auto shrink-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-4 py-2.5 rounded-lg text-xs transition flex items-center justify-center shadow-sm">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                          Revoke All Other Devices
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DYNAMIC RIGHT COLUMN */}
            {['checking', 'savings'].includes(activeTab) && (
              <div className="lg:col-span-5 flex flex-col space-y-4 md:space-y-6 animate-in fade-in duration-300">
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
                    <div key={tx.id} onClick={() => { setSelectedTx({ id: tx.id, txPrefix: '-', txColor: tx.color || 'bg-slate-500', textColor: 'text-gray-800', absAmount: Math.abs(Number(tx.amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), description: tx.name, type: 'Scheduled Payment', account: `360 Checking (...${accountNumber})`, formattedDate: tx.date || formatDate(tx.next_date), status: 'Pending' }); setActiveModal('tx_details'); }} className="flex justify-between items-center px-4 md:px-6 py-4 border-b last:border-b-0 border-gray-50 hover:bg-gray-50 transition cursor-pointer group">
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform ${tx.color || 'bg-slate-500'}`}>{tx.initial || tx.name[0]}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-gray-800 truncate">{tx.name}</div>
                          <div className="text-[11px] text-gray-500 truncate">{tx.category || 'General'}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-sm text-gray-800">-${Math.abs(Number(tx.amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-[11px] text-gray-500 truncate">{tx.date || formatDate(tx.next_date)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* --- DAILY SPENDING SUMMARY CARD (DEFAULT VIEW) --- */}
                <div onClick={() => { setSpendingTimeframe('daily'); setActiveModal('spending_details'); }} className="bg-white rounded-xl shadow p-5 md:p-6 relative cursor-pointer hover:shadow-md transition group border border-transparent hover:border-[#0071ce]">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#0071ce] transition">Daily Spending Summary</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Today's Cash Flow Insights</p>
                    </div>
                    <span className="text-[#0071ce] font-bold text-sm opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">View History &rarr;</span>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <div className="flex text-sm mb-2 justify-between gap-2"><span className="font-bold text-gray-800 truncate">Money In (Today)</span> <span className="font-bold text-emerald-600 shrink-0">+${dailyMetrics.inflow.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner"><div className="bg-emerald-500 h-full rounded-full" style={{ width: `${dailyMetrics.inflow === 0 ? 0 : (dailyMetrics.inflow / (dailyMetrics.inflow + dailyMetrics.outflow)) * 100}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex text-sm mb-2 justify-between gap-2"><span className="font-bold text-gray-800 truncate">Money Out (Today)</span> <span className="font-bold text-[#dd0031] shrink-0">-${dailyMetrics.outflow.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                      <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden shadow-inner"><div className="bg-[#dd0031] h-full rounded-full" style={{ width: `${dailyMetrics.outflow === 0 ? 0 : (dailyMetrics.outflow / (dailyMetrics.inflow + dailyMetrics.outflow)) * 100}%` }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 60-SECOND INACTIVITY WARNING MODAL */}
            {logoutCountdown <= 60 && logoutCountdown > 0 && (
              <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 text-center relative animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Session Expiring Soon</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">For your security, we automatically log you out when you're inactive. Your account will be signed out in:</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl py-3 px-6 mb-6 inline-block">
                    <span className="text-3xl font-black font-mono text-amber-600 tracking-wider">{formatCountdown(logoutCountdown)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => setLogoutCountdown(900)} className="flex-1 bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-md focus:outline-none">Stay Logged In</button>
                    <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-sm transition focus:outline-none">Sign Out Now</button>
                  </div>
                  <div className="mt-4 text-[11px] text-gray-400">🔒 Any unsaved transfers will be cancelled upon automatic signout.</div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* --- MODALS ENGINE --- */}

      {activeModal === 'pay_debt' && targetDebt && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200 border-t-8 border-[#0071ce]">
            <form onSubmit={executeDebtPayment}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 truncate pr-2">Make a Payment</h2>
                <button type="button" onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none shrink-0">✕</button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-100 min-w-0">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 truncate">Paying Towards</div>
                <div className="font-bold text-gray-800 truncate">{targetDebt.name}</div>
                <div className="text-sm text-gray-600 mt-1 truncate">
                  Current Balance: <span className="font-bold text-[#dd0031]">{targetDebt.type === 'loan' ? '-' : ''}${parseFloat(targetDebt.balance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>

              {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 font-bold text-sm border border-red-200">{errorMsg}</div>}

              <label className="block text-sm font-bold text-gray-700 mb-2 truncate">Pay From</label>
              <select className="w-full border border-gray-300 rounded px-3 py-3 mb-6 text-gray-900 bg-white truncate" required>
                <option value="checking">360 Checking (...{accountNumber}) - ${parseFloat(checkingBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</option>
              </select>

              <label className="block text-sm font-bold text-gray-700 mb-2 truncate">Payment Amount</label>
              <div className="relative mb-8">
                <span className="absolute left-4 top-3 text-gray-700 font-bold">$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  max={targetDebt.balance} 
                  required 
                  className="w-full border border-gray-300 rounded pl-8 pr-4 py-3 font-mono text-gray-900 bg-white" 
                  placeholder="0.00" 
                  value={transferAmount} 
                  onChange={(e) => setTransferAmount(e.target.value)} 
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setActiveModal('none')} className="text-gray-500 font-bold disabled:opacity-50 shrink-0" disabled={isTransferring}>Cancel</button>
                <button type="submit" disabled={isTransferring} className="bg-[#0071ce] hover:bg-[#005a8f] text-white px-6 py-2 rounded font-bold transition disabled:opacity-50 truncate">
                  {isTransferring ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {activeModal === 'tx_details' && selectedTx && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 truncate pr-2">Transaction Details</h2>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none shrink-0">✕</button>
            </div>
            <div className="text-center mb-8 min-w-0 w-full px-2">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-white shadow-sm ${selectedTx.txColor}`}>
                {selectedTx.txPrefix === '+' ? '+' : '-'}
              </div>
              <div className={`text-3xl sm:text-4xl font-black ${selectedTx.textColor} tracking-tight truncate w-full`}>
                {selectedTx.txPrefix}${selectedTx.absAmount}
              </div>
              <div className="text-gray-500 font-medium capitalize mt-1 truncate">{selectedTx.status}</div>
            </div>
            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex justify-between gap-2"><span className="text-gray-500 text-sm shrink-0">Description</span><span className="font-bold text-gray-800 text-right truncate">{selectedTx.description}</span></div>
              <div className="flex justify-between gap-2"><span className="text-gray-500 text-sm shrink-0">Type</span><span className="font-bold text-gray-800 capitalize text-right truncate">{selectedTx.type}</span></div>
              <div className="flex justify-between gap-2"><span className="text-gray-500 text-sm shrink-0">Account</span><span className="font-bold text-gray-800 text-right truncate">{selectedTx.account}</span></div>
              <div className="flex justify-between gap-2"><span className="text-gray-500 text-sm shrink-0">Date</span><span className="font-bold text-gray-800 text-right truncate">{selectedTx.formattedDate}</span></div>
              
              {selectedTx.formattedTime && (
                <div className="flex justify-between gap-2"><span className="text-gray-500 text-sm shrink-0">Time</span><span className="font-bold text-gray-800 text-right truncate">{selectedTx.formattedTime}</span></div>
              )}
              {selectedTx.id && !selectedTx.id.toString().startsWith('up-') && (
                <div className="flex justify-between gap-2"><span className="text-gray-500 text-sm shrink-0">Reference ID</span><span className="font-mono text-xs text-gray-800 mt-1 text-right truncate">{selectedTx.reference_id || selectedTx.id.split('-')[0].toUpperCase()}</span></div>
              )}
            </div>
            <button onClick={() => setActiveModal('none')} className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded transition focus:outline-none">Close Details</button>
          </div>
        </div>
      )}

      {/* --- MULTI-TIMEFRAME SPENDING DETAILS MODAL --- */}
      {activeModal === 'spending_details' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 md:p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div className="min-w-0 pr-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Cash Flow Insights</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 capitalize">{spendingTimeframe} Spending & Category Breakdown</p>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none shrink-0">✕</button>
            </div>

            {/* Interactive Timeframe Toggle Bar */}
            <div className="flex bg-gray-100 p-1.5 rounded-xl mb-6 gap-1">
              {['daily', 'weekly', 'monthly', 'yearly'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSpendingTimeframe(tab)}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg capitalize transition ${spendingTimeframe === tab ? 'bg-[#0071ce] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/60'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-8">
              <div className="bg-emerald-50 border border-emerald-100 p-4 sm:p-6 rounded-xl text-center min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 text-lg sm:text-xl">↓</div>
                <div className="text-[10px] sm:text-sm font-bold text-emerald-700 uppercase tracking-wider truncate">Money In ({spendingTimeframe})</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-600 mt-1 tracking-tight truncate">+${modalMetrics.inflow.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
              <div className="bg-red-50 border border-red-100 p-4 sm:p-6 rounded-xl text-center min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-200 text-red-700 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 text-lg sm:text-xl">↑</div>
                <div className="text-[10px] sm:text-sm font-bold text-red-700 uppercase tracking-wider truncate">Money Out ({spendingTimeframe})</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#dd0031] mt-1 tracking-tight truncate">-${modalMetrics.outflow.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 truncate">Top Spending Categories ({spendingTimeframe})</h3>
            <div className="space-y-4">
              {['Food', 'Bills', 'Shopping', 'Transfer', 'General'].map(cat => {
                 const amount = modalMetrics.validTxs.filter(tx => tx.sender_account_id === accountId && tx.category === cat).reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
                 if (amount === 0) return null;
                 const pct = modalMetrics.outflow > 0 ? (amount / modalMetrics.outflow) * 100 : 0;
                 return (
                  <div key={cat} className="mb-3">
                    <div className="flex justify-between text-xs sm:text-sm mb-1 gap-2"><span className="font-bold text-gray-700 truncate">{cat}</span><span className="font-bold text-gray-800 shrink-0">${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="w-full bg-gray-100 h-2 rounded-full"><div className="bg-[#0071ce] h-full rounded-full" style={{ width: `${pct}%` }}></div></div>
                  </div>
                 )
              })}
              {modalMetrics.outflow === 0 && <p className="text-gray-500 text-xs sm:text-sm">No spending data available for this timeframe.</p>}
            </div>

            <button onClick={() => setActiveModal('none')} className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded transition focus:outline-none text-sm sm:text-base">
              Close Insights
            </button>
          </div>
        </div>
      )}

      {activeModal === 'wire' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 md:p-8 animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto border-t-8 border-[#004879]">
            <form onSubmit={(e) => handleExternalTransfer(e, 'wire')}>
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="min-w-0 pr-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#004879]">Wire Transfer</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Domestic & International Routing</p>
                </div>
                <button type="button" onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none shrink-0">✕</button>
              </div>

              {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded mb-6 font-bold text-xs sm:text-sm border border-red-200">{errorMsg}</div>}
              
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">1. Recipient Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recipient Name / Business</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white text-sm" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recipient Address (Optional)</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white text-sm" placeholder="123 Main St, City, Country" />
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">2. Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                  <input type="text" required className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white text-sm" placeholder="e.g. Standard Chartered" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number / IBAN</label>
                  <input type="text" required value={receiverId} onChange={(e) => setReceiverId(e.target.value)} className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white font-mono text-sm" placeholder="Account UUID or IBAN" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Routing Number / SWIFT</label>
                  <input type="text" required className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white font-mono text-sm" placeholder="9-digit Routing or 8-11 char SWIFT" />
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">3. Transfer Amount</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-full sm:w-1/2 relative">
                    <span className="absolute left-4 top-3 text-gray-700 font-bold text-xl">$</span>
                    <input type="number" step="0.01" required value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full border border-gray-300 rounded pl-10 pr-4 py-3 font-mono text-xl focus:outline-none focus:ring-2 focus:ring-[#0071ce] text-gray-900 bg-white" placeholder="0.00" />
                  </div>
                  <div className="w-full sm:w-1/2 text-sm text-gray-600 bg-white p-3 rounded border border-gray-200 shadow-sm">
                    <div className="flex justify-between mb-1"><span>Transfer Amount:</span> <span className="font-bold text-gray-800">${parseFloat(transferAmount || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between mb-1"><span>Wire Fee:</span> <span className="font-bold text-gray-800">$30.00</span></div>
                    <div className="flex justify-between border-t mt-2 pt-2 text-[#004879] font-bold"><span>Total Deduction:</span> <span>${(parseFloat(transferAmount || 0) + 30).toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setActiveModal('none')} className="text-gray-500 font-bold hover:text-gray-800 focus:outline-none disabled:opacity-50 px-4 py-3" disabled={isTransferring}>Cancel</button>
                <button type="submit" disabled={isTransferring} className="bg-[#0071ce] hover:bg-[#005a8f] text-white px-8 py-3 rounded-lg font-bold transition shadow-md focus:outline-none disabled:opacity-50">
                  {isTransferring ? 'Processing...' : 'Authorize Wire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'transfer' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200 border-t-8 border-[#0071ce]">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 truncate">Transfer Funds</h2>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 truncate">Move Money Between Accounts</label>
            <select className="w-full border border-gray-300 rounded px-3 py-3 mb-6 text-gray-900 bg-white text-sm sm:text-base truncate" value={transferDirection} onChange={(e) => setTransferDirection(e.target.value)}>
              <optgroup label="Checking & Savings">
                <option value="c2s">360 Checking (...{accountNumber})  →  360 Savings</option>
                <option value="s2c">360 Savings (...{savingsAccountNumber})  →  360 Checking</option>
              </optgroup>
              {creditAccounts.length > 0 && (
                <optgroup label="Credit Cards (Cash Advance)">
                  {creditAccounts.map(c => (
                    <option key={c.id} value={`cc-${c.id}`}>{c.card_name} (...{c.card_number.slice(-4)})  →  360 Savings</option>
                  ))}
                </optgroup>
              )}
            </select>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 truncate">Amount</label>
            <div className="relative mb-8">
              <span className="absolute left-4 top-3 text-gray-700 font-bold">$</span>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded pl-8 pr-4 py-3 font-mono text-gray-900 bg-white text-sm sm:text-base" placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
            </div>
            
            {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded mb-6 font-bold text-xs sm:text-sm border border-red-200">{errorMsg}</div>}

            <div className="flex justify-end space-x-4">
              <button onClick={() => setActiveModal('none')} className="text-gray-500 font-bold disabled:opacity-50 shrink-0 text-sm sm:text-base" disabled={isTransferring}>Cancel</button>
              <button onClick={executeInternalTransfer} disabled={isTransferring} className="bg-[#0071ce] hover:bg-[#005a8f] text-white px-6 py-2 rounded font-bold transition disabled:opacity-50 truncate text-sm sm:text-base">
                {isTransferring ? 'Processing...' : 'Transfer Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'zelle' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in duration-200 overflow-hidden border border-gray-100">
            <div className="bg-[#7413dc] p-6 text-white text-center">
              <h2 className="text-3xl font-extrabold italic tracking-tighter">Zelle<span className="text-sm align-top">®</span></h2>
              <p className="text-sm text-purple-200 mt-1">Fast, safe and easy way to send money.</p>
            </div>
            <form onSubmit={(e) => handleExternalTransfer(e, 'zelle')} className="p-6">
              {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 font-bold text-xs sm:text-sm border border-red-200">{errorMsg}</div>}
              
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Send To</label>
                <input type="text" required value={receiverId} onChange={(e) => setReceiverId(e.target.value)} placeholder="Email, US mobile number, or Zelle® tag" className="w-full border-b-2 border-gray-200 px-2 py-3 focus:outline-none focus:border-[#7413dc] text-gray-900 bg-white text-base transition-colors" />
              </div>
              
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-gray-400 font-bold text-xl">$</span>
                  <input type="number" step="0.01" required value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="0.00" className="w-full border-b-2 border-gray-200 pl-8 pr-4 py-2 font-mono text-2xl focus:outline-none focus:border-[#7413dc] text-gray-900 bg-white transition-colors" />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">What's this for?</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a memo (optional)" className="w-full border-b-2 border-gray-200 px-2 py-3 focus:outline-none focus:border-[#7413dc] text-gray-900 bg-white text-sm transition-colors" />
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-100">
                 <p className="text-[11px] text-gray-600 leading-relaxed text-center"><strong className="text-[#7413dc]">Money moves fast.</strong> Only send money to people you know and trust. Transfers cannot be cancelled.</p>
              </div>

              <div className="flex space-x-3">
                <button type="button" onClick={() => setActiveModal('none')} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition focus:outline-none disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isTransferring} className="w-2/3 bg-[#7413dc] hover:bg-[#5b0ea8] text-white font-bold py-3 rounded-xl transition shadow-md focus:outline-none disabled:opacity-50">
                  {isTransferring ? 'Sending...' : 'Review & Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'lock' && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200 border-t-8 border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate pr-2">Manage Card Security</h2>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black focus:outline-none shrink-0">✕</button>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-8 line-clamp-2 sm:line-clamp-none">Misplaced your card? Lock it instantly to prevent unauthorized transactions.</p>
            <div className="flex justify-between items-center p-4 rounded-lg mb-4 bg-gray-50 gap-4">
              <div className="min-w-0">
                <div className="font-bold text-sm sm:text-base text-gray-800 truncate">360 Debit Card</div>
                <div className="text-[10px] sm:text-xs text-gray-500 truncate">Ending in ...{accountNumber}</div>
              </div>
              <button onClick={() => setIsDebitLocked(!isDebitLocked)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${isDebitLocked ? 'bg-red-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDebitLocked ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {creditAccounts.map(credit => (
              <div key={credit.id} className="flex justify-between items-center p-4 rounded-lg mb-4 bg-gray-50 gap-4">
                <div className="min-w-0">
                  <div className="font-bold text-sm sm:text-base text-gray-800 truncate">{credit.card_name}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">Ending in ...{credit.card_number.slice(-4)}</div>
                </div>
                <button onClick={() => setIsCreditLocked(!isCreditLocked)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${isCreditLocked ? 'bg-red-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCreditLocked ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
            <button onClick={() => {
              setActiveModal('none');
              setNotification({ isOpen: true, type: 'success', title: 'Cards Secured', message: 'Your card security preferences have been successfully updated.' });
            }} className="w-full mt-4 bg-[#004879] hover:bg-[#003456] text-white font-bold py-3 rounded transition shadow-sm focus:outline-none text-sm sm:text-base truncate">
              Save Security Settings
            </button>
          </div>
        </div>
      )}

      {/* --- OFFICIAL CAPITAL ONE PAPER STATEMENT (A4 Document View) --- */}
      {activeModal === 'statement' && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-start justify-center p-4 sm:p-8 backdrop-blur-sm overflow-y-auto print:bg-white print:p-0">
          
          <div className="bg-white shadow-2xl w-full max-w-[850px] my-auto animate-in zoom-in-95 duration-200 print:shadow-none print:m-0 print:w-full">
            
            {/* Action Bar (Hidden on Print) */}
            <div className="bg-gray-100 p-4 flex justify-between items-center border-b border-gray-200 print:hidden sticky top-0 z-10">
              <h2 className="font-bold text-gray-700">Document Viewer</h2>
              <div className="space-x-3">
                <button onClick={() => setActiveModal('none')} className="text-gray-500 hover:text-gray-800 font-bold text-sm">Close</button>
                <button onClick={() => window.print()} className="bg-[#004879] hover:bg-[#003456] text-white px-4 py-2 rounded shadow text-sm font-bold">Print / Download PDF</button>
              </div>
            </div>

            {/* Statement Content (A4 style) */}
            <div className="p-8 sm:p-12 bg-white text-gray-900 font-sans text-xs">
              
              {/* Header / Logo */}
              <div className="mb-8">
                <Image src="/capitalone-com-wordmark.png" alt="Capital One" width={220} height={70} className="object-contain" priority />
              </div>

              {/* Meta Block */}
              <div className="grid grid-cols-[140px_1fr] gap-y-1 mb-8 font-bold text-[11px] sm:text-xs text-gray-800">
                <div>Account branch:</div>
                <div className="font-normal">{legalName}</div>
                
                <div>Account address:</div>
                <div className="font-normal">{address}</div>
                
                <div>Account Number:</div>
                <div className="font-normal">{accountNumber.padStart(12, 'x')}</div>
                
                <div>Statement Date:</div>
                <div className="font-normal">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px] sm:text-xs">
                  <thead>
                    <tr className="bg-[#004879] text-white">
                      <th className="py-2 pl-2 font-semibold whitespace-nowrap">Date</th>
                      <th className="py-2 font-semibold">Transaction Description</th>
                      <th className="py-2 font-semibold text-right">Debit</th>
                      <th className="py-2 font-semibold text-right">Credit</th>
                      <th className="py-2 pr-2 font-semibold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    
                    {/* Balance Brought Forward Row */}
                    <tr className="bg-white break-inside-avoid">
                      <td className="py-2 pl-2 text-gray-500 whitespace-nowrap">
                        {/* Fallback to exactly 1 month prior to today if no old transactions exist */}
                        {statementTxs.length > 0 
                          ? formatStatementDate(new Date(statementTxs[0].created_at).setDate(new Date(statementTxs[0].created_at).getDate() - 1))
                          : formatStatementDate(new Date(new Date().setMonth(new Date().getMonth() - 1)))
                        }
                      </td>
                      <td className="py-2 text-gray-800 font-bold">Balance B/F</td>
                      <td className="py-2 text-right"></td>
                      <td className="py-2 text-right"></td>
                      <td className="py-2 pr-2 text-right text-gray-800 font-mono font-bold">
                        {statementStartBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Dynamic Transactions Loop with Running Balances */}
                    {statementTxs.length === 0 && (
                      <tr><td colSpan="5" className="py-6 text-center text-gray-500 italic">No transactions in this statement period.</td></tr>
                    )}
                    {statementTxs.map((tx) => {
                      const rawAmt = Number(tx.amount);
                      const isDeposit = tx.receiver_account_id === accountId || tx.type === 'deposit';
                      
                      // Calculate row balance
                      if (isDeposit) runningBal += rawAmt;
                      else runningBal -= rawAmt;

                      return (
                        <tr key={tx.id} className="hover:bg-gray-50 break-inside-avoid">
                          <td className="py-2 pl-2 text-gray-600 font-mono whitespace-nowrap">{formatStatementDate(tx.created_at)}</td>
                          <td className="py-2 pr-4">
                            <div className="font-bold text-gray-800 capitalize leading-tight">{tx.description || tx.type}</div>
                            <div className="text-[9px] text-gray-500 uppercase tracking-wider">{tx.status} | REF: {tx.id.split('-')[0].toUpperCase()}</div>
                          </td>
                          <td className="py-2 text-right font-mono text-gray-800 whitespace-nowrap">
                            {!isDeposit ? rawAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                          </td>
                          <td className="py-2 text-right font-mono text-gray-800 whitespace-nowrap">
                            {isDeposit ? rawAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                          </td>
                          <td className="py-2 pr-2 text-right font-mono font-bold text-[#004879] whitespace-nowrap">
                            {runningBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Balance Carried Forward Row */}
                    <tr className="bg-white break-inside-avoid">
                      <td className="py-2 pl-2 text-gray-500 whitespace-nowrap">{formatStatementDate(new Date())}</td>
                      <td className="py-2 text-gray-800 font-bold">Balance C/F</td>
                      <td className="py-2 text-right font-mono text-gray-800 font-bold border-t border-gray-300">
                        {totalOutflow > 0 ? totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="py-2 text-right font-mono text-gray-800 font-bold border-t border-gray-300">
                        {totalInflow > 0 ? totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="py-2 pr-2 text-right font-mono font-bold text-[#004879] border-t border-[#004879]">
                        {Number(checkingBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Summary Block */}
              <div className="mt-12 flex flex-col md:flex-row gap-6 md:gap-10 text-[10px] sm:text-xs">
                <div className="font-bold text-gray-800 w-24 shrink-0">Transaction<br/>Summary</div>
                
                <div className="flex-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  <div className="font-bold text-gray-700">Total Debits</div><div className="text-right text-gray-800 font-mono">{totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="font-bold text-gray-700">Total Credits</div><div className="text-right text-gray-800 font-mono">{totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="font-bold text-gray-700">Total Financing</div><div className="text-right text-gray-800 font-mono">750,000.00</div>
                  <div className="font-bold text-gray-700">Total Balance</div><div className="text-right text-gray-800 font-mono">{Number(checkingBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>

                <div className="flex-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  <div className="font-bold text-gray-700">Interest Charged</div><div className="text-right text-gray-800 font-mono">9,463.74</div>
                  <div className="font-bold text-gray-700">Advance Payment</div><div className="text-right text-gray-800 font-mono">0.00</div>
                  <div className="font-bold text-gray-700">Redraw Available</div><div className="text-right text-gray-800 font-mono">1,000.00</div>
                </div>

                <div className="flex-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  <div className="font-bold text-gray-700">Amount in Arrears</div><div className="text-right text-gray-800 font-mono">0.00</div>
                  <div className="font-bold text-gray-700">Charges in Arrears</div><div className="text-right text-gray-800 font-mono">1.59</div>
                  <div className="font-bold text-gray-700">Accrued Interest</div><div className="text-right text-gray-800 font-mono">0.00</div>
                </div>
              </div>

              {/* Legal Disclosures */}
              <div className="mt-16 text-center text-[9px] text-gray-400 border-t border-gray-200 pt-6">
                <p>Member FDIC. Equal Housing Lender. © {new Date().getFullYear()} Capital One.</p>
                <p>To report a lost or stolen card, or for general inquiries, please call 1-800-655-5666.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM NOTIFICATION POPUP --- */}
      {notification.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200 border-t-8 ${notification.type === 'success' ? 'border-emerald-500' : 'border-[#dd0031]'}`}>
            
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-[#dd0031]'}`}>
              {notification.type === 'success' ? (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              )}
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">{notification.title}</h3>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed px-2">{notification.message}</p>
            
            <button 
              onClick={() => setNotification({ ...notification, isOpen: false })} 
              className={`w-full font-bold py-3.5 px-4 rounded-xl text-sm transition-all focus:outline-none shadow-md hover:shadow-lg ${notification.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-900 hover:bg-black text-white'}`}
            >
              Done
            </button>
          </div>
        </div>
      )}

    </>
  );
}
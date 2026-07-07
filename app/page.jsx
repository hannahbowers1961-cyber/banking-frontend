"use client";

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase'; // Imports your new database connection

export default function LoginPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState(''); // Note: Supabase uses email by default, so we will pass this as the email
  const [password, setPassword] = useState('');
  
  const [errors, setErrors] = useState({ username: false, password: false });
  const [serverError, setServerError] = useState(''); // Holds real database errors
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle the real login button click
  const handleSignIn = async (e) => {
    e.preventDefault();
    setServerError(''); // Clear old errors
    
    // 1. Check for empty fields first
    const newErrors = {
      username: username.trim() === '',
      password: password.trim() === ''
    };
    setErrors(newErrors);

    // 2. If fields are filled, talk to Supabase
    if (!newErrors.username && !newErrors.password) {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: username, // Treating the "Username" input as an Email
        password: password,
      });

      if (error) {
        // If Supabase rejects them, show the error and stop loading
        setServerError('Invalid username or password.');
        setIsLoading(false);
      } else {
        // Success! Route the user to their dashboard
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-12 px-4 font-sans text-gray-800">
      
      {/* MAIN LOGIN CARD */}
      <div className="w-full max-w-[420px] border border-gray-200 rounded p-8 shadow-sm relative">
        
        {/* Logo */}
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

        <h1 className="text-center text-[22px] text-gray-900 mb-6 tracking-wide">Sign In</h1>

        {/* --- REAL DATABASE ERROR MESSAGE --- */}
        {serverError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-[#c60f13] text-sm rounded flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            {serverError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="flex flex-col space-y-5">
          
          {/* Username Input */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Username / Email</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: false });
                }}
                className={`w-full pl-10 pr-4 py-2.5 rounded border focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                  errors.username ? 'border-[#c60f13]' : 'border-gray-400'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.username && <p className="text-[#c60f13] text-xs mt-1">This field is required.</p>}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Password</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: false });
                }}
                className={`w-full pl-10 pr-10 py-2.5 rounded border focus:outline-none focus:ring-1 focus:ring-gray-400 font-sans ${
                  errors.password ? 'border-[#c60f13]' : 'border-gray-400'
                }`}
                disabled={isLoading}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-700 hover:text-black focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            {errors.password && <p className="text-[#c60f13] text-xs mt-1">This field is required.</p>}
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-1">
            <input type="checkbox" id="remember" className="w-5 h-5 border-gray-400 rounded text-[#00619b] focus:ring-0 cursor-pointer" />
            <label htmlFor="remember" className="ml-2 text-[15px] text-gray-900 cursor-pointer">Remember Me</label>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full bg-[#0071ce] hover:bg-[#005a8f] text-white font-bold py-3 rounded text-[15px] transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
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

      </div>

      <div className="mt-8 text-center flex flex-col items-center">
        <p className="text-[15px] text-gray-900 mb-3">Looking for these accounts?</p>
        <a href="#" className="text-[#00619b] text-[15px] font-bold hover:underline">Commercial or Trade Credit</a>
      </div>

    </div>
  );
}
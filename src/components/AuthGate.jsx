import React, { useState } from 'react';
import { signIn, signUp, resendSignupEmail } from '../services/account.js';
import './auth.css';

export default function AuthGate({ onAuthenticated }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const session = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
      if (session) onAuthenticated(session);
      else setVerificationPending(true);
    } catch (err) { setError(err?.message || 'Authentication failed.'); }
    finally { setBusy(false); }
  }

  async function resend() {
    setResending(true); setError(''); setMessage('');
    try { await resendSignupEmail(email); setMessage('Verification email sent again. Check your inbox and spam folder.'); }
    catch (err) { setError(err?.message || 'Could not resend the verification email.'); }
    finally { setResending(false); }
  }

  if (verificationPending) return <div className="authGate"><div className="authCard verificationCard">
    <div className="sideBrand"><span className="mark">OT</span><span>Oman Tender<br/><b>Intelligence</b></span></div>
    <span className="eyebrow">EMAIL VERIFICATION</span>
    <h1>Check your inbox</h1>
    <p>We sent a verification link to <strong>{email}</strong>. Verify your email before signing in.</p>
    {error && <div className="sourceNotice">{error}</div>}{message && <div className="sourceNotice">{message}</div>}
    <button className="primary big" disabled={resending} onClick={resend}>{resending ? 'Sending…' : 'Resend verification email'}</button>
    <button className="textBtn authSwitch" onClick={()=>{setVerificationPending(false);setMode('signin');setError('');setMessage('')}}>Back to sign in</button>
  </div></div>;

  return <div className="authGate"><div className="authCard">
    <div className="sideBrand"><span className="mark">OT</span><span>Oman Tender<br/><b>Intelligence</b></span></div>
    <span className="eyebrow">CUSTOMER ACCESS</span><h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
    <p>{mode === 'signin' ? 'Sign in to your tender intelligence workspace.' : 'Start building your personalized Oman tender pipeline.'}</p>
    <form onSubmit={submit}>
      <label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"/></label>
      <label>Password<input type="password" required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label>
      {error && <div className="sourceNotice">{error}</div>}{message && <div className="sourceNotice">{message}</div>}
      <button className="primary big" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in →' : 'Create account →'}</button>
    </form>
    <button className="textBtn authSwitch" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setError('');setMessage('')}}>{mode==='signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
  </div></div>;
}

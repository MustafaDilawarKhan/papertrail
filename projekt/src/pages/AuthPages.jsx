import React, { useState } from 'react'
import { AuthShell } from '../layouts/Shells'
import { Icon, Link } from '../components/core'

export function LoginPage() {
  return (
    <AuthShell>
      <h1>Welcome back.</h1>
      <p>Sign in to continue your research.</p>
      <form className="stack">
        <input placeholder="mustafa@example.com" />
        <input type="password" placeholder="Password" />
        <Link to="/dashboard" className="btn btn-dark btn-full">Sign In</Link>
        <div className="form-links"><Link to="/register">Create account</Link> · <Link to="/forgot-password">Forgot password?</Link></div>
      </form>
    </AuthShell>
  )
}

export function RegisterPage() {
  const [password, setPassword] = useState('')
  const score = Math.min(4, Math.floor(password.length / 3))
  const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong']
  return (
    <AuthShell>
      <h1>Create your account.</h1>
      <p>Free for academic use. No credit card.</p>
      <form className="stack">
        <div className="split-2">
          <input placeholder="First name" />
          <input placeholder="Last name" />
        </div>
        <input placeholder="Institutional email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
        <div className="strength"><span className={`bar s-${score}`} /> <small>{labels[score]}</small></div>
        <label className="check"><input type="checkbox" /> I agree to the Terms and Privacy Policy.</label>
        <Link to="/verify-email" className="btn btn-dark btn-full">Create Account</Link>
        <div className="form-links"><Link to="/login">Already have an account?</Link></div>
      </form>
    </AuthShell>
  )
}

export function VerifyPage() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  return (
    <AuthShell>
      <div className="auth-icon"><Icon name="mark_email_read" filled size={34} /></div>
      <h1>Check your inbox.</h1>
      <p>We sent a verification link to ahmed@example.com.</p>
      <div className="code-grid">
        {code.map((cell, index) => <input key={index} value={cell} onChange={(e) => { const next = [...code]; next[index] = e.target.value.slice(-1); setCode(next) }} maxLength={1} />)}
      </div>
      <Link to="/dashboard" className="btn btn-dark btn-full">Go to Dashboard</Link>
      <div className="form-links"><Link to="/login">Already verified? Sign in</Link></div>
    </AuthShell>
  )
}

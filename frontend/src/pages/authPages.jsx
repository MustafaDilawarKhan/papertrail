// Auth, Upload, Upgrade, Settings pages
import React, { useState, useEffect, useRef } from 'react';
import { Link, Icon, Brand, AppShell, navigate } from '../shared/components';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../apiConfig';

const useStateAux = useState;
const useEffectAux = useEffect;
const useRefP1 = useRef;

// =================== AUTH SHELL ===================
function AuthShell({ children, side = "right" }) {
  // Hardcoded background + text colour so the auth pages stay legible when
  // the user has toggled dark mode on the landing page. Without this, the
  // form panel inherits `color: #f1ebda` (the dark-mode body colour) which
  // makes the cream-on-white labels effectively invisible. The marketing
  // AuthVisual on the side stays dark by design — that's intentional.
  return (
    <div
      className="auth-shell min-h-screen flex"
      style={{ background: "#F5F5F7", color: "#1c1b1b" }}
    >
      {side === "left" && <AuthVisual />}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Brand to="/" />
          <div className="mt-12">{children}</div>
        </div>
      </div>
      {side === "right" && <AuthVisual />}
    </div>
  );
}
function AuthVisual() {
  // Hardcoded #15130f bg + #faf6ec text so the panel stays a coherent
  // dark-on-cream regardless of which theme the landing page is in.
  return (
    <div
      className="auth-visual hidden lg:flex flex-1 p-12 flex-col justify-between relative overflow-hidden"
      style={{ background: "#15130f", color: "#faf6ec" }}
    >
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}></div>
      <div className="relative">
        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#faf6ec", opacity: 0.7 }}>For Researchers</span>
      </div>
      <div className="relative max-w-md">
        <h2 className="font-hero-headline text-hero-headline mb-6" style={{ color: "#faf6ec" }}>Anchor every claim to a verifiable source.</h2>
        <p className="text-body-main leading-relaxed" style={{ color: "#faf6ec", opacity: 0.8 }}>Paper Trail is the deliberate research workspace. We don't manufacture answers — we help you reason through them, with citations on every line.</p>
        <div className="mt-12 flex items-center gap-3 text-xs">
          <div className="flex -space-x-2">
            {["RM","SK","AT"].map((i, k) => <div key={k} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "rgba(255,255,255,0.2)", border: "2px solid #15130f", color: "#faf6ec" }}>{i}</div>)}
          </div>
          <span style={{ color: "#faf6ec", opacity: 0.7 }}>Joined by researchers from Stanford, MIT, and 200+ institutions.</span>
        </div>
      </div>
    </div>
  );
}

// =================== LOGIN ===================
function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useStateAux("");
  const [pw, setPw] = useStateAux("");
  const [show, setShow] = useStateAux(false);
  const [error, setError] = useStateAux("");
  const [loading, setLoading] = useStateAux(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email, password: pw }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password.");
      }

      // Store the token, then send the user back to whatever they were
      // trying to open before the auth gate intercepted them. Falls back
      // to /dashboard for fresh logins.
      await login(data.access_token);
      let intended = "/dashboard";
      try {
        const saved = sessionStorage.getItem("pt.intendedRoute");
        if (saved && !saved.startsWith("/login") && !saved.startsWith("/register") && !saved.startsWith("/verify")) {
          intended = saved;
        }
        sessionStorage.removeItem("pt.intendedRoute");
      } catch { /* ignore */ }
      navigate(intended);
    } catch (err) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="font-section-heading text-section-heading text-primary mb-2">Welcome back.</h1>
      <p className="text-on-surface-variant mb-10">Sign in to continue your research.</p>
      <form onSubmit={handleLogin} className="space-y-5">
        <button type="button" className="w-full flex items-center justify-center gap-3 border border-border-subtle py-3 rounded-lg font-bold text-sm hover:bg-surface-container-low">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
          <div className="flex-1 h-px bg-border-subtle"></div><span>or</span><div className="flex-1 h-px bg-border-subtle"></div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-error-container text-on-error-container rounded-lg text-xs">
            <Icon name="error" size={16} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold mb-1.5 block">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-border-subtle bg-white px-3.5 py-2.5 rounded-lg text-body-main outline-none focus:border-primary" />
        </div>
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-xs font-bold">Password</label>
            <a href="#/forgot" className="text-xs text-primary hover:underline font-semibold">Forgot?</a>
          </div>
          <div className="relative">
            <input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" className="w-full border border-border-subtle bg-white px-3.5 py-2.5 pr-10 rounded-lg text-body-main outline-none focus:border-primary" />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><Icon name={show ? "visibility_off" : "visibility"} size={18} /></button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="block w-full bg-primary text-on-primary py-3 rounded-lg text-sm font-bold text-center hover:opacity-90 disabled:opacity-60 transition-opacity">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Signing in...
            </span>
          ) : "Sign In"}
        </button>
        <p className="text-center text-xs text-on-surface-variant">No account? <Link to="/register" className="text-primary font-bold hover:underline">Create one</Link></p>
      </form>
    </AuthShell>
  );
}

// =================== REGISTER ===================
function RegisterPage() {
  const { login } = useAuth();
  const [firstName, setFirstName] = useStateAux("");
  const [lastName, setLastName] = useStateAux("");
  const [email, setEmail] = useStateAux("");
  const [pw, setPw] = useStateAux("");
  const [error, setError] = useStateAux("");
  const [loading, setLoading] = useStateAux(false);

  const score = Math.min(4, Math.floor(pw.length / 3));
  const labels = ["Too short", "Weak", "Okay", "Good", "Strong"];
  const colors = ["bg-error", "bg-error", "bg-yellow-500", "bg-green-500", "bg-green-600"];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: `${firstName} ${lastName}`.trim(), 
          email: email, 
          password: pw 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      // Store the token and redirect to dashboard
      await login(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell side="left">
      <h1 className="font-section-heading text-section-heading text-primary mb-2">Create your account.</h1>
      <p className="text-on-surface-variant mb-10">Free for academic use. No credit card.</p>
      <form onSubmit={handleRegister} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-error-container text-on-error-container rounded-lg text-xs">
            <Icon name="error" size={16} />
            <span>{error}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-bold mb-1.5 block">First name</label><input required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border border-border-subtle px-3.5 py-2.5 rounded-lg outline-none focus:border-primary" /></div>
          <div><label className="text-xs font-bold mb-1.5 block">Last name</label><input required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border border-border-subtle px-3.5 py-2.5 rounded-lg outline-none focus:border-primary" /></div>
        </div>
        <div><label className="text-xs font-bold mb-1.5 block">Institutional email</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-border-subtle px-3.5 py-2.5 rounded-lg outline-none focus:border-primary" /></div>
        <div>
          <label className="text-xs font-bold mb-1.5 block">Password</label>
          <input required type="password" value={pw} onChange={e => setPw(e.target.value)} className="w-full border border-border-subtle px-3.5 py-2.5 rounded-lg outline-none focus:border-primary" />
          {pw.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[0,1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded ${i < score ? colors[score] : "bg-surface-container-high"}`}></div>)}
              </div>
              <span className="text-[10px] text-on-surface-variant font-bold">{labels[score]}</span>
            </div>
          )}
        </div>
        <label className="flex items-start gap-2 text-xs text-on-surface-variant">
          <input type="checkbox" required className="mt-0.5" /> <span>I agree to the <a className="text-primary font-bold">Terms</a> and <a className="text-primary font-bold">Privacy Policy</a>.</span>
        </label>
        <button type="submit" disabled={loading} className="block w-full bg-primary text-on-primary py-3 rounded-lg text-sm font-bold text-center hover:opacity-90 disabled:opacity-60 transition-opacity">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Creating Account...
            </span>
          ) : "Create Account"}
        </button>
        <p className="text-center text-xs text-on-surface-variant">Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}

// =================== VERIFY ===================
function VerifyPage() {
  const [code, setCode] = useStateAux(["", "", "", "", "", ""]);
  const inputs = useRefP1([]);
  const onChange = (i, v) => {
    const next = [...code]; next[i] = v.slice(-1); setCode(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };
  return (
    <AuthShell>
      <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center mb-6">
        <Icon name="mark_email_read" filled className="text-primary" size={32} />
      </div>
      <h1 className="font-section-heading text-section-heading text-primary mb-2">Verify your email.</h1>
      <p className="text-on-surface-variant mb-8">We sent a 6-digit code to <span className="font-bold text-primary">m***fa@example.com</span>.</p>
      <div className="flex gap-2 mb-6">
        {code.map((c, i) => (
          <input key={i} ref={el => inputs.current[i] = el} value={c} onChange={e => onChange(i, e.target.value)} className="w-12 h-14 text-center border-2 border-border-subtle rounded-lg text-2xl font-bold outline-none focus:border-primary" maxLength={1} />
        ))}
      </div>
      <Link to="/dashboard" className="block w-full bg-primary text-on-primary py-3 rounded-lg text-sm font-bold text-center hover:opacity-90 mb-3">Verify &amp; Continue</Link>
      <p className="text-center text-xs text-on-surface-variant">Didn't receive it? <button className="text-primary font-bold hover:underline">Resend in 0:42</button></p>
    </AuthShell>
  );
}

// =================== UPLOAD MODAL (page) ===================


// =================== UPGRADE ===================
function UpgradePage() {
  const [billing, setBilling] = useStateAux("yearly");
  const plans = [
    { name: "Free", price: { yearly: 0, monthly: 0 }, desc: "Get started with the essentials.", features: ["50 documents", "100 AI queries / month", "1 workspace", "Community support"], cta: "Current Plan", current: true },
    { name: "Pro", price: { yearly: 14, monthly: 18 }, desc: "For active researchers.", features: ["Unlimited documents", "Unlimited AI queries", "10 workspaces", "BibTeX & Zotero export", "Priority models", "Email support"], cta: "Upgrade to Pro", featured: true },
    { name: "Lab", price: { yearly: 39, monthly: 49 }, desc: "For research groups.", features: ["Everything in Pro", "Unlimited workspaces", "Team admin & SSO", "Audit logs", "Dedicated support", "Custom data retention"], cta: "Talk to Sales" },
  ];

  return (
    <AppShell active="settings" breadcrumbs={[{ label: "Settings", to: "/settings" }, { label: "Plans" }]}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-section-heading text-section-heading text-primary mb-2">Pick the plan that fits your work.</h1>
          <p className="text-on-surface-variant">Cancel anytime. Academic discount available at checkout.</p>
          <div className="inline-flex bg-surface-container p-1 rounded-full mt-6">
            <button onClick={() => setBilling("yearly")} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${billing === "yearly" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant"}`}>Yearly <span className="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 ml-1 rounded">-22%</span></button>
            <button onClick={() => setBilling("monthly")} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${billing === "monthly" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant"}`}>Monthly</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p, i) => (
            <div key={i} className={`bg-white rounded-2xl border p-7 flex flex-col relative ${p.featured ? "border-primary shadow-lg" : "border-border-subtle"}`}>
              {p.featured && <span className="absolute -top-3 left-7 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}
              <h3 className="font-card-title text-card-title text-primary mb-1">{p.name}</h3>
              <p className="text-xs text-on-surface-variant mb-5">{p.desc}</p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-primary">${p.price[billing]}</span>
                <span className="text-xs text-on-surface-variant">/ user / month</span>
              </div>
              <ul className="space-y-2.5 mb-7 flex-grow">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs">
                    <Icon name="check" size={16} className="text-primary mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button disabled={p.current} className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${p.current ? "bg-surface-container-high text-on-surface-variant cursor-default" : p.featured ? "bg-primary text-white hover:opacity-90" : "border border-border-subtle hover:bg-surface-container-low text-primary"}`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-8">All plans include end-to-end encryption and zero retention on AI queries. <a className="text-primary font-bold hover:underline">Compare features →</a></p>
      </div>
    </AppShell>
  );
}

// =================== SETTINGS ===================
function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useStateAux("profile");
  
  // Profile state
  const [profileData, setProfileData] = useStateAux({
    firstName: user?.name ? user.name.split(' ')[0] : "",
    lastName: user?.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : "",
    affiliation: user?.affiliation || "",
    bio: user?.bio || ""
  });
  const [profileLoading, setProfileLoading] = useStateAux(false);
  const [profileMsg, setProfileMsg] = useStateAux({ type: "", text: "" });

  // Password state
  const [pwData, setPwData] = useStateAux({ current: "", new: "", confirm: "" });
  const [pwLoading, setPwLoading] = useStateAux(false);
  const [pwMsg, setPwMsg] = useStateAux({ type: "", text: "" });
  const [showPwForm, setShowPwForm] = useStateAux(false);

  useEffectAux(() => {
    if (user) {
      setProfileData({
        firstName: user.name ? user.name.split(' ')[0] : "",
        lastName: user.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : "",
        affiliation: user.affiliation || "",
        bio: user.bio || ""
      });
    }
  }, [user]);

  const tabs = [
    { id: "profile", label: "Profile", icon: "person" },
    { id: "account", label: "Account", icon: "key" },
    { id: "billing", label: "Billing", icon: "credit_card" },
    { id: "models", label: "AI Models", icon: "smart_toy" },
    { id: "notifications", label: "Notifications", icon: "notifications" },
    { id: "appearance", label: "Appearance", icon: "palette" },
  ];

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg({ type: "", text: "" });
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("aid_token")}`
        },
        body: JSON.stringify({
          name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          affiliation: profileData.affiliation,
          bio: profileData.bio
        }),
      });
      if (response.ok) {
        setProfileMsg({ type: "success", text: "Profile updated successfully!" });
        refreshUser();
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update profile.");
      }
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwData.new !== pwData.confirm) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    setPwLoading(true);
    setPwMsg({ type: "", text: "" });
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("aid_token")}`
        },
        body: JSON.stringify({
          current_password: pwData.current,
          new_password: pwData.new
        }),
      });
      if (response.ok) {
        setPwMsg({ type: "success", text: "Password changed successfully!" });
        setPwData({ current: "", new: "", confirm: "" });
        setTimeout(() => setShowPwForm(false), 2000);
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Failed to change password.");
      }
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  const handleThemeChange = async (theme) => {
    document.body.classList.toggle("theme-dark", theme === "dark");
    try {
      await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("aid_token")}`
        },
        body: JSON.stringify({ ui_theme: theme }),
      });
      refreshUser();
    } catch (err) {
      console.error("Failed to save theme:", err);
    }
  };

  const initials = getInitials(user?.name);
  const email = user?.email || "";

  return (
    <AppShell active="settings" breadcrumbs={[{ label: "Settings" }]}>
      <h1 className="font-section-heading text-section-heading text-primary mb-2">Settings</h1>
      <p className="text-on-surface-variant mb-8">Manage your account, models, and team preferences.</p>

      <div className="grid grid-cols-12 gap-8">
        <aside className="col-span-12 md:col-span-3">
          <nav className="flex md:flex-col gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${tab === t.id ? "bg-sidebar-active text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-low"}`}>
                <Icon name={t.icon} size={18} /> {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="col-span-12 md:col-span-9 bg-white rounded-2xl border border-border-subtle p-8">
          {tab === "profile" && (
            <div className="space-y-8">
              <div>
                <h3 className="font-card-title text-card-title mb-1">Profile</h3>
                <p className="text-xs text-on-surface-variant">How you appear to collaborators.</p>
              </div>
              {profileMsg.text && (
                <div className={`p-3 rounded-lg text-xs ${profileMsg.type === "success" ? "bg-green-100 text-green-800" : "bg-error-container text-on-error-container"}`}>
                  {profileMsg.text}
                </div>
              )}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold uppercase">{initials}</div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-lg border border-border-subtle text-xs font-bold hover:bg-surface-container-low">Upload</button>
                  <button className="px-3 py-2 rounded-lg text-xs font-bold text-error hover:bg-error-container">Remove</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold mb-1.5 block">First name</label><input value={profileData.firstName} onChange={e => setProfileData({...profileData, firstName: e.target.value})} className="w-full border border-border-subtle px-3.5 py-2.5 rounded-lg outline-none focus:border-primary" /></div>
                <div><label className="text-xs font-bold mb-1.5 block">Last name</label><input value={profileData.lastName} onChange={e => setProfileData({...profileData, lastName: e.target.value})} className="w-full border border-border-subtle px-3.5 py-2.5 rounded-lg outline-none focus:border-primary" /></div>
                <div className="col-span-2"><label className="text-xs font-bold mb-1.5 block">Email</label><input value={email} className="w-full border border-border-subtle px-3.5 py-2.5 rounded-lg outline-none focus:border-primary bg-surface-container-low" disabled /></div>
                <div className="col-span-2"><label className="text-xs font-bold mb-1.5 block">Affiliation</label><input value={profileData.affiliation} onChange={e => setProfileData({...profileData, affiliation: e.target.value})} placeholder="e.g. University of Example" className="w-full border border-border-subtle px-3.5 py-2.5 rounded-lg outline-none focus:border-primary" /></div>
                <div className="col-span-2"><label className="text-xs font-bold mb-1.5 block">Bio</label><textarea rows="3" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} placeholder="Tell us about your research..." className="w-full border border-border-subtle px-3.5 py-2.5 rounded-lg outline-none focus:border-primary resize-none"></textarea></div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
                <button onClick={() => refreshUser()} className="px-4 py-2 rounded-lg border border-border-subtle text-xs font-bold hover:bg-surface-container-low">Cancel</button>
                <button onClick={handleSaveProfile} disabled={profileLoading} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 disabled:opacity-50">
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
          {tab === "account" && (
            <div className="space-y-8">
              <div>
                <h3 className="font-card-title text-card-title mb-1">Security</h3>
                <p className="text-xs text-on-surface-variant">Keep your account secure.</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 border border-border-subtle rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div><p className="text-sm font-bold">Password</p><p className="text-xs text-on-surface-variant">Update your account password</p></div>
                    {!showPwForm && (
                      <button onClick={() => setShowPwForm(true)} className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-bold hover:bg-surface-container-low">Change</button>
                    )}
                  </div>
                  
                  {showPwForm && (
                    <form onSubmit={handleChangePassword} className="space-y-4 pt-4 border-t border-border-subtle animate-dropdown">
                      {pwMsg.text && (
                        <div className={`p-3 rounded-lg text-xs ${pwMsg.type === "success" ? "bg-green-100 text-green-800" : "bg-error-container text-on-error-container"}`}>
                          {pwMsg.text}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="text-[10px] font-bold uppercase block mb-1">Current</label><input type="password" required value={pwData.current} onChange={e => setPwData({...pwData, current: e.target.value})} className="w-full border border-border-subtle px-3 py-2 rounded text-xs outline-none focus:border-primary" /></div>
                        <div><label className="text-[10px] font-bold uppercase block mb-1">New</label><input type="password" required value={pwData.new} onChange={e => setPwData({...pwData, new: e.target.value})} className="w-full border border-border-subtle px-3 py-2 rounded text-xs outline-none focus:border-primary" /></div>
                        <div><label className="text-[10px] font-bold uppercase block mb-1">Confirm</label><input type="password" required value={pwData.confirm} onChange={e => setPwData({...pwData, confirm: e.target.value})} className="w-full border border-border-subtle px-3 py-2 rounded text-xs outline-none focus:border-primary" /></div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setShowPwForm(false)} className="px-3 py-1.5 rounded text-xs font-bold border border-border-subtle">Cancel</button>
                        <button type="submit" disabled={pwLoading} className="px-3 py-1.5 rounded text-xs font-bold bg-primary text-on-primary disabled:opacity-50">{pwLoading ? "Updating..." : "Update Password"}</button>
                      </div>
                    </form>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 border border-border-subtle rounded-lg">
                  <div><p className="text-sm font-bold">Two-factor authentication</p><p className="text-xs text-on-surface-variant">Add an extra layer of security at sign-in.</p></div>
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold">Enable</button>
                </div>
              </div>
              <div className="border-t border-border-subtle pt-6">
                <h4 className="text-sm font-bold text-error mb-1">Danger zone</h4>
                <p className="text-xs text-on-surface-variant mb-3">Permanently delete your account and all data.</p>
                <button className="px-4 py-2 rounded-lg border border-error text-error text-xs font-bold hover:bg-error-container">Delete Account</button>
              </div>
            </div>
          )}
          {tab === "billing" && (
            <div className="space-y-8">
              <div className="p-5 bg-secondary-container/40 border border-secondary-container rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-on-secondary-container">Current Plan</p>
                  <p className="text-card-title font-bold text-primary">Free</p>
                  <p className="text-xs text-on-surface-variant mt-1">100 / 100 AI queries used this month</p>
                </div>
                <Link to="/upgrade" className="bg-primary text-white px-5 py-2 rounded-full text-xs font-bold">Upgrade</Link>
              </div>
              <div>
                <h4 className="text-sm font-bold mb-3">Payment methods</h4>
                <div className="p-4 border border-dashed border-border-subtle rounded-lg text-center text-xs text-on-surface-variant">No payment method on file. Upgrade to add one.</div>
              </div>
              <div>
                <h4 className="text-sm font-bold mb-3">Invoices</h4>
                <p className="text-xs text-on-surface-variant">No invoices yet.</p>
              </div>
            </div>
          )}
          {tab === "models" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-card-title text-card-title mb-1">AI Model Preferences</h3>
                <p className="text-xs text-on-surface-variant">Choose which model handles your queries.</p>
              </div>
              {[
                { id: "balanced", name: "Paper Trail Balanced", desc: "Best general-purpose model. Recommended for most tasks.", default: true },
                { id: "rigor", name: "Paper Trail Rigor", desc: "Slower but more thorough. Higher citation accuracy.", premium: true },
                { id: "fast", name: "Paper Trail Fast", desc: "Quick responses for simple lookups." },
              ].map(m => (
                <label key={m.id} className="flex items-start gap-3 p-4 border border-border-subtle rounded-lg cursor-pointer hover:bg-surface-container-low">
                  <input type="radio" name="model" defaultChecked={m.default} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{m.name}</p>
                      {m.premium && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold">PRO</span>}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{m.desc}</p>
                  </div>
                </label>
              ))}
              <div className="p-4 bg-surface-container-low rounded-lg flex items-center justify-between">
                <div><p className="text-sm font-bold">Allow AI training on your data</p><p className="text-xs text-on-surface-variant">We never train on your library by default.</p></div>
                <Toggle />
              </div>
            </div>
          )}
          {tab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-card-title text-card-title mb-1">Email notifications</h3>
                <p className="text-xs text-on-surface-variant">Choose what arrives in your inbox.</p>
              </div>
              {[
                { name: "Workspace activity", desc: "When teammates comment, share, or annotate.", on: true },
                { name: "Weekly research digest", desc: "Summary of papers added across your collections.", on: true },
                { name: "Product updates", desc: "New features and changelogs.", on: false },
                { name: "Citation alerts", desc: "When a tracked paper is cited in a new preprint.", on: true },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border-subtle rounded-lg">
                  <div><p className="text-sm font-bold">{n.name}</p><p className="text-xs text-on-surface-variant">{n.desc}</p></div>
                  <Toggle defaultOn={n.on} />
                </div>
              ))}
            </div>
          )}
          {tab === "appearance" && (
            <div className="space-y-8">
              <div>
                <h3 className="font-card-title text-card-title mb-1">Appearance</h3>
                <p className="text-xs text-on-surface-variant">Customize your interface theme and layout.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "light", name: "Light Mode", icon: "light_mode", desc: "Clean and professional." },
                  { id: "dark", name: "Dark Mode", icon: "dark_mode", desc: "Easy on the eyes in low light." },
                ].map(t => {
                  const isActive = (user?.ui_theme || "light") === t.id;
                  return (
                    <button key={t.id} onClick={() => handleThemeChange(t.id)} className={`p-4 border rounded-xl text-left transition-all group ${isActive ? "border-primary bg-secondary-container/10 shadow-sm" : "border-border-subtle hover:border-primary"}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${isActive ? "bg-primary text-white" : "bg-surface-container text-primary group-hover:bg-primary group-hover:text-white"}`}>
                        <Icon name={t.icon} />
                      </div>
                      <p className="text-sm font-bold">{t.name}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
              <div className="pt-6 border-t border-border-subtle">
                 <h4 className="text-sm font-bold mb-3">Accent Color</h4>
                 <div className="flex gap-3">
                   {["#3a7d57", "#2a5b9e", "#cc6d3e", "#7c3aed", "#171513"].map(c => (
                     <button key={c} className="w-8 h-8 rounded-full ring-offset-2 hover:ring-2 ring-primary transition-all" style={{ backgroundColor: c }}></button>
                   ))}
                 </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Toggle({ defaultOn = false }) {
  const [on, setOn] = useStateAux(defaultOn);
  return (
    <button onClick={() => setOn(o => !o)} className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-surface-container-high"}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`}></span>
    </button>
  );
}

export { LoginPage, RegisterPage, VerifyPage, UpgradePage, SettingsPage, Toggle };

"use client";

import { FormEvent, useState } from "react";

import { useAuthStore } from "@/store/authStore";

export function AuthPanel() {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setMessage("Email and password required");
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      setMessage("Logged in successfully");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async () => {
    if (!email || !password || !fullName) {
      setMessage("All fields required");
      return;
    }
    setIsLoading(true);
    try {
      await register(email, password, fullName, "viewer");
      setMessage("Registered and logged in");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (token) {
    return (
      <section className="module authPanel authPanelActive">
        <div className="panelHeader">
          <h2>Access</h2>
          <span className="roleBadge">{role}</span>
        </div>
        <p className="panelLead">Session active and ready for protected workflows.</p>
        <button onClick={logout}>Logout</button>
      </section>
    );
  }

  return (
    <section className="module authPanel">
      <div className="panelHeader">
        <h2>Access</h2>
        <span className="roleBadge roleBadgeMuted">Sign in</span>
      </div>
      <p className="panelLead">Authenticate with your Supabase account to unlock finance, sales, and AI workflows.</p>
      <form onSubmit={onLogin} className="formGrid">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" disabled={isLoading} />
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" disabled={isLoading} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
        <div className="actions">
          <button type="submit">Login</button>
          <button type="button" onClick={onRegister}>Register</button>
        </div>
      </form>
      {message ? <p className="panelMessage">{message}</p> : null}
    </section>
  );
}

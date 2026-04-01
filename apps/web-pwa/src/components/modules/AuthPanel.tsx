"use client";

import { FormEvent, useState } from "react";

import { useAuthStore } from "@/store/authStore";

export function AuthPanel() {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);

  const [email, setEmail] = useState("admin@bdcr7.local");
  const [password, setPassword] = useState("StrongPass123");
  const [fullName, setFullName] = useState("Admin User");
  const [message, setMessage] = useState("");

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password);
      setMessage("Logged in");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const onRegister = async () => {
    try {
      await register(email, password, fullName, "admin");
      setMessage("Registered and logged in");
    } catch (error) {
      setMessage((error as Error).message);
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
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
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

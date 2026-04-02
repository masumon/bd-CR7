"use client";

import { useRouter } from "next/navigation";
import { Fingerprint, KeyRound, Mail, Phone, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

const authTabs = ["Google", "OTP", "FaceID"];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [tab, setTab] = useState("Google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const onEmailLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const onGoogle = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
    if (error) setMessage(error.message);
  };

  const sendOtp = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOtp({ phone: mobile });
    setMessage(error ? error.message : "OTP sent");
  };

  const verifyOtp = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.verifyOtp({ phone: mobile, token: otp, type: "sms" });
    if (error || !data.session || !data.user) {
      setMessage(error?.message || "OTP failed");
      return;
    }
    useAuthStore.setState({ token: data.session.access_token, userId: data.user.id, role: "worker" });
    router.push("/dashboard");
  };

  const onWebAuthn = async () => {
    if (!("credentials" in navigator)) {
      setMessage("WebAuthn not supported");
      return;
    }
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      await navigator.credentials.get({ publicKey: { challenge, timeout: 60000, userVerification: "required", allowCredentials: [] } });
      router.push("/dashboard");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-aura lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-border/60 lg:block">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover opacity-70"
          poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop"
        >
          <source src="https://cdn.coverr.co/videos/coverr-working-at-a-modern-office-1579/1080p.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/70 via-slate-900/30 to-transparent" />
        <div className="absolute bottom-10 left-10 max-w-md text-white">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Enterprise Security
          </p>
          <h1 className="text-3xl font-semibold leading-tight">BD CR7 ULTRA ENTERPRISE</h1>
          <p className="mt-3 text-sm text-slate-200">Secure command center for construction, finance, import operations, and retail workflows.</p>
        </div>
      </section>

      <section className="flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onEmailLogin} className="space-y-3">
              <label className="block text-xs text-muted-foreground">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input className="w-full bg-transparent text-sm outline-none" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <label className="block text-xs text-muted-foreground">Password</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <input className="w-full bg-transparent text-sm outline-none" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full">Sign in</Button>
            </form>

            <div className="space-y-3 border-t border-border pt-4">
              <Tabs tabs={authTabs} value={tab} onChange={setTab} />
              {tab === "Google" ? (
                <Button variant="outline" className="w-full" onClick={onGoogle}>Continue with Google</Button>
              ) : null}

              {tab === "OTP" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <input className="w-full bg-transparent text-sm outline-none" placeholder="+8801XXXXXXXXX" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={sendOtp}>Send OTP</Button>
                    <input className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <Button className="flex-1" onClick={verifyOtp}>Verify</Button>
                  </div>
                </div>
              ) : null}

              {tab === "FaceID" ? (
                <Button variant="outline" className="w-full" onClick={onWebAuthn}>
                  <Fingerprint className="mr-2 h-4 w-4" /> Use Face ID / Fingerprint
                </Button>
              ) : null}
            </div>
            {message ? <p className="text-xs text-rose-500">{message}</p> : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

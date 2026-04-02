"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Building2, Facebook, Fingerprint, Globe, KeyRound, Languages, Mail, MessageCircle, Moon, ShieldCheck, Sparkles, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

const authTabs = ["Google", "OTP", "FaceID"];
const socialLinks = [
  { href: "https://www.facebook.com/sumon.mumain", label: "Facebook", icon: Facebook },
  { href: "https://mumainsumon.netlify.app", label: "Website", icon: Globe },
  { href: "https://wa.me/8801825007977", label: "WhatsApp", icon: MessageCircle },
  { href: "mailto:m.a.sumon92@gmail.com", label: "Gmail", icon: Mail },
];

const copy = {
  en: {
    secureTag: "Secure Mobile-First PWA",
    heroTitle: "BD CR7 command center built for field teams, finance ops, and installed PWA use.",
    heroBody: "Every screen is tuned for phone, tablet, and standalone install mode so login, dashboard, and operational modules stay edge-to-edge without cropped headers, hidden buttons, or bottom overlap.",
    installReady: "Install-ready",
    coverage: "Coverage",
    access: "Access",
    highlights: "Operational Highlights",
    highlightsTitle: "One interface for online and offline work",
    highlightsNote: "Installed app mode keeps header, actions, and navigation visible on small devices.",
    fitLabel: "Fit-to-screen",
    fitValue: "Phone, tablet, install mode",
    welcome: "Welcome Back",
    loginTitle: "Login to BD CR7 Ultra Enterprise",
    noSeeded: "No default seeded Supabase Auth account exists in this project. Use Create account, OTP, Google, or Reset password.",
    fullName: "Full Name",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    resetPassword: "Reset password",
    createAccount: "Create account with this email",
    alternative: "Alternative Access",
    alternativeBody: "Use secure fallback methods when email sign-in is unavailable.",
    mobileNumber: "Mobile Number",
    sendOtp: "Send OTP",
    enterOtp: "Enter OTP",
    verify: "Verify",
    faceId: "Use Face ID / Fingerprint",
    developerBadge: "Lead Developer",
    developerName: "MUMAIN AHMED",
    developerRole: "Full-stack architect, UI systems designer, and deployment lead for BD CR7.",
    developerMeta: "Powered by SUMONIX AI | Solution by ABO ENTERPRISE",
    appearance: "Appearance",
    language: "Language",
    light: "Light",
    dark: "Dark",
    bangla: "বাংলা",
    english: "English",
    socials: "Official Channels",
    bullets: [
      "Login card remains fully visible inside short mobile viewports.",
      "Safe-area padding prevents clipping under Android and iPhone system bars.",
      "Drawer navigation and floating chat avoid bottom-nav overlap.",
      "Auth recovery is built in, so missing seeded users no longer dead-end the flow.",
    ],
  },
  bn: {
    secureTag: "নিরাপদ মোবাইল-ফার্স্ট PWA",
    heroTitle: "BD CR7 কমান্ড সেন্টার ফিল্ড টিম, ফাইন্যান্স অপস এবং ইনস্টল করা PWA ব্যবহারের জন্য তৈরি।",
    heroBody: "প্রতিটি স্ক্রিন ফোন, ট্যাবলেট এবং standalone install mode অনুযায়ী টিউন করা হয়েছে যাতে login, dashboard এবং operations module edge-to-edge ফিট থাকে।",
    installReady: "ইনস্টল-রেডি",
    coverage: "কভারেজ",
    access: "অ্যাক্সেস",
    highlights: "অপারেশনাল হাইলাইটস",
    highlightsTitle: "অনলাইন ও অফলাইন উভয়ের জন্য একটাই ইন্টারফেস",
    highlightsNote: "ইনস্টল করা app mode-এ ছোট ডিভাইসেও header, action এবং navigation দেখা যায়।",
    fitLabel: "ফিট-টু-স্ক্রিন",
    fitValue: "ফোন, ট্যাবলেট, ইনস্টল মোড",
    welcome: "স্বাগতম",
    loginTitle: "BD CR7 Ultra Enterprise-এ লগিন করুন",
    noSeeded: "এই project-এ কোনো default Supabase Auth account seed করা নেই। Create account, OTP, Google অথবা Reset password ব্যবহার করুন।",
    fullName: "পূর্ণ নাম",
    email: "ইমেইল",
    password: "পাসওয়ার্ড",
    signIn: "লগিন",
    resetPassword: "পাসওয়ার্ড রিসেট",
    createAccount: "এই ইমেইল দিয়ে একাউন্ট তৈরি করুন",
    alternative: "বিকল্প অ্যাক্সেস",
    alternativeBody: "ইমেইল sign-in unavailable হলে secure fallback method ব্যবহার করুন।",
    mobileNumber: "মোবাইল নম্বর",
    sendOtp: "OTP পাঠান",
    enterOtp: "OTP লিখুন",
    verify: "ভেরিফাই",
    faceId: "Face ID / Fingerprint ব্যবহার করুন",
    developerBadge: "Lead Developer",
    developerName: "MUMAIN AHMED",
    developerRole: "BD CR7-এর জন্য full-stack architect, UI systems designer এবং deployment lead।",
    developerMeta: "Powered by SUMONIX AI | Solution by ABO ENTERPRISE",
    appearance: "থিম",
    language: "ভাষা",
    light: "লাইট",
    dark: "ডার্ক",
    bangla: "বাংলা",
    english: "English",
    socials: "অফিশিয়াল চ্যানেল",
    bullets: [
      "ছোট mobile viewport-এও login card সম্পূর্ণ দেখা যায়।",
      "Android ও iPhone system bar-এর নিচে clipping ঠেকাতে safe-area padding দেওয়া হয়েছে।",
      "Drawer navigation ও floating chat bottom overlap এড়ায়।",
      "Auth recovery built-in হওয়ায় missing seeded user থাকলেও flow dead-end হয় না।",
    ],
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const [dark, setDark] = useState(false);
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [tab, setTab] = useState("Google");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("bdcr7-theme");
    const storedLanguage = window.localStorage.getItem("bdcr7-language");
    if (storedTheme === "dark") {
      setDark(true);
    } else if (storedTheme === "light") {
      setDark(false);
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    if (storedLanguage === "bn" || storedLanguage === "en") {
      setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("bdcr7-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    window.localStorage.setItem("bdcr7-language", language);
  }, [language]);

  const text = useMemo(() => copy[language], [language]);

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

  const onRegister = async () => {
    try {
      const name = fullName.trim() || email.split("@")[0] || "New User";
      await register(email, password, name, "worker");
      setMessage("Account created successfully. If email confirmation is enabled, confirm it first, then sign in.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const onResetPassword = async () => {
    if (!supabase) return;
    if (!email.trim()) {
      setMessage("Enter your email first, then use reset password.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setMessage(error ? error.message : "Password reset email sent.");
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
    <main className="relative min-h-[100svh] overflow-hidden bg-aura">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,108,90,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(201,127,58,0.12),transparent_24%)]" />
      <div className="relative mx-auto grid min-h-[100svh] w-full max-w-7xl gap-6 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <section className="flex flex-col justify-between gap-6 py-3 lg:py-8">
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-4 py-2 text-xs font-semibold text-primary shadow-soft dark:bg-slate-950/55">
              <ShieldCheck className="h-4 w-4" /> {text.secureTag}
            </motion.div>
            <div className="max-w-2xl space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                {text.heroTitle}
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                {text.heroBody}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: text.installReady, value: "PWA Standalone", icon: Sparkles },
                { label: text.coverage, value: "Finance + Site + POS", icon: Building2 },
                { label: text.access, value: "Password, OTP, Biometrics", icon: BadgeCheck },
              ].map(({ label, value, icon: Icon }) => (
                <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.4rem] p-4 shadow-soft">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.75rem] p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{text.highlights}</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">{text.highlightsTitle}</h2>
              </div>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
                {text.highlightsNote}
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {text.bullets.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white/55 p-4 text-sm text-muted-foreground dark:bg-slate-950/35">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="flex items-center justify-center py-2 lg:py-8">
          <Card className="w-full max-w-xl overflow-hidden border-white/55 bg-white/78 shadow-[0_28px_90px_rgba(23,33,28,0.14)] dark:bg-slate-950/58">
            <CardHeader className="space-y-4 border-b border-border/60 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{text.welcome}</p>
                  <CardTitle className="mt-2 text-2xl sm:text-[1.9rem]">{text.loginTitle}</CardTitle>
                </div>
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 text-right text-xs text-primary">
                  <div className="font-semibold">{text.fitLabel}</div>
                  <div>{text.fitValue}</div>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/75 p-2.5">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />} {text.appearance}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={dark ? "ghost" : "outline"} className="min-h-9" onClick={() => setDark(false)}>{text.light}</Button>
                    <Button type="button" variant={dark ? "outline" : "ghost"} className="min-h-9" onClick={() => setDark(true)}>{text.dark}</Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/75 p-2.5">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Languages className="h-3.5 w-3.5" /> {text.language}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={language === "bn" ? "outline" : "ghost"} className="min-h-9" onClick={() => setLanguage("bn")}>{text.bangla}</Button>
                    <Button type="button" variant={language === "en" ? "outline" : "ghost"} className="min-h-9" onClick={() => setLanguage("en")}>{text.english}</Button>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
                {text.noSeeded}
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5 sm:p-6">
              <form onSubmit={onEmailLogin} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="fullName" className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{text.fullName}</label>
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/90 px-4 py-3">
                      <input id="fullName" name="fullName" className="w-full bg-transparent text-sm outline-none" type="text" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="email" className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{text.email}</label>
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/90 px-4 py-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <input id="email" name="email" className="w-full bg-transparent text-sm outline-none" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="password" className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{text.password}</label>
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/90 px-4 py-3">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <input id="password" name="password" className="w-full bg-transparent text-sm outline-none" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Button type="submit" className="w-full gap-2">
                    {text.signIn} <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onResetPassword}>{text.resetPassword}</Button>
                </div>
                <Button type="button" variant="ghost" className="w-full" onClick={onRegister}>{text.createAccount}</Button>
              </form>

              <div className="space-y-4 border-t border-border pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{text.alternative}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{text.alternativeBody}</p>
                  </div>
                  <Tabs tabs={authTabs} value={tab} onChange={setTab} />
                </div>
                {tab === "Google" ? (
                  <Button variant="outline" className="w-full" onClick={onGoogle}>Continue with Google</Button>
                ) : null}

                {tab === "OTP" ? (
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <label htmlFor="mobile" className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{text.mobileNumber}</label>
                      <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/90 px-4 py-3">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <input id="mobile" name="mobile" className="w-full bg-transparent text-sm outline-none" autoComplete="tel" placeholder="+8801XXXXXXXXX" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto]">
                      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={sendOtp}>{text.sendOtp}</Button>
                      <input id="otp" name="otp" className="w-full rounded-2xl border border-border bg-background/90 px-4 py-3 text-sm outline-none" autoComplete="one-time-code" placeholder={text.enterOtp} value={otp} onChange={(e) => setOtp(e.target.value)} />
                      <Button type="button" className="w-full sm:w-auto" onClick={verifyOtp}>{text.verify}</Button>
                    </div>
                  </div>
                ) : null}

                {tab === "FaceID" ? (
                  <Button variant="outline" className="w-full" onClick={onWebAuthn}>
                    <Fingerprint className="mr-2 h-4 w-4" /> {text.faceId}
                  </Button>
                ) : null}
              </div>

              {message ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/25 dark:text-rose-200">
                  {message}
                </div>
              ) : null}

              <div className="rounded-[1.65rem] border border-border/70 bg-muted/30 p-4 text-left sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.8rem] border border-white/40 bg-white/90 shadow-soft dark:bg-slate-900/80">
                    <Image src="/icons/icon.svg" alt="BD CR7 original logo" width={88} height={88} className="h-16 w-16 object-contain" priority />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      {text.developerBadge}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold tracking-[0.08em] text-foreground sm:text-[1.9rem]">{text.developerName}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text.developerRole}</p>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{text.developerMeta}</p>
                  </div>
                </div>
                <div className="mt-5 border-t border-border/70 pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{text.socials}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {socialLinks.map(({ href, label, icon: Icon }) => (
                      <motion.a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground transition-all hover:border-primary/40 hover:bg-background"
                        aria-label={label}
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/85 text-primary dark:bg-slate-900/80">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="font-medium">{label}</span>
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

"use client";

import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { LoginLoadingOverlay } from "@/components/auth/LoginLoadingOverlay";

import type { View } from "./types";
import { useAuthFlow } from "./hooks/useAuthFlow";
import { LandingView } from "./views/LandingView";
import { OtpView } from "./views/OtpView";
import { SigninView } from "./views/SigninView";
import { SignupView } from "./views/SignupView";
import { SplashView } from "./views/SplashView";
import { ThemeToggle } from "./views/ThemeToggle";

export default function LoginPageController() {
  const router = useRouter();
  const flow = useAuthFlow(router);

  return (
    <>
      <LoginLoadingOverlay visible={flow.showOverlay} complete={flow.authDone} onDone={() => router.push("/dashboard")} />

      <ThemeToggle />

      <div className="auth-bg-bdcr7 login-shell relative">
        <div className="pointer-events-none absolute inset-0 z-0" />

        <div className="relative z-10 h-full w-full">
          <AnimatePresence mode="wait">
            {flow.view === "splash" && <SplashView key="splash" />}

            {flow.view === "landing" && (() => {
              const goTo = (v: Exclude<View, "landing">) => {
                flow.biometric.setState("idle");
                flow.setView(v);
              };
              return (
                <LandingView
                  key="landing"
                  onSignin={() => goTo("signin")}
                  onSignup={() => goTo("signup")}
                  onOtp={() => goTo("otp")}
                  onBiometric={flow.biometric.trigger}
                  bioLoading={flow.biometric.loading}
                  bioError={flow.biometric.error}
                  bioState={flow.biometric.state}
                />
              );
            })()}

            {flow.view === "signin" && (
              <SigninView
                key="signin"
                onBack={() => flow.setView("landing")}
                onSignup={() => flow.setView("signup")}
                onOtp={() => flow.setView("otp")}
                onGoogle={flow.oauth.loginWithGoogle}
                loading={flow.signin.loading}
                onSubmit={flow.signin.submit}
                email={flow.signin.email}
                setEmail={flow.signin.setEmail}
                password={flow.signin.password}
                setPassword={flow.signin.setPassword}
                showPass={flow.signin.showPass}
                setShowPass={flow.signin.setShowPass}
                remember={flow.signin.remember}
                setRemember={flow.signin.setRemember}
                capsLock={flow.signin.capsLock}
                setCapsLock={flow.signin.setCapsLock}
                error={flow.signin.error}
              />
            )}

            {flow.view === "signup" && (
              <SignupView
                key="signup"
                onBack={() => flow.setView("landing")}
                onGoogle={flow.oauth.signUpWithGoogle}
                loading={flow.signup.loading}
                onSubmit={flow.signup.submit}
                fullName={flow.signup.fullName}
                setFullName={flow.signup.setFullName}
                userId={flow.signup.userId}
                setUserId={flow.signup.setUserId}
                email={flow.signup.email}
                setEmail={flow.signup.setEmail}
                phone={flow.signup.phone}
                setPhone={flow.signup.setPhone}
                password={flow.signup.password}
                setPassword={flow.signup.setPassword}
                confirmPass={flow.signup.confirmPass}
                setConfirmPass={flow.signup.setConfirmPass}
                showPass={flow.signup.showPass}
                setShowPass={flow.signup.setShowPass}
                showConfirm={flow.signup.showConfirm}
                setShowConfirm={flow.signup.setShowConfirm}
                error={flow.signup.error}
                success={flow.signup.success}
              />
            )}

            {flow.view === "otp" && (
              <OtpView
                key="otp"
                onBack={flow.otp.resetAndBackToLanding}
                contact={flow.otp.contact}
                setContact={flow.otp.setContact}
                step={flow.otp.step}
                digits={flow.otp.digits}
                onDigitInput={flow.otp.onDigitInput}
                onDigitKeyDown={flow.otp.onDigitKeyDown}
                digitRefs={flow.otp.refs}
                onSend={flow.otp.send}
                onVerify={flow.otp.verify}
                onResend={flow.otp.resend}
                resendTimer={flow.otp.resendTimer}
                loading={flow.otp.loading}
                error={flow.otp.error}
                success={flow.otp.success}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

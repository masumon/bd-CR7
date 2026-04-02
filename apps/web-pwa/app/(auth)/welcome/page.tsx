"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import BDCR7Logo from "@/components/ui/BDCR7Logo";
import { Button } from "@/components/ui/button";
import { BiometricButton } from "@/components/auth/BiometricButton";
import { DeveloperCredit } from "@/components/auth/DeveloperCredit";
import { SocialLinks } from "@/components/auth/SocialLinks";
import { AuthLayout, AuthCard } from "@/components/auth/AuthLayout";

export default function WelcomePage() {
  const router = useRouter();

  const handleBiometricSuccess = () => {
    // Navigate to dashboard after successful biometric auth
    router.push("/dashboard");
  };

  const handleSignIn = () => {
    router.push("/auth/login");
  };

  const handleSignUp = () => {
    router.push("/auth/register");
  };

  return (
    <AuthLayout variant="welcome" maxWidth="sm">
      {/* Header Section - Logo & Branding */}
      <section className="flex flex-col items-center gap-6 sm:gap-7">
        {/* Logo */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 text-primary animate-slide-down">
          <BDCR7Logo />
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-2 sm:space-y-3">
          <h1
            className="
              text-3xl sm:text-4xl md:text-4xl
              font-black
              tracking-tight
              text-foreground
              font-display
            "
          >
            BD CR7 ERP
          </h1>
          <p
            className="
              text-sm sm:text-base
              text-muted-foreground
              font-medium
              tracking-wide
            "
          >
            Smart • Secure • AI Powered
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="flex flex-col gap-6 sm:gap-7 w-full">
        {/* Primary Action - Sign In Button */}
        <Button
          onClick={handleSignIn}
          className="
            w-full
            h-11 sm:h-12
            text-base font-semibold
            bg-primary text-white
            hover:opacity-90
            active:scale-95
            transition-all duration-200
          "
        >
          Sign In
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Biometric Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-px bg-border/40 w-12" /> {/* Divider */}
          <BiometricButton
            onBiometricAttempt={handleBiometricSuccess}
            size="md"
          />
          <div className="h-px bg-border/40 w-12" /> {/* Divider */}
        </div>

        {/* Developer Credit Card */}
        <AuthCard className="bg-white/50 border-white/20">
          <DeveloperCredit variant="full" />
        </AuthCard>

        {/* Social Links */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs font-medium text-muted-foreground">
            Official Channels
          </p>
          <SocialLinks size="md" />
        </div>
      </section>

      {/* Footer Section - Secondary Action */}
      <section className="flex flex-col items-center gap-3">
        <div className="h-px bg-border/30 w-12" /> {/* Divider */}
        <p className="text-xs text-muted-foreground text-center">
          New here?
        </p>
        <Button
          onClick={handleSignUp}
          variant="outline"
          className="
            w-full max-w-xs
            h-10 sm:h-11
            text-sm font-medium
          "
        >
          Create Account
        </Button>
      </section>
    </AuthLayout>
  );
}

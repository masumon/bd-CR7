"use client";

import Image from "next/image";
import { Globe, Mail } from "lucide-react";

import { DEVELOPER_CONFIG } from "@/lib/developers";

export function DevFooter() {
  return (
    <footer className="w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="h-px w-full bg-white/[0.08]" />
      <div className="pt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <p className="text-[10px] tracking-[0.15em] whitespace-nowrap text-white/30">
          Powered by <span className="gold-text-gradient font-semibold uppercase tracking-[0.18em]">SUMONIX AI</span>
        </p>
        <div className="flex items-center gap-2">
          <a href={DEVELOPER_CONFIG.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="auth-social-icon auth-social-icon--facebook">
            <Image src="/icons/brands/facebook.svg" alt="Facebook" width={16} height={16} />
          </a>
          <a href={DEVELOPER_CONFIG.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="auth-social-icon auth-social-icon--whatsapp">
            <Image src="/icons/brands/whatsapp.svg" alt="WhatsApp" width={16} height={16} />
          </a>
          <a href={`mailto:${DEVELOPER_CONFIG.email}`} aria-label="Email" className="auth-social-icon auth-social-icon--email">
            <Mail className="h-[16px] w-[16px]" />
          </a>
          <a href={DEVELOPER_CONFIG.website} target="_blank" rel="noreferrer" aria-label="Website" className="auth-social-icon auth-social-icon--web">
            <Globe className="h-[16px] w-[16px]" />
          </a>
        </div>
      </div>
    </footer>
  );
}

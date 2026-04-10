"use client";

import { DEVELOPER_CONFIG } from "@/lib/developers";
import { Facebook, Globe, MessageCircle, Mail } from "lucide-react";

interface SocialLinksProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const socialLinks = [
  {
    href: DEVELOPER_CONFIG.facebook,
    icon: Facebook,
    label: "Facebook",
    ariaLabel: "Visit Facebook profile",
  },
  {
    href: DEVELOPER_CONFIG.website,
    icon: Globe,
    label: "Website",
    ariaLabel: "Visit website",
  },
  {
    href: DEVELOPER_CONFIG.whatsapp,
    icon: MessageCircle,
    label: "WhatsApp",
    ariaLabel: "Contact via WhatsApp",
  },
  {
    href: `mailto:${DEVELOPER_CONFIG.email}`,
    icon: Mail,
    label: "Email",
    ariaLabel: "Send email",
  },
];

export function SocialLinks({ size = "md", className = "" }: SocialLinksProps) {
  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-12 h-12",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={`flex items-center justify-center gap-2 flex-wrap ${className}`}>
      {socialLinks.map(({ href, icon: Icon, label, ariaLabel }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            ${sizeClasses[size]}
            rounded-full
            flex items-center justify-center
            transition-all duration-300
            
            /* Glass effect */
            border border-white/30
            backdrop-blur-lg
            -webkit-backdrop-filter: blur(18px)
            bg-white/[0.08]
            
            /* Colors */
            text-primary
            hover:text-white
            hover:bg-primary/20
            hover:border-primary/50
            hover:shadow-lg
            
            /* Active state */
            active:scale-90
          `}
          aria-label={ariaLabel}
          title={label}
        >
          <Icon className={iconSizeClasses[size]} />
        </a>
      ))}
    </div>
  );
}

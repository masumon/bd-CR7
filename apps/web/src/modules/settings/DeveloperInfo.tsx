"use client";

import { motion } from "framer-motion";
import { Facebook, Globe, Mail, Phone } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const links = [
  { href: "https://www.facebook.com/mmumin.sumon", label: "Facebook", icon: Facebook },
  { href: "https://mumainsumon.netlify.app", label: "Website", icon: Globe },
  { href: "https://wa.me/8801825007977", label: "WhatsApp", icon: Phone },
  { href: "mailto:m.a.sumon92@gmail.com", label: "Mail", icon: Mail },
];

export function DeveloperInfo() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="max-w-xl overflow-hidden border-border/70 bg-card/80">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 text-lg font-bold text-white shadow-lg shadow-sky-500/20">
              MS
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Mumain Ahmed Sumon</h2>
              <p className="text-sm text-muted-foreground">Integrated Systems & AI-Assisted Technical Solutions Architect</p>
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Full Stack Python Developer
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {links.map(({ href, label, icon: Icon }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </motion.a>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">Built with ❤️ by Mumain Ahmed | ABO ENTERPRISE</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

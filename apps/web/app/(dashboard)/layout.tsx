import { MobileAppShell } from "@/components/layout/MobileAppShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MobileAppShell>{children}</MobileAppShell>;
}

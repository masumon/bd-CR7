import { MobileAppShell } from "@/components/layout/MobileAppShell";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MobileAppShell>{children}</MobileAppShell>;
}

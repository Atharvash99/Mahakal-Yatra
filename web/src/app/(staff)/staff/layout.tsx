import type { Metadata } from "next";
import Shell from "@/components/staff/Shell";
import StaffProvider from "@/components/staff/StaffProvider";
import { ToastProvider } from "@/components/staff/ui";

// Everything here sits behind a client-side sign-in, so there is no shell to prefetch for instant navigation.
export const instant = false;

export const metadata: Metadata = {
  title: "Staff | MahakalYatra",
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffProvider>
      <ToastProvider>
        <Shell>{children}</Shell>
      </ToastProvider>
    </StaffProvider>
  );
}

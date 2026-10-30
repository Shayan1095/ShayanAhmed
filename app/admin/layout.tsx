import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Admin root: flat daily tool on the site tokens, without the site's motion providers. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin min-h-dvh bg-paper text-ink antialiased">
      {children}
      <Toaster theme="light" position="bottom-right" />
    </div>
  );
}

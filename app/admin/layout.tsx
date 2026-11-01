import type { Metadata } from "next";
import { AdminChrome, themeScript } from "@/components/admin/theme";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Admin root: the frosted-glass CRM theme on the site tokens, without the site's motion providers. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin relative isolate min-h-dvh text-ink antialiased">
      {/* Sets light/dark before the first paint. */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {/* Warm light for the liquid glass to bend. */}
      <div aria-hidden="true" className="admin-canvas">
        <span className="admin-blob" />
        <span className="admin-blob" />
        <span className="admin-blob" />
        <span className="admin-blob" />
      </div>
      <div className="relative z-[1]">{children}</div>
      <AdminChrome />
    </div>
  );
}

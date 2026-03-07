import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SessionProvider } from "@/components/layout/session-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      {/* ── Light backdrop with subtle AI gradient glow ── */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(900px circle at 80% 10%, rgba(99,102,241,0.08), transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(700px circle at 15% 85%, rgba(59,130,246,0.06), transparent 60%)" }} />
      </div>

      {/* ── App shell ── */}
      <div className="relative flex h-screen" style={{ zIndex: 1 }}>
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}

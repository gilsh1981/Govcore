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
  if (!session) redirect("/login");

  return (
    <SessionProvider>
      {/* Background */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: "linear-gradient(160deg,#F8FAFC 0%,#EEF2FF 100%)",
        }}
      />

      {/*
        Shell — html[dir="rtl"] is set in root layout, which makes `direction: rtl`
        inherit to all descendants. With direction:rtl, flex-direction:row naturally
        flows RIGHT→LEFT, placing the sidebar (first child) on the right automatically.
        Do NOT add rtl:flex-row-reverse here — that would double-reverse the layout.
      */}
      <div
        className="relative flex h-screen overflow-hidden"
        style={{ zIndex: 1 }}
      >
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-screen-xl px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
import { getWorldsByOwner } from "@/lib/db/queries/worlds";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const worlds = await getWorldsByOwner(session.user.id);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar worlds={worlds} />
      <div className="flex-1 flex flex-col min-h-0">
        <AppMobileHeader worlds={worlds} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

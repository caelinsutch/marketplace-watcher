import { MonitorCard } from "@/components/monitor-card";
import { Navigation } from "@/components/navigation";
import { client } from "@/lib/orpc";
import { createClient } from "@/supabase/server";
import { Button } from "@marketplace-watcher/ui/components/base/button";
import { Input } from "@marketplace-watcher/ui/components/base/input";
import { InboxIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const MonitorCardWrapper = async ({
  monitor,
  userId,
}: {
  monitor: {
    id: string;
    name: string;
    url: string;
    checkFrequency: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  userId: string;
}) => {
  // Get match stats
  let matchStats = { totalMatches: 0, unnotifiedMatches: 0 };
  try {
    matchStats = await client.matches.getStats({
      monitorId: monitor.id,
      userId,
    });
  } catch (error) {
    console.error("Failed to fetch match stats:", error);
  }

  return (
    <MonitorCard monitor={monitor} userId={userId} matchStats={matchStats} />
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4 ">
    <div className="rounded-full bg-muted p-4 mb-4 ">
      <InboxIcon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">No monitors yet</h3>
    <p className="text-muted-foreground text-center mb-6 max-w-sm">
      Create your first monitor to start tracking items on Facebook Marketplace.
    </p>
    <Button asChild className="button-press ">
      <Link href="/monitors/new">
        <PlusIcon className="mr-2 h-4 w-4" />
        Create Monitor
      </Link>
    </Button>
  </div>
);

export default async function MonitorsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Fetch monitors
  const monitors = await client.monitors.list({ userId: data.user.id });

  return (
    <>
      <Navigation />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 page-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="slide-in-left">
            <h1 className="text-3xl font-bold">My Monitors</h1>
            <p className="text-muted-foreground mt-1">
              Track items on Facebook Marketplace and get notified when new
              matches appear.
            </p>
          </div>
          <Button asChild className="button-press">
            <Link href="/monitors/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Monitor
            </Link>
          </Button>
        </div>

        {/* Search/Filter Bar */}
        {monitors.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search monitors..." className="pl-9" />
            </div>
          </div>
        )}

        {/* Monitors Grid */}
        {monitors.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 stagger-fade-in">
            {monitors.map((monitor) => (
              <MonitorCardWrapper
                key={monitor.id}
                monitor={monitor}
                userId={data.user.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </>
  );
}

import { MatchesClient } from "@/components/matches/matches-client";
import { Navigation } from "@/components/navigation";
import { client } from "@/lib/orpc";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const { id: monitorId } = await params;

  // Fetch monitor
  const monitor = await client.monitors.get({
    id: monitorId,
    userId: data.user.id,
  });

  // Fetch initial matches
  const initialMatches = await client.matches.getByMonitor({
    monitorId,
    userId: data.user.id,
    limit: 20,
    offset: 0,
  });

  return (
    <>
      <Navigation />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MatchesClient
          monitor={monitor}
          userId={data.user.id}
          initialMatches={initialMatches}
        />
      </div>
    </>
  );
}

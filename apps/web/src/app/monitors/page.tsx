import { Navigation } from "@/components/navigation";
import { client } from "@/lib/orpc";
import { createClient } from "@/supabase/server";
import { Badge } from "@marketplace-watcher/ui/components/ui/badge";
import { Button } from "@marketplace-watcher/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marketplace-watcher/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@marketplace-watcher/ui/components/ui/dropdown-menu";
import { Input } from "@marketplace-watcher/ui/components/ui/input";
import { formatTimeAgo } from "@marketplace-watcher/utils";
import {
  BellIcon,
  ClockIcon,
  DollarSignIcon,
  EyeIcon,
  InboxIcon,
  MapPinIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const MonitorCard = async ({
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
  // Extract location and price from URL
  const url = new URL(monitor.url);
  const pathParts = url.pathname.split("/");
  const location = pathParts[3] || "Unknown location";
  const searchParams = new URLSearchParams(url.search);
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const query = searchParams.get("query") || monitor.name;

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

  const formatCheckFrequency = (freq: string) => {
    switch (freq) {
      case "hourly":
        return "Hourly";
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      default:
        return freq;
    }
  };

  return (
    <Card className="group card-hover">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{query}</CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-3 w-3" />
                {location
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
              {(minPrice || maxPrice) && (
                <span className="flex items-center gap-1">
                  <DollarSignIcon className="h-3 w-3" />
                  {minPrice && maxPrice
                    ? `$${minPrice} - $${maxPrice}`
                    : minPrice
                      ? `$${minPrice}+`
                      : `Up to $${maxPrice}`}
                </span>
              )}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/monitors/${monitor.id}/matches`}>
                  <EyeIcon className="mr-2 h-4 w-4" />
                  View Matches
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/monitors/${monitor.id}/edit`}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={monitor.isActive ? "default" : "secondary"}>
              {monitor.isActive ? "Active" : "Paused"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <ClockIcon className="mr-1 h-3 w-3" />
              {formatCheckFrequency(monitor.checkFrequency)}
            </Badge>
          </div>
          {matchStats.unnotifiedMatches > 0 && (
            <Badge variant="destructive" className="animate-pulse-badge">
              <BellIcon className="mr-1 h-3 w-3" />
              {matchStats.unnotifiedMatches} new
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{matchStats.totalMatches} total matches</span>
          <span>Checked {formatTimeAgo(monitor.updatedAt)}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild className="w-full button-press">
          <Link href={`/monitors/${monitor.id}/matches`}>View Matches</Link>
        </Button>
      </CardFooter>
    </Card>
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
              <MonitorCard
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

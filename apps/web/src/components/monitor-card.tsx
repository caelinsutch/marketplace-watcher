"use client";

import { client } from "@/lib/orpc";
import { Badge } from "@marketplace-watcher/ui/components/base/badge";
import { Button } from "@marketplace-watcher/ui/components/base/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marketplace-watcher/ui/components/base/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@marketplace-watcher/ui/components/base/dropdown-menu";
import { formatCentsToPrice, formatTimeAgo } from "@marketplace-watcher/utils";
import {
  BellIcon,
  ClockIcon,
  DollarSignIcon,
  EyeIcon,
  LoaderIcon,
  MapPinIcon,
  MoreVerticalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MonitorCardProps = {
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
  matchStats: {
    totalMatches: number;
    unnotifiedMatches: number;
  };
};

export const MonitorCard = ({
  monitor,
  userId,
  matchStats,
}: MonitorCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(monitor.isActive);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Extract location and price from URL
  const url = new URL(monitor.url);
  const pathParts = url.pathname.split("/");
  const location = pathParts[3] || "Unknown location";
  const searchParams = new URLSearchParams(url.search);
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const query = searchParams.get("query") || monitor.name;

  // Convert dollar amounts from URL to cents for display
  const minPriceInCents = minPrice ? Number.parseInt(minPrice, 10) * 100 : null;
  const maxPriceInCents = maxPrice ? Number.parseInt(maxPrice, 10) * 100 : null;

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

  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      const updated = await client.monitors.toggleActive({
        id: monitor.id,
        userId,
      });
      setIsActive(updated?.isActive ?? false);
      router.refresh();
      setDropdownOpen(false);
    } catch (error) {
      console.error("Failed to toggle monitor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this monitor? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await client.monitors.delete({
        id: monitor.id,
        userId,
      });
      router.refresh();
      setDropdownOpen(false);
    } catch (error) {
      console.error("Failed to delete monitor:", error);
    } finally {
      setIsDeleting(false);
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
              {(minPriceInCents !== null || maxPriceInCents !== null) && (
                <span className="flex items-center gap-1">
                  <DollarSignIcon className="h-3 w-3" />
                  {minPriceInCents !== null && maxPriceInCents !== null
                    ? `${formatCentsToPrice(minPriceInCents)} - ${formatCentsToPrice(maxPriceInCents)}`
                    : minPriceInCents !== null
                      ? `${formatCentsToPrice(minPriceInCents)}+`
                      : maxPriceInCents !== null
                        ? `Up to ${formatCentsToPrice(maxPriceInCents)}`
                        : ""}
                </span>
              )}
            </CardDescription>
          </div>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
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
              <DropdownMenuItem
                onClick={handleToggleActive}
                disabled={isLoading}
                onSelect={(e) => e.preventDefault()}
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    {isActive ? "Pausing..." : "Resuming..."}
                  </>
                ) : isActive ? (
                  <>
                    <PauseIcon className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 h-4 w-4" />
                    Resume
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                onSelect={(e) => e.preventDefault()}
              >
                {isDeleting ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Paused"}
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

"use client";

import { client } from "@/lib/orpc";
import type { Match, Monitor, SortBy, SortOrder } from "@/types/matches";
import { Button } from "@marketplace-watcher/ui/components/base/button";
import {
  Card,
  CardContent,
} from "@marketplace-watcher/ui/components/base/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@marketplace-watcher/ui/components/base/dropdown-menu";
import {
  ArrowLeftIcon,
  BellOffIcon,
  FilterIcon,
  InboxIcon,
  LoaderIcon,
  SortDescIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MatchCard } from "./match-card";

const EmptyState = ({ onlyUnread }: { onlyUnread: boolean }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 ">
    <div className="rounded-full bg-muted p-4 mb-4 ">
      <InboxIcon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">
      {onlyUnread ? "No new matches" : "No matches found"}
    </h3>
    <p className="text-muted-foreground text-center mb-6 max-w-sm">
      {onlyUnread
        ? "All matches have been marked as read. Check back later for new items."
        : "No items have been found for this monitor yet. Check back later."}
    </p>
  </div>
);

const LoadingSkeleton = () => (
  <div className="grid gap-6 grid-cols-2 sm:grid-cols-3  lg:grid-cols-4  stagger-fade-in">
    {[...Array(4)].map((_, i) => (
      <Card
        key={i}
        className="overflow-hidden "
        style={{ animationDelay: `${i * 100}ms` }}
      >
        <div className="w-full h-64 bg-muted skeleton" />
        <div className="p-6 space-y-2">
          <div
            className="h-6 bg-muted rounded skeleton"
            style={{ width: "75%" }}
          />
          <div className="h-8 w-24 bg-muted rounded skeleton" />
        </div>
        <div className="px-6 pb-6 space-y-3">
          <div className="flex gap-4">
            <div className="h-4 w-32 bg-muted rounded skeleton" />
            <div className="h-4 w-24 bg-muted rounded skeleton" />
          </div>
        </div>
        <div className="px-6 pb-6 gap-2 flex">
          <div className="h-10 flex-1 bg-muted rounded skeleton" />
          <div className="h-10 w-10 bg-muted rounded skeleton" />
        </div>
      </Card>
    ))}
  </div>
);

type MatchesClientProps = {
  monitor: Monitor;
  userId: string;
  initialMatches: Match[];
};

export const MatchesClient = ({
  monitor,
  userId,
  initialMatches,
}: MatchesClientProps) => {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [hasMore, setHasMore] = useState(initialMatches.length === 20);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(20);
  const limit = 20;

  const fetchMatches = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setOffset(0);
        } else {
          setLoadingMore(true);
        }

        const result = await client.matches.getByMonitor({
          monitorId: monitor.id,
          userId,
          limit,
          offset: reset ? 0 : offset,
          onlyUnread,
          sortBy,
          sortOrder,
        });

        if (reset) {
          setMatches(result);
        } else {
          setMatches((prev) => [...prev, ...result]);
        }

        setHasMore(result.length === limit);
        setOffset(reset ? limit : offset + limit);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
        setError("Failed to load matches");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [monitor.id, userId, offset, onlyUnread, sortBy, sortOrder],
  );

  useEffect(() => {
    fetchMatches(true);
  }, [onlyUnread, sortBy, sortOrder]);

  const handleMarkAsRead = async (matchId: string) => {
    try {
      await client.matches.markNotified({
        matchId,
        userId,
      });
      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId ? { ...match, isNotified: true } : match,
        ),
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await client.matches.markAllNotified({
        monitorId: monitor.id,
        userId,
      });
      setMatches((prev) =>
        prev.map((match) => ({ ...match, isNotified: true })),
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const unreadCount = matches.filter((m) => !m.isNotified).length;

  // Extract search info from monitor URL
  const url = new URL(monitor.url);
  const searchParams = new URLSearchParams(url.search);
  const query = searchParams.get("query") || monitor.name;

  if (error) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{error}</p>
            <Button
              onClick={() => router.push("/monitors")}
              className="w-full mt-4"
            >
              Back to Monitors
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full space-y-8 page-fade-in">
      {/* Header */}
      <div className="space-y-4 slide-in-up">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/monitors")}
          className="gap-2 hover-lift"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Monitors
        </Button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{query}</h1>
            <p className="text-muted-foreground mt-1">
              {matches.length} matches found{" "}
              {unreadCount > 0 && `(${unreadCount} new)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                className="gap-2"
              >
                <BellOffIcon className="h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FilterIcon className="h-4 w-4" />
              {onlyUnread ? "New only" : "All matches"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={onlyUnread ? "new" : "all"}
              onValueChange={(value) => setOnlyUnread(value === "new")}
            >
              <DropdownMenuRadioItem value="all">
                All matches
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="new">
                New only
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SortDescIcon className="h-4 w-4" />
              Sort by {sortBy === "date" ? "Date" : "Price"} (
              {sortOrder === "desc" ? "↓" : "↑"})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split("-") as [
                  SortBy,
                  SortOrder,
                ];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
            >
              <DropdownMenuRadioItem value="date-desc">
                Newest first
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date-asc">
                Oldest first
              </DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="price-asc">
                Price: Low to High
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="price-desc">
                Price: High to Low
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : matches.length > 0 ? (
        <>
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3  lg:grid-cols-4  stagger-fade-in">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-8">
              <Button
                variant="outline"
                onClick={() => fetchMatches()}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-rotate" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState onlyUnread={onlyUnread} />
      )}
    </div>
  );
};

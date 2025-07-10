"use client";

import type { Match } from "@/types/matches";
import { Badge } from "@marketplace-watcher/ui/components/ui/badge";
import { Button } from "@marketplace-watcher/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@marketplace-watcher/ui/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marketplace-watcher/ui/components/ui/tooltip";
import { formatTimeAgo } from "@marketplace-watcher/utils";
import {
  CalendarIcon,
  CheckIcon,
  ExternalLinkIcon,
  MapPinIcon,
  TrendingDownIcon,
} from "lucide-react";
import { ImageCarousel } from "./image-carousel";

const PriceDisplay = ({
  listing,
  priceHistory,
}: { listing: Match["listing"]; priceHistory: Match["priceHistory"] }) => {
  const currentPrice = Number.parseFloat(listing.price);
  const previousPrice =
    priceHistory.length > 0 && priceHistory[0]
      ? Number.parseFloat(priceHistory[0].price)
      : null;
  const hasPriceDropped = previousPrice && previousPrice > currentPrice;

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold">${currentPrice.toFixed(2)}</span>
      {hasPriceDropped && (
        <>
          <Badge variant="destructive" className="gap-1">
            <TrendingDownIcon className="h-3 w-3" />
            Price Drop
          </Badge>
          <span className="text-sm text-muted-foreground line-through">
            ${previousPrice.toFixed(2)}
          </span>
        </>
      )}
    </div>
  );
};

export const MatchCard = ({
  match,
  onMarkAsRead,
}: { match: Match; onMarkAsRead: (id: string) => void }) => {
  return (
    <Card className="overflow-hidden hover:shadow-sm transition-all duration-200 card-hover">
      <ImageCarousel images={match.listing.photos} />
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2">
            {match.listing.title}
          </h3>
          {!match.isNotified && (
            <Badge variant="destructive" className="shrink-0">
              New
            </Badge>
          )}
        </div>
        <PriceDisplay
          listing={match.listing}
          priceHistory={match.priceHistory}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {match.listing.location && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="h-3 w-3" />
              {match.listing.locationDetails?.cityDisplayName ||
                match.listing.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Posted {formatTimeAgo(match.listing.firstSeenAt)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild className="flex-1">
          <a
            href={match.listing.marketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            View on Facebook
            <ExternalLinkIcon className="h-4 w-4" />
          </a>
        </Button>
        {!match.isNotified && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onMarkAsRead(match.id)}
                aria-label="Mark as read"
              >
                <CheckIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mark as read</p>
            </TooltipContent>
          </Tooltip>
        )}
      </CardFooter>
    </Card>
  );
};

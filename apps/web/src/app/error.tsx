"use client";

import { Button } from "@marketplace-watcher/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@marketplace-watcher/ui/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@marketplace-watcher/ui/components/ui/collapsible";
import { ChevronDown, Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              We encountered an unexpected error. Please try again or return to
              the home page.
            </p>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span>Error details</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="rounded-md bg-muted p-3">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                    {error.message || "An unknown error occurred"}
                    {error.digest && (
                      <>
                        {"\n\nError ID: "}
                        {error.digest}
                      </>
                    )}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex flex-col gap-2">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

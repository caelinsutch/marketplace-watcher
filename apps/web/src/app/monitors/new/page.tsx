"use client";

import { Navigation } from "@/components/navigation";
import { client } from "@/lib/orpc";
import { createClient } from "@/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marketplace-watcher/ui/components/base/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@marketplace-watcher/ui/components/base/card";
import { Input } from "@marketplace-watcher/ui/components/base/input";
import { Label } from "@marketplace-watcher/ui/components/base/label";
import { cn } from "@marketplace-watcher/ui/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  MapPin,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createMonitorSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  url: z.string().url("Please enter a valid Facebook Marketplace URL"),
  checkFrequency: z.enum(["hourly", "daily", "weekly"]),
  // Future fields for enhanced functionality:
  // description: z.string().optional(),
  // minPrice: z.number().optional(),
  // maxPrice: z.number().optional(),
  // notificationEmail: z.boolean().default(true),
  // photoSearch: z.boolean().default(false),
});

type CreateMonitorFormData = z.infer<typeof createMonitorSchema>;

export default function NewMonitorPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [createdMonitorId, setCreatedMonitorId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    status: "success" | "error";
    message: string;
    matchCount?: number;
  } | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateMonitorFormData>({
    resolver: zodResolver(createMonitorSchema),
    defaultValues: {
      checkFrequency: "daily",
    },
  });

  // Get user ID and email on mount
  useEffect(() => {
    const getUserData = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setUserId(data.user.id);
        setUserEmail(data.user.email || null);
      }
    };
    getUserData();
  }, []);

  const onSubmit = async (data: CreateMonitorFormData) => {
    // Prevent submission if not on the final step
    if (currentStep !== 3) {
      return;
    }

    // Validate that all required fields are filled
    if (!data.name || !data.url) {
      setError("Please fill in all required fields");
      return;
    }

    if (!userId) {
      setError("You must be logged in to create a monitor");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const monitor = await client.monitors.create({
        userId,
        userEmail: userEmail || undefined,
        data: {
          name: data.name,
          url: data.url,
          checkFrequency: data.checkFrequency,
        },
      });

      if (monitor) {
        setCreatedMonitorId(monitor.id);
        setShowConfirmation(true);
      } else {
        throw new Error("Failed to create monitor");
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Failed to create monitor",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key to advance to next step
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentStep === 1 && watch("name")) {
        setCurrentStep(2);
      } else if (currentStep === 2 && watch("url")) {
        setCurrentStep(3);
      }
      // On step 3, don't auto-submit - user must click the Create Monitor button
    }
  };

  const watchedUrl = watch("url");

  // Extract location from Facebook Marketplace URL
  const extractLocationFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const marketplaceIndex = pathParts.indexOf("marketplace");
      if (marketplaceIndex !== -1 && pathParts[marketplaceIndex + 1]) {
        return pathParts[marketplaceIndex + 1];
      }
    } catch {
      // Invalid URL
    }
    return null;
  };

  const location = watchedUrl ? extractLocationFromUrl(watchedUrl) : null;

  const steps = [
    { number: 1, title: "Basic Info", icon: Search },
    { number: 2, title: "Search Settings", icon: MapPin },
    { number: 3, title: "Notifications", icon: Bell },
  ];

  const handleRunMonitor = async () => {
    if (!createdMonitorId || !userId) return;

    setIsRunning(true);
    setRunResult(null);

    try {
      const result = await client.monitors.run({
        id: createdMonitorId,
        userId,
      });

      if (result.status === "success") {
        setRunResult({
          status: "success",
          message: `Found ${result.totalListingIds.length} listings! ${result.changedListingIds.length} are new.`,
          matchCount: result.totalListingIds.length,
        });
      } else {
        setRunResult({
          status: "error",
          message: result.error || "Failed to run monitor",
        });
      }
    } catch (error) {
      setRunResult({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to run monitor",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // If showing confirmation, render confirmation UI
  if (showConfirmation) {
    return (
      <>
        <Navigation />
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto page-fade-in">
            <Card className="animate-scale-in">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary animate-success" />
                </div>
                <CardTitle className="text-2xl">
                  Monitor Created Successfully!
                </CardTitle>
                <CardDescription>
                  Your monitor "{watch("name")}" has been created and will check
                  for new listings {watch("checkFrequency")}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">What happens next?</h3>
                  <p className="text-sm text-muted-foreground">
                    You can run your monitor now to see immediate results, or
                    wait for it to run automatically based on your schedule.
                  </p>
                </div>

                {runResult && (
                  <div
                    className={cn(
                      "rounded-lg p-4 animate-scale-in",
                      runResult.status === "success"
                        ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
                        : "bg-destructive/10 border border-destructive/50",
                    )}
                  >
                    <div className="flex items-start">
                      {runResult.status === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                      )}
                      <div>
                        <p
                          className={cn(
                            "font-medium",
                            runResult.status === "success"
                              ? "text-green-800 dark:text-green-400"
                              : "text-destructive",
                          )}
                        >
                          {runResult.message}
                        </p>
                        {runResult.status === "success" &&
                          runResult.matchCount !== undefined &&
                          runResult.matchCount > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              View your matches on the monitor page.
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleRunMonitor}
                    disabled={isRunning}
                    className="flex-1"
                    variant={
                      runResult?.status === "success" ? "outline" : "default"
                    }
                  >
                    {isRunning ? (
                      <>Running Monitor...</>
                    ) : runResult?.status === "success" ? (
                      <>Run Again</>
                    ) : (
                      <>Run Monitor Now</>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      if (runResult?.status === "success" && createdMonitorId) {
                        router.push(`/monitors/${createdMonitorId}/matches`);
                      } else {
                        router.push("/monitors");
                      }
                    }}
                    variant={
                      runResult?.status === "success" ? "default" : "outline"
                    }
                    className="flex-1"
                  >
                    {runResult?.status === "success"
                      ? "Go to Results"
                      : "Go to Monitors"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto page-fade-in">
          {/* Header */}
          <div className="mb-8 slide-in-up">
            <Link
              href="/monitors"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors hover-lift"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to monitors
            </Link>
            <h1 className="text-3xl font-bold">Create New Monitor</h1>
            <p className="text-muted-foreground mt-2">
              Set up a monitor to track items on Facebook Marketplace
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={cn(
                    "flex items-center transition-all duration-300",
                    // On mobile, active step gets more space, others stay compact
                    currentStep === step.number
                      ? "flex-1 md:flex-1"
                      : "flex-none md:flex-1",
                  )}
                >
                  <div className="flex items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                        currentStep >= step.number
                          ? "bg-primary text-primary-foreground border-primary animate-scale-in"
                          : "bg-background text-muted-foreground border-muted",
                      )}
                    >
                      {currentStep > step.number ? (
                        <CheckCircle2 className="h-5 w-5 animate-success" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "ml-3",
                        // Hide step titles on mobile except for current step
                        currentStep === step.number
                          ? "block"
                          : "hidden md:block",
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-medium whitespace-nowrap",
                          currentStep >= step.number
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 mx-4 transition-all",
                        // Adjust connector width based on whether current step is active
                        currentStep === step.number
                          ? "flex-1 min-w-4"
                          : "w-4 md:flex-1",
                        currentStep > step.number ? "bg-primary" : "bg-muted",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6" onKeyDown={handleKeyDown}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Give your monitor a name and description to easily identify
                    it later
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Monitor Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Vintage Furniture under $200"
                      {...register("name")}
                      className="text-lg"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.name.message}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Choose a descriptive name that helps you remember what
                      this monitor tracks
                    </p>
                  </div>

                  {/* Future: Add description field */}
                  {/* <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add any additional notes about what you're looking for..."
                    className="min-h-[100px]"
                  />
                </div> */}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Search Settings */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-scale-in">
                {/* Search Type Toggle - Future Enhancement */}
                {/* <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={searchType === 'text' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setSearchType('text')}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Text Search
                    </Button>
                    <Button
                      type="button"
                      variant={searchType === 'photo' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setSearchType('photo')}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Photo Search
                    </Button>
                  </div>
                </CardContent>
              </Card> */}

                <Card>
                  <CardHeader>
                    <CardTitle>Facebook Marketplace URL</CardTitle>
                    <CardDescription>
                      Paste the URL from your Facebook Marketplace search
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="url">Marketplace URL</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://www.facebook.com/marketplace/nyc/search/?query=desk"
                        {...register("url")}
                        className="font-mono text-sm"
                      />
                      {errors.url && (
                        <p className="text-sm text-destructive flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.url.message}
                        </p>
                      )}
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>How to get your Marketplace URL:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Go to Facebook Marketplace</li>
                          <li>Search for items using your criteria</li>
                          <li>Apply any filters (price, location, category)</li>
                          <li>Copy the URL from your browser</li>
                        </ol>
                      </div>
                    </div>

                    {location && (
                      <div className="bg-muted/50 rounded-lg p-4 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          Searching in:{" "}
                          <strong className="capitalize">{location}</strong>
                        </span>
                      </div>
                    )}

                    {/* Future: Price Range */}
                    {/* <div className="space-y-4">
                    <Label>Price Range (Optional)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minPrice" className="text-sm text-muted-foreground">
                          Min Price
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="minPrice"
                            type="number"
                            placeholder="0"
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxPrice" className="text-sm text-muted-foreground">
                          Max Price
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="maxPrice"
                            type="number"
                            placeholder="500"
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div> */}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Notification Settings */}
            {currentStep === 3 && (
              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Choose how often you want to check for new listings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Check Frequency</Label>
                    <div className="grid gap-4">
                      {[
                        {
                          value: "hourly",
                          label: "Every Hour",
                          description:
                            "Get notified quickly about new listings",
                        },
                        {
                          value: "daily",
                          label: "Once Daily",
                          description: "Perfect for most searches",
                        },
                        {
                          value: "weekly",
                          label: "Once Weekly",
                          description: "For less urgent items",
                        },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={cn(
                            "flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all",
                            watch("checkFrequency") === option.value
                              ? "border-primary bg-primary/5"
                              : "border-input hover:border-primary/50",
                          )}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            {...register("checkFrequency")}
                            className="mt-1"
                          />
                          <div className="space-y-1">
                            <p className="font-medium">{option.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Future: Email notification toggle */}
                  {/* <div className="flex items-center space-x-2">
                  <Checkbox id="email-notifications" defaultChecked />
                  <Label
                    htmlFor="email-notifications"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Send email notifications when new matches are found
                  </Label>
                </div> */}
                </CardContent>
              </Card>
            )}

            {/* Preview Card */}
            {currentStep === 3 && watch("name") && watch("url") && (
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">Monitor Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">{watch("name")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Location:
                    </span>
                    <span className="text-sm font-medium capitalize">
                      {location || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Check Frequency:
                    </span>
                    <span className="text-sm font-medium capitalize">
                      {watch("checkFrequency")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 animate-shake">
                <p className="text-sm text-destructive flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 animate-pulse" />
                  {error}
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (currentStep > 1) {
                    setCurrentStep(currentStep - 1);
                  } else {
                    router.push("/monitors");
                  }
                }}
              >
                {currentStep === 1 ? "Cancel" : "Previous"}
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && !watch("name")) ||
                    (currentStep === 2 && !watch("url"))
                  }
                >
                  Next Step
                </Button>
              ) : (
                <Button onClick={handleSubmit(onSubmit)}>
                  {isLoading ? "Creating Monitor..." : "Create Monitor"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

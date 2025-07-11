import { db, monitors } from "@marketplace-watcher/db";
import { runMonitor } from "@marketplace-watcher/monitor-runner";
import { processBatches } from "@marketplace-watcher/utils";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "../../../../env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MonitorBatchResult = {
  monitorId: string;
  monitorName: string;
  result: {
    changedListingIds: string[];
    totalListingIds: string[];
    status: "success" | "error";
    error?: string;
  };
};

const processMonitorBatch = async (
  monitorBatch: Array<{ id: string; name: string }>,
): Promise<MonitorBatchResult[]> => {
  const promises = monitorBatch.map(async (monitor) => {
    console.log(`Processing monitor: ${monitor.id} (${monitor.name})`);

    try {
      const result = await runMonitor(monitor.id);

      if (result.status === "success") {
        console.log(
          `Monitor ${monitor.id} completed successfully: ${result.changedListingIds.length} changed listings out of ${result.totalListingIds.length} total`,
        );
      } else {
        console.error(`Monitor ${monitor.id} failed: ${result.error}`);
      }

      return {
        monitorId: monitor.id,
        monitorName: monitor.name,
        result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Error processing monitor ${monitor.id}:`, errorMessage);

      return {
        monitorId: monitor.id,
        monitorName: monitor.name,
        result: {
          changedListingIds: [],
          totalListingIds: [],
          status: "error" as const,
          error: errorMessage,
        },
      };
    }
  });

  return Promise.all(promises);
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      console.error("Unauthorized cron request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting monitor runner cron job");

    // Fetch all active monitors
    const activeMonitors = await db
      .select({
        id: monitors.id,
        name: monitors.name,
      })
      .from(monitors)
      .where(eq(monitors.isActive, true));

    console.log(`Found ${activeMonitors.length} active monitors to process`);

    if (activeMonitors.length === 0) {
      console.log("No active monitors found");
      return NextResponse.json({
        success: true,
        summary: {
          totalMonitors: 0,
          successCount: 0,
          errorCount: 0,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
        results: [],
      });
    }

    // Process monitors in batches of 10
    const results = await processBatches(
      activeMonitors,
      10,
      processMonitorBatch,
    );

    // Calculate summary
    let successCount = 0;
    let errorCount = 0;

    for (const result of results) {
      if (result.result.status === "success") {
        successCount++;
      } else {
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      totalMonitors: activeMonitors.length,
      successCount,
      errorCount,
      duration,
      timestamp: new Date().toISOString(),
    };

    console.log(`Monitor runner completed in ${duration}ms:`, summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(
      `Monitor runner cron job failed after ${duration}ms:`,
      errorMessage,
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

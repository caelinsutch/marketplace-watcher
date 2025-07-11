import { db, monitors, users } from "@marketplace-watcher/db";
import { now } from "@marketplace-watcher/utils";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { base } from "./base";

const createMonitorSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  checkFrequency: z.enum(["hourly", "daily", "weekly"]).default("daily"),
});

const updateMonitorSchema = createMonitorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const monitorsRouter = {
  list: base
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .handler(async ({ input }) => {
      const results = await db
        .select()
        .from(monitors)
        .where(eq(monitors.userId, input.userId))
        .orderBy(desc(monitors.createdAt));

      return results;
    })
    .callable(),

  get: base
    .input(
      z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    )
    .handler(async ({ input, errors }) => {
      const [monitor] = await db
        .select()
        .from(monitors)
        .where(
          and(eq(monitors.id, input.id), eq(monitors.userId, input.userId)),
        );

      if (!monitor) {
        throw errors.NOT_FOUND({
          message: "Monitor not found",
        });
      }

      return monitor;
    })
    .callable(),

  create: base
    .input(
      z.object({
        userId: z.string().uuid(),
        userEmail: z.string().email().optional(),
        data: createMonitorSchema,
      }),
    )
    .handler(async ({ input }) => {
      // First, ensure the user exists in the database
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId));

      if (!existingUser) {
        // Create the user if they don't exist
        await db.insert(users).values({
          id: input.userId,
          email: input.userEmail || `user-${input.userId}@example.com`,
        });
      }

      // Now create the monitor
      const [monitor] = await db
        .insert(monitors)
        .values({
          ...input.data,
          userId: input.userId,
        })
        .returning();

      return monitor;
    })
    .callable(),

  update: base
    .input(
      z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
        data: updateMonitorSchema,
      }),
    )
    .handler(async ({ input, errors }) => {
      const [monitor] = await db
        .update(monitors)
        .set({
          ...input.data,
          updatedAt: now(),
        })
        .where(
          and(eq(monitors.id, input.id), eq(monitors.userId, input.userId)),
        )
        .returning();

      if (!monitor) {
        throw errors.NOT_FOUND();
      }

      return monitor;
    })
    .callable(),

  delete: base
    .input(
      z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    )
    .handler(async ({ input, errors }) => {
      const [deleted] = await db
        .delete(monitors)
        .where(
          and(eq(monitors.id, input.id), eq(monitors.userId, input.userId)),
        )
        .returning();

      if (!deleted) {
        throw errors.NOT_FOUND();
      }

      return { success: true };
    })
    .callable(),

  toggleActive: base
    .input(
      z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    )
    .handler(async ({ input, errors }) => {
      const [monitor] = await db
        .select()
        .from(monitors)
        .where(
          and(eq(monitors.id, input.id), eq(monitors.userId, input.userId)),
        );

      if (!monitor) {
        throw errors.NOT_FOUND();
      }

      const [updated] = await db
        .update(monitors)
        .set({
          isActive: !monitor.isActive,
          updatedAt: now(),
        })
        .where(eq(monitors.id, input.id))
        .returning();

      return updated;
    })
    .callable(),

  run: base
    .input(
      z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    )
    .handler(async ({ input, errors }) => {
      // Verify the monitor belongs to the user
      const [monitor] = await db
        .select()
        .from(monitors)
        .where(
          and(eq(monitors.id, input.id), eq(monitors.userId, input.userId)),
        );

      if (!monitor) {
        throw errors.NOT_FOUND({
          message: "Monitor not found",
        });
      }

      if (!monitor.isActive) {
        throw errors.BAD_REQUEST({
          message: "Monitor is not active",
        });
      }

      // Import and run the monitor
      const { runMonitor } = await import(
        "@marketplace-watcher/monitor-runner"
      );
      const result = await runMonitor(input.id);

      return result;
    })
    .callable(),
};

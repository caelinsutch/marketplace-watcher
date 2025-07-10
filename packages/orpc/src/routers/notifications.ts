import { now } from "@marketplace-watcher/utils";
import { z } from "zod";
import { base } from "./base";

const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean(),
  emailFrequency: z.enum(["immediate", "daily", "weekly"]),
});

// Mock storage for notification settings
// In a real implementation, this would be stored in the database
const mockSettings: Record<string, any> = {};

export const notificationsRouter = {
  getSettings: base
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .handler(async ({ input }) => {
      // Return mock settings or defaults
      const settings = mockSettings[input.userId] || {
        emailEnabled: true,
        emailFrequency: "daily" as const,
      };

      return settings;
    }),

  updateSettings: base
    .input(
      z.object({
        userId: z.string().uuid(),
        settings: notificationSettingsSchema,
      }),
    )
    .handler(async ({ input }) => {
      // Store settings in mock storage
      mockSettings[input.userId] = input.settings;

      return input.settings;
    }),

  sendTestNotification: base
    .input(
      z.object({
        userId: z.string().uuid(),
        email: z.string().email(),
      }),
    )
    .handler(async ({ input }) => {
      // Mock sending a test notification
      // In a real implementation, this would send an actual email

      console.log(
        `Sending test notification to ${input.email} for user ${input.userId}`,
      );

      return {
        success: true,
        message: `Test notification sent to ${input.email}`,
        sentAt: now(),
      };
    }),
};

import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  getOrCreateServerLicense,
  isLicenseValid,
  isTrialValid,
  activateLicense,
  getLicenseInfo,
} from "../license";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const licenseRouter = router({
  /**
   * Get license information
   */
  getInfo: publicProcedure.query(async () => {
    return await getLicenseInfo();
  }),

  /**
   * Check if system is accessible (license valid or trial active)
   */
  checkAccess: publicProcedure.query(async () => {
    const licenseValid = await isLicenseValid();
    const trialValid = await isTrialValid();

    return {
      hasAccess: licenseValid || trialValid,
      licenseValid,
      trialValid,
    };
  }),

  /**
   * Activate license with key
   */
  activate: publicProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      return await activateLicense(input.key);
    }),

  /**
   * Get server ID (for admin)
   */
  getServerId: publicProcedure.query(async () => {
    const license = await getOrCreateServerLicense();
    return { serverId: license.serverId };
  }),

  /**
   * Get license settings (public registration status)
   */
  getSettings: publicProcedure.query(async () => {
    // Get first license (there should be only one per server)
    const settings = await db.getLicenseSettings(1);
    return {
      allowPublicRegistration: settings?.allowPublicRegistration === 1 ? true : false,
    };
  }),

  /**
   * Update license settings (admin only)
   */
  updateSettings: adminProcedure
    .input(z.object({
      allowPublicRegistration: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const license = await db.getLicenseSettings(1);
      if (license) {
        await db.updateLicenseSettings(license.id, {
          allowPublicRegistration: input.allowPublicRegistration ? 1 : 0,
        });
      }
      return { success: true };
    }),
});

import { publicProcedure, router } from "../_core/trpc";
import {
  getOrCreateServerLicense,
  isLicenseValid,
  isTrialValid,
  activateLicense,
  getLicenseInfo,
} from "../license";
import { z } from "zod";

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
});

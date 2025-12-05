import type { Express, Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import * as db from "../db";
import { sdk } from "./sdk";

function getBodyParam(req: Request, key: string): string | undefined {
  const value = (req.body as any)?.[key];
  return typeof value === "string" ? value : undefined;
}

export function registerAuthRoutes(app: Express) {
  /**
   * Register new user
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const username = getBodyParam(req, "username");
      const password = getBodyParam(req, "password");
      const name = getBodyParam(req, "name");

      if (!username || !password || !name) {
        res.status(400).json({ error: "username, password, and name are required" });
        return;
      }

      // Check if user already exists
      const existingUser = await db.getUserByUsername(username);
      if (existingUser) {
        res.status(409).json({ error: "Username already exists" });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const userId = await db.createUser(username, passwordHash, name);
      const user = await db.getUserById(userId);

      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Generate JWT token
      const token = sdk.generateToken({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      // Set auth cookie
      sdk.setAuthCookie(res, token);

      res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] Register failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  /**
   * Login user
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const username = getBodyParam(req, "username");
      const password = getBodyParam(req, "password");

      if (!username || !password) {
        res.status(400).json({ error: "username and password are required" });
        return;
      }

      // Get user by username
      const user = await db.getUserByUsername(username);
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Generate JWT token
      const token = sdk.generateToken({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      // Set auth cookie
      sdk.setAuthCookie(res, token);

      res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  /**
   * Logout user
   */
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      sdk.clearAuthCookie(res);
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Logout failed", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });
}

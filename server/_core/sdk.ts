import type { Request } from "express";
import * as jwt from "jsonwebtoken";
import * as db from "../db";
import { ENV } from "./env";

const COOKIE_NAME = "auth_token";

function ForbiddenError(message: string) {
  const error = new Error(message);
  (error as any).statusCode = 403;
  return error;
}

function UnauthorizedError(message: string) {
  const error = new Error(message);
  (error as any).statusCode = 401;
  return error;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}

class SDKServer {
  /**
   * Generate JWT token
   */
  generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
    return jwt.sign(payload, ENV.jwtSecret, {
      expiresIn: "30d",
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, ENV.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse cookies from request
   */
  parseCookies(cookieHeader?: string): Map<string, string> {
    const cookies = new Map<string, string>();
    if (!cookieHeader) return cookies;

    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        cookies.set(key, decodeURIComponent(value));
      }
    });

    return cookies;
  }

  /**
   * Authenticate request using JWT token from cookie
   */
  async authenticateRequest(req: Request) {
    const cookies = this.parseCookies(req.headers.cookie);
    const token = cookies.get(COOKIE_NAME);

    if (!token) {
      throw UnauthorizedError("No auth token");
    }

    const payload = this.verifyToken(token);
    if (!payload) {
      throw UnauthorizedError("Invalid or expired token");
    }

    const user = await db.getUserById(payload.userId);
    if (!user) {
      throw UnauthorizedError("User not found");
    }

    // Update last signed in
    await db.updateUserLastSignedIn(user.id);

    return user;
  }

  /**
   * Create auth token and set cookie
   */
  setAuthCookie(res: any, token: string) {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });
  }

  /**
   * Clear auth cookie
   */
  clearAuthCookie(res: any) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
}

export const sdk = new SDKServer();

/**
 * CORS Middleware
 */

import type { Request, Response, NextFunction } from "express";

export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const origin = req.headers.origin;

  // Allow specific origins in production, all in development
  const allowedOrigins = process.env.NODE_ENV === "production"
    ? (process.env.ALLOWED_ORIGINS?.split(",") ?? [])
    : ["http://localhost:3000", "http://localhost:3001"];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (process.env.NODE_ENV !== "production") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  next();
}

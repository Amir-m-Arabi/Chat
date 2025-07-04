import { Request, Response, NextFunction } from "express";
import dotenv from 'dotenv'
import jwt from "jsonwebtoken";


dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// این اینترفیس برای اضافه کردن فیلد userData به Request استفاده می‌شود
export interface UserRequestAuthentication extends Request {
  userData?: { id?: number; type?: string };
}

// تابع کمکی برای استخراج توکن از هدر
const extractToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  const parts = authHeader.split(" ");

  return parts[0];
};

// تابع کمکی برای اعتبارسنجی توکن
const verifyToken = (token: string): { id: number; type: string } => {
  return jwt.verify(token, JWT_SECRET) as { id: number; type: string };
};

// Middleware برای احراز هویت ادمین (Normal & Super)
export const authenticateAdmin = (
  req: UserRequestAuthentication,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized. No token provided." });
      return;
    }
    const decoded = verifyToken(token);
    req.cookies.adminData = decoded;         // ✅
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

export const authenticateUser = (
  req: Request & { userData?: any },
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized. No token provided." });
      return;
    }
    const decoded = verifyToken(token);
    req.cookies.userData = decoded;          // ✅

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(403).json({ error: "Invalid or expired token." });
  }
};



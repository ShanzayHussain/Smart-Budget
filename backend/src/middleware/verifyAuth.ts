import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../firebaseAdmin";

// extend Express's Request type so req.uid is recognized elsewhere
declare global {
  namespace Express {
    interface Request {
      uid?: string;
    }
  }
}

export async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  const idToken = header.split("Bearer ")[1];

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
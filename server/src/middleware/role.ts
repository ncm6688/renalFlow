import { Response, NextFunction } from "express";
import User from "../models/user.model";
import { AuthedRequest } from "./auth";

export function requireRole(...roles: Array<"customer" | "admin">) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findById(req.userId).select("role");
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}


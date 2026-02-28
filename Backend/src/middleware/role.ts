import { Request, Response, NextFunction } from "express";

export function checkRole(allowedRoles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to perform this action" });
    }

    next();
  };
}

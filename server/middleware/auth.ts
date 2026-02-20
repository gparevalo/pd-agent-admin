import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../supabase";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  company_id: string; 
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }

  req.user = user;
  next();
}

export async function subscriptionMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  // Skip for superadmin
  if (req.user.role === "superadmin") {
    return next();
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", req.user.company_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!subscription) {
    return res.status(403).json({ message: "No hay suscripción activa" });
  }

  if (subscription.status !== "trial" && subscription.status !== "active") {
    return res.status(403).json({ message: "Suscripción vencida o suspendida" });
  }

  const endDate = new Date(subscription.end_date);
  if (endDate < new Date()) {
    // Update subscription to expired
    await supabase
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("id", subscription.id);
    return res.status(403).json({ message: "Suscripción expirada" });
  }

  next();
}

export function roleMiddleware(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "No tienes permisos para esta acción" });
    }

    next();
  };
}

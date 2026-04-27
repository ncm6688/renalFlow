import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

export function AuthGate({ children }: PropsWithChildren) {
  const token = useAuth((s) => s.accessToken);
  const loc = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}


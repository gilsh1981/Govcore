"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@prisma/client";
import { hasPermission, type Permission } from "@/lib/permissions";

interface RoleGateProps {
  children: React.ReactNode;
  permission?: Permission;
  roles?: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGate({ children, permission, roles, fallback = null }: RoleGateProps) {
  const { data: session } = useSession();
  if (!session) return <>{fallback}</>;

  const userRole = session.user.role;

  if (permission && !hasPermission(userRole, permission)) {
    return <>{fallback}</>;
  }

  if (roles && !roles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

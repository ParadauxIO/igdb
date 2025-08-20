import { useAuth } from "../../../state/hooks/useAuth.ts";
import type { ReactNode } from "react";
import { Outlet } from "react-router";

interface RoleGuardProps {
    fallback: ReactNode;           // e.g. <Navigate to="/login" replace state={{ from: location }} />
    requiredRoles: string[];       // e.g. ["updater"] or ["admin","updater"]
    layout?: ReactNode;            // optional wrapper layout
    allowAdminSuperset?: boolean;  // default true; treat admin as all roles
}

const ROLE_ORDER = ["viewer", "updater", "admin"] as const;
type Role = typeof ROLE_ORDER[number];

function rank(role?: string | null): number {
    return Math.max(ROLE_ORDER.indexOf((role as Role) ?? "viewer"), 0);
}

export default function RoleGuard({
                                      fallback,
                                      requiredRoles,
                                      layout,
                                      allowAdminSuperset = true,
                                  }: RoleGuardProps) {
    const { session, user, loading } = useAuth();

    // Hold fire until auth/profile is known
    if (loading) return fallback;

    if (!session || !user) return fallback;

    const requiredSet = new Set(requiredRoles);
    const userRole = user.permission_role as Role | undefined;

    // Basic membership check
    let allowed = requiredSet.has(userRole ?? "viewer");

    // Optional hierarchy: if any required role is <= admin, admin gets in
    if (!allowed && allowAdminSuperset && userRole === "admin") {
        // Only elevate if any required role is at or below admin in rank
        const maxRequiredRank = Math.max(...[...requiredSet].map(r => rank(r)));
        allowed = rank("admin") >= maxRequiredRank;
    }

    if (!allowed) {
        // If your fallback is a <Navigate>, pass the current location so you can bounce back after auth
        return typeof fallback === "object"
            ? fallback
            : fallback; // keep simple; caller controls Navigate/element
    }

    // Optional layout wrapper for protected sections
    if (layout) return <>{layout}</>;

    return <Outlet />;
}
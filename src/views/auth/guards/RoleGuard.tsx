
import { useAuth } from "../../../hooks/useAuth.ts";
import type {ReactNode} from "react";
import {Outlet} from "react-router";

interface RoleGuardProps {
    fallback: ReactNode;
    requiredRoles: string[];
}

export default function RoleGuard({ fallback, requiredRoles }: RoleGuardProps) {
    const { session, user } = useAuth();

    if (!session || !user || !requiredRoles.includes(user.permission_role)) {
        return fallback;
    }

    return <Outlet />;
}

import { useAuth } from "../../../state/hooks/useAuth.ts";
import type {ReactNode} from "react";
import {Outlet} from "react-router";

interface RoleGuardProps {
    fallback: ReactNode;
    requiredRoles: string[];
    layout?: ReactNode;
}

export default function RoleGuard({ fallback, requiredRoles, layout }: RoleGuardProps) {
    const { session, user } = useAuth();

    if (!session || !user || !requiredRoles.includes(user.permission_role)) {
        return fallback;
    }

    if (layout) {
        return layout;
    }

    return <Outlet />;
}
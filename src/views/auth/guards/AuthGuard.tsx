import {useAuth} from "../../../state/hooks/useAuth.ts";
import {Navigate, useLocation } from "react-router";
import {type JSX} from "react";

export default function AuthGuard({ children, fallback, publicRoutes }: { children: React.ReactNode; fallback: JSX.Element; publicRoutes: string[] }) {
    const { session, user } = useAuth();
    const location = useLocation();

    if (!session && !publicRoutes.includes(location.pathname)) {
        return fallback;
    }

    // Ensure a user has accepted terms before accessing protected routes
    if (session && !user?.has_accepted_terms && location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" replace state={{ from: location }} />;
    }


    return <>{children}</>;
}
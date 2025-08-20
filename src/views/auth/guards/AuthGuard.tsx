import { useAuth } from "../../../state/hooks/useAuth.ts";
import { Navigate, useLocation, matchPath } from "react-router";
import { useEffect, useMemo, useRef, useState, type JSX } from "react";

type Props = {
    children: React.ReactNode;
    /** What to render while we’re determining auth (spinner, skeleton, etc.) */
    loadingElement?: JSX.Element;
    /** What to render when the user definitively isn’t allowed (e.g. <Navigate to="/login" .../>) */
    fallback: JSX.Element;
    /** e.g. ["/login", "/reset/*", "/callback/*", "/onboarding"] */
    publicRoutes: string[];
    /** Optional debounce to avoid micro-flickers during fast refreshes (ms). Default 120. */
    loadingDebounceMs?: number;
};

export default function AuthGuard({
                                      children,
                                      loadingElement = undefined,
                                      fallback,
                                      publicRoutes,
                                      loadingDebounceMs = 120,
                                  }: Props) {
    const { session, user, loading } = useAuth();
    const location = useLocation();

    // Robust public-route check with wildcards
    const isPublic = useMemo(
        () => publicRoutes.some((p) => !!matchPath({ path: p, end: false }, location.pathname)),
        [publicRoutes, location.pathname]
    );

    // Debounce "loading" to avoid 1–2 frame flashes during token refresh / focus resume
    const [showLoading, setShowLoading] = useState(loading);
    const tRef = useRef<number | null>(null);
    useEffect(() => {
        if (tRef.current) window.clearTimeout(tRef.current);
        if (loading) {
            tRef.current = window.setTimeout(() => setShowLoading(true), loadingDebounceMs);
        } else {
            setShowLoading(false);
        }
        return () => {
            if (tRef.current) window.clearTimeout(tRef.current);
        };
    }, [loading, loadingDebounceMs]);

    // Never redirect while loading; just render loadingElement (or nothing)
    if (showLoading) return loadingElement;

    // If no session and route is not public, use the real fallback (typically a Navigate to /login)
    if (!session && !isPublic) {
        return fallback;
    }

    // Only gate on terms once we’re sure we’re not loading
    const hasAccepted = user?.has_accepted_terms === true;

    if (session && !isPublic && !hasAccepted && location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" replace state={{ from: location }} />;
    }

    // If terms accepted but user is on onboarding, punt them home
    if (session && hasAccepted && location.pathname === "/onboarding") {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

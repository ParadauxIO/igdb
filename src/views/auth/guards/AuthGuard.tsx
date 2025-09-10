import { useAuth } from "../../../state/hooks/useAuth.ts";
import { Navigate, useLocation, matchPath } from "react-router";
import { useEffect, useMemo, useRef, useState, type JSX } from "react";

type Props = {
    children: React.ReactNode;
    loadingElement?: JSX.Element;
    fallback: JSX.Element;
    publicRoutes: string[];
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

    const isPublic = useMemo(
        () => publicRoutes.some((p) => !!matchPath({ path: p, end: false }, location.pathname)),
        [publicRoutes, location.pathname]
    );

    // Debounce the global loading flag
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

    // ── Terms gating: only decide once we KNOW the value
    const terms = user?.has_accepted_terms;                // boolean | undefined
    const termsKnown = typeof terms === "boolean";         // false while profile not loaded
    const termsAccepted = terms === true;

    // If auth is loading OR we don't yet know the terms status (but need it), show loader.
    // This prevents the onboarding flash.
    const needTermsToDecide = !!session && !isPublic;
    if (showLoading || (needTermsToDecide && !termsKnown)) {
        return loadingElement ?? null;
    }

    // No session and route is private → bounce to fallback (e.g. /login)
    if (!session && !isPublic) {
        return fallback;
    }

    // Session present, private route, and we definitively know terms are NOT accepted → go onboard
    if (session && !isPublic && termsKnown && !termsAccepted && location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" replace state={{ from: location }} />;
    }

    // If terms are accepted but user somehow is on /onboarding → punt them home
    if (session && termsAccepted && location.pathname === "/onboarding") {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

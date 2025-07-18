import {useAuth} from "../../hooks/useAuth.ts";
import {useLocation} from "react-router";
import {type JSX} from "react";

export default function AuthGuard({ children, fallback, publicRoutes }: { children: React.ReactNode; fallback: JSX.Element; publicRoutes: string[] }) {
    const { session } = useAuth();
    const location = useLocation();

    if (!session && !publicRoutes.includes(location.pathname)) {
        return fallback;
    }
    return <>{children}</>;
}
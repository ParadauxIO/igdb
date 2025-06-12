import type { JSX, ReactNode } from "react";
import { useAuthSession } from "../hooks/useAuthSession";

export default function ProtectedView(props: { authView: JSX.Element, children: ReactNode }) {
    const session = useAuthSession();
    return (
        session ? <>{props.children}</> : props.authView
    );
}
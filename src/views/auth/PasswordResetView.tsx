import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../state/supabaseClient";
import { Link, useLocation, useNavigate } from "react-router";

export default function PasswordResetView() {
    const location = useLocation();
    const navigate = useNavigate();
    const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const accessToken = qs.get("access_token");
    const type = qs.get("type");
    const isRecovery = !!accessToken && type === "recovery";

    // common ui state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // request link state
    const [email, setEmail] = useState("");

    // change password state
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    useEffect(() => {
        setError(null);
        setSuccess(null);
    }, [isRecovery]);

    const handleRequestLink = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
                redirectTo: `${import.meta.env.VITE_PUBLIC_URL}/user/profile`,
            });
            if (error) throw error;
            setSuccess("If that email exists, we’ve sent a reset link.");
        } catch (_err) {
            // Don’t leak specifics
            setSuccess("If that email exists, we’ve sent a reset link.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!password || password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords don’t match.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess("Password updated. You can sign in now.");
            // Nudge back to login after a moment
            setTimeout(() => navigate("/", { replace: true }), 1200);
        } catch (err) {
            console.error(err);
            setError("Couldn’t update password. Try the link again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth">
            <div className="container">
                <div className="form-wrapper">
                    <h2 className="title">
                        {isRecovery ? "Set a new password" : "Forgot your password"}
                    </h2>
                    <p className="subtitle">
                        {isRecovery
                            ? "Enter a new password for your account."
                            : "We’ll email you a link to reset it."}
                    </p>

                    {!isRecovery ? (
                        <form className="form" onSubmit={handleRequestLink} autoComplete="on">
                            <div className="input-group">
                                <label htmlFor="email" className="label">Email</label>
                                <input
                                    id="email"
                                    className="input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                    placeholder="Enter your email"
                                    spellCheck={false}
                                />
                            </div>

                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <button
                                type="submit"
                                className={`button ${isLoading ? "is-loading" : ""}`}
                                disabled={isLoading || !email}
                            >
                                {isLoading ? "Sending…" : "Send reset link"}
                            </button>

                            <div className="footer">
                                <Link to="/login" className="link">Back to sign in</Link>
                            </div>
                        </form>
                    ) : (
                        <form className="form" onSubmit={handleChangePassword} autoComplete="off">
                            <div className="input-group">
                                <label htmlFor="password" className="label">New password</label>
                                <input
                                    id="password"
                                    className="input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    placeholder="Enter a new password"
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="confirm" className="label">Confirm password</label>
                                <input
                                    id="confirm"
                                    className="input"
                                    type="password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    placeholder="Re-enter your new password"
                                />
                            </div>

                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <button
                                type="submit"
                                className={`button ${isLoading ? "is-loading" : ""}`}
                                disabled={isLoading || !password || !confirm}
                            >
                                {isLoading ? "Updating…" : "Update password"}
                            </button>

                            <div className="footer">
                                <Link to="/login" className="link">Back to sign in</Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
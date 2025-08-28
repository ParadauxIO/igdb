import {useState} from "react";
import {signInWithEmail} from "../../partials/auth.ts";
import "./AuthView.scss";

export default function AuthView() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email || !password) return; // basic guard
        setIsLoading(true);
        setError(null);
        try {
            await signInWithEmail(email.trim().toLowerCase(), password);
        } catch (err) {
            setError('Invalid email or password');
            console.error('Login failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='auth'>
            <div className='container'>
                <div className='form-wrapper'>
                    <h2 className='title'>guidedogs.ie portal</h2>
                    <p className='subtitle'>Sign in to your account</p>

                    <form className='form' onSubmit={handleSubmit} autoComplete="on">
                        <div className='input-group'>
                            <label htmlFor="email" className='label'>Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className='input'
                                placeholder="Enter your email"
                                autoComplete="email"
                                spellCheck={false}
                            />
                        </div>

                        <div className='input-group'>
                            <label htmlFor="password" className='label'>Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className='input'
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                        </div>

                        {error && <div className="error">{error}</div>}

                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className={`button ${isLoading ? 'is-loading' : ''}`}
                        >
                            {isLoading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <div className='footer'>
                        {/* Your routes use /reset/*, not /forgotten */}
                        <a href="/reset" className='link'>Forgot your password?</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
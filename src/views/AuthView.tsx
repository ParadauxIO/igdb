import { useState } from 'react';
import { signInWithEmail } from '../partials/auth.ts';
import "./AuthView.scss";
export default function AuthView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  interface HandleSubmitEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> {
    preventDefault: () => void;
  }

  const handleSubmit = async (e: HandleSubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
    } catch (error: unknown) {
      console.error('Login failed:', error);
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

          <div className='form'>
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
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              onClick={handleSubmit}
              className='button'
              style={{
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className='footer'>
            <a href="#" className='link'>Forgot your password?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
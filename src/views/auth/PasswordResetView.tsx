import {useState} from "react";
import {supabase} from "../../state/supabaseClient.ts";

export default function PasswordResetView() {

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  interface HandleSubmitEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> {
    preventDefault: () => void;
  }

  const handleSubmit = async (e: HandleSubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await supabase.auth.resetPasswordForEmail(password);
    } catch (error: unknown) {
      console.error('Password set failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='forgotten-password'>
      <div className='container'>
        <div className='form-wrapper'>
          <h2 className='title'>guidedogs.ie portal</h2>
          <p className='subtitle'>New Password</p>

          <div className='form'>
            <div className='input-group'>
              <label htmlFor="email" className='label'>Password</label>
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
              {isLoading ? 'Resetting Password ...' : 'Resetting Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import {useState} from "react";
import {supabase} from "../../state/supabaseClient.ts";

/**
 * https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
 */
export default function ForgottenView() {

    const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  interface HandleSubmitEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> {
    preventDefault: () => void;
  }

  const handleSubmit = async (e: HandleSubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        await supabase.auth.updateUser({ password: 'new_password' })
    } catch (error: unknown) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='forgotten-password'>
      <div className='container'>
        <div className='form-wrapper'>
          <h2 className='title'>guidedogs.ie portal</h2>
          <p className='subtitle'>What is your email address?</p>

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
              {isLoading ? 'Sending Password Reset Email...' : 'Sending Password Reset Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
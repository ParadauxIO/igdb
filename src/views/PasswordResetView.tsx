import NavBar from "../components/NavBar.tsx";
import {useEffect, useMemo, useState} from "react";
import type {User} from "../types/User.ts";
import {supabase} from "../state/supabaseClient.ts";
//import "./DogView.scss";
import {createColumnHelper, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {FaEllipsisH, FaPlus} from "react-icons/fa";
import {useNavigate} from "react-router";
// import UserTable from "../components/UserTable.tsx";
import Table from "../components/Table.tsx";
import Card from "../components/Card.tsx";

const columnHelper = createColumnHelper<User>()

/**
 * 
 * 
 * https://github.com/JMaylor/vuepabase/tree/5e5668af6b4430a0c6dc7f6b72b38f885de2d2de/src/views/auth
 * 
 * @returns 
 * const handleSubmit = async (e: React.FormEvent) => {
        const { error, data } = await supabase.auth.api.updateUser(resetToken, {
            password: password.value,
        });
        console.log(error, data);
    };
 * 
 */
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
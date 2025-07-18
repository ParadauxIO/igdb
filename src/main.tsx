import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from "react-router";

import './style/reset.scss';
import HomeView from './views/HomeView.tsx';

import LogoutView from './views/auth/LogoutView.tsx';
import PasswordForgottenView from './views/auth/PasswordForgottenView.tsx';
import PasswordResetView from './views/auth/PasswordResetView.tsx';

import DogView from "./views/dogs/DogView.tsx";
import DogEditView from "./views/dogs/DogEditView.tsx";
import DogCreateView from "./views/dogs/DogCreateView.tsx";
import PostUpdateView from './views/updates/PostUpdateView';

import UsersView from "./views/user/UsersView.tsx";
import UserInviteView from "./views/user/UserInviteView.tsx";
import UserProfileView from "./views/user/UserProfileView.tsx";
import {AuthProvider} from "./state/context/AuthContext.tsx";
import AuthGuard from "./views/auth/AuthGuard.tsx";
import AuthView from "./views/auth/AuthView.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <AuthGuard fallback={<AuthView/>} publicRoutes={[]}>
                    <Routes>
                        <Route path="/" element={<HomeView/>}/>
                        <Route path="/logout" element={<LogoutView/>}/>
                        <Route path="/reset" element={<PasswordResetView/>}/>
                        <Route path="/forgotten" element={
                            <PasswordForgottenView/>}/>
                        <Route path="/post-update" element={<PostUpdateView/>}/>
                        <Route path="/dogs" element={<DogView/>}/>
                        <Route path="/dogs/edit/:dogId" element={<DogEditView/>}/>
                        <Route path="/dogs/create" element={<DogCreateView/>}/>
                        <Route path="/users" element={<UsersView/>}/>
                        <Route path="/users/profile" element={<UserProfileView/>}/>
                        <Route path="/users/profile/:userId" element={<UserProfileView/>}/>
                        <Route path="/users/invite" element={<UserInviteView/>}/>
                    </Routes>
                </AuthGuard>
                v </BrowserRouter>
        </AuthProvider>
    </StrictMode>
    ,
)

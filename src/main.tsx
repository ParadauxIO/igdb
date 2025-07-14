import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router";

import './style/reset.scss';
import './main.scss';
import ProtectedView from './views/ProtectedView.tsx';
import AuthView from './views/AuthView.tsx';
import HomeView from './views/HomeView.tsx';

import LogoutView from './views/LogoutView.tsx';
import DogView from "./views/DogView.tsx";
import DogEditView from "./views/DogEditView.tsx";
import DogCreateView from "./views/DogCreateView.tsx";
import PostUpdateView from './views/PostUpdateView';

import UserView from "./views/UserView.tsx";
import UserInviteView from "./views/UserInviteView.tsx";
import UserProfileView from "./views/UserProfileView.tsx";
import UserCreateView from "./views/UserCreateView.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProtectedView authView={<AuthView/>}> {/* This is the auth view that will be shown if the user is not authenticated */}
      <BrowserRouter> {/* This is the router that maps endpoints to particular components */}
        <Routes>
            <Route path="/" element={<HomeView/>} />
            <Route path="/logout" element={<LogoutView/>} />
            <Route path="/post-update" element={<PostUpdateView/>} />
            <Route path="/dogs" element={<DogView/>} />
            <Route path="/dogs/edit/:dogId" element={<DogEditView/>} />
            <Route path="/dogs/create" element={<DogCreateView/>} />
            <Route path="/users" element={<UserView/>} />
            <Route path="/users/profile/:id" element={<UserProfileView/>} />
            <Route path="/users/invite" element={<UserInviteView/>} />
            <Route path="/users/create" element={<UserCreateView/>} />
        </Routes>
      </BrowserRouter>
    </ProtectedView>
  </StrictMode>,
)

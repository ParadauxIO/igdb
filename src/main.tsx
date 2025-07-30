import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from "react-router";
import './style/reset.scss';
import HomeView from './views/HomeView.tsx';
import LogoutView from './views/auth/LogoutView.tsx';
import PostUpdateView from './views/updates/PostUpdateView';
import AdminUsersView from "./views/admin/user/AdminUsersView.tsx";
import UserInviteView from "./views/admin/user/UserInviteView.tsx";
import UserProfileView from "./views/user/UserProfileView.tsx";
import {AuthProvider} from "./state/context/AuthContext.tsx";
import AuthGuard from "./views/auth/guards/AuthGuard.tsx";
import AuthView from "./views/auth/AuthView.tsx";
import DogView from "./views/dogs/DogView.tsx";
import RoleGuard from "./views/auth/guards/RoleGuard.tsx";
import NotAuthorisedView from "./views/errors/NotAuthorisedView.tsx";
import AdminEditDogView from "./views/admin/dogs/AdminEditDogView.tsx";
import AdminDogView from "./views/admin/dogs/AdminDogView.tsx";
import AuthenticatedLayout from "./views/layouts/AuthenticatedLayout.tsx";
import AdminLayout from "./views/layouts/AdminLayout.tsx";
import AdminDashboardView from "./views/admin/AdminDashboardView.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <AuthGuard fallback={<AuthView/>} publicRoutes={[]}>
                    <Routes>
                        {/* Authenticated Routes: requires valid session */}
                        <Route path="/" element={<AuthenticatedLayout/>}>
                            <Route path="" element={<HomeView/>}/>
                            <Route path="users/profile" element={<UserProfileView/>}/>
                            <Route path="logout" element={<LogoutView/>}/>
                            <Route path="dogs" element={<DogView/>}/>

                            {/* Updater Routes: requires updater or admin permission */}
                            <Route path="/update" element={<RoleGuard fallback={<NotAuthorisedView />} requiredRoles={["admin", "updater"]}/>}>
                                <Route path="post" element={<PostUpdateView/>}/>
                            </Route>

                            {/*<Route path="/test" element={<TestPage/>}/>*/}
                        </Route>

                        {/* Admin Routes: requires admin role */}
                        <Route path="/admin" element={<RoleGuard fallback={<NotAuthorisedView />} requiredRoles={["admin"]} layout={<AdminLayout/>}/>}>
                            <Route path="" element={<AdminDashboardView/>}/>
                            <Route path="dogs" element={<AdminDogView/>}/>
                            <Route path="dogs/edit/:dogId" element={<AdminEditDogView />} />
                            <Route path="dogs/create" element={<AdminEditDogView />} />
                            <Route path="users" element={<AdminUsersView/>}/>
                            <Route path="users/profile/:userId" element={<UserProfileView/>}/>
                            <Route path="users/invite" element={<UserInviteView/>}/>
                        </Route>
                    </Routes>
                </AuthGuard>
            </BrowserRouter>
        </AuthProvider>
    </StrictMode>
)

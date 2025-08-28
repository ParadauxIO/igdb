import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
    BrowserRouter,
    Route,
    Routes,
    Navigate,
} from "react-router";
import "./style/reset.scss";

import HomeView from "./views/HomeView.tsx";
import LogoutView from "./views/auth/LogoutView.tsx";
import PostUpdateView from "./views/updates/PostUpdateView";
import AdminUsersView from "./views/admin/user/AdminUsersView.tsx";
import UserInviteView from "./views/admin/user/UserInviteView.tsx";
import UserProfileView from "./views/user/UserProfileView.tsx";
import { AuthProvider } from "./state/context/AuthContext.tsx";
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
import AdminEditUserView from "./views/admin/user/AdminEditUserView.tsx";
import OnboardingView from "./views/auth/OnboardingView.tsx";
import PasswordResetView from "./views/auth/PasswordResetView.tsx";

// tiny loading element so we don't flash the login screen during refresh
const Loading = <div style={{ padding: 24, textAlign: "center" }}>Loading…</div>;

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AuthProvider>
            <BrowserRouter>
                {/* Guard everything, but distinguish loading vs unauthenticated */}
                <AuthGuard
                    publicRoutes={["/login", "/reset", "/callback/*", "/onboarding"]}
                    loadingElement={Loading}
                    // unauthenticated → show the login screen (not during loading)
                    fallback={<AuthView />}
                >
                    <Routes>
                        {/* Public-ish routes (no chrome). AuthGuard still enforces onboarding redirect logic */}
                        <Route path="/login" element={<AuthView />} />
                        <Route path="/onboarding" element={<OnboardingView />} />

                        {/* Authenticated area with app chrome */}
                        <Route path="/" element={<AuthenticatedLayout />}>
                            <Route index element={<HomeView />} />
                            <Route path="users/profile" element={<UserProfileView />} />
                            <Route path="logout" element={<LogoutView />} />
                            <Route path="dogs" element={<DogView />} />

                            {/* Updater/Admin gated section */}
                            <Route
                                element={
                                    <RoleGuard
                                        fallback={<NotAuthorisedView />}
                                        requiredRoles={["admin", "updater"]}
                                    />
                                }
                            >
                                <Route path="update/post" element={<PostUpdateView />} />
                            </Route>
                        </Route>

                        {/* Admin area */}
                        <Route
                            path="/admin"
                            element={
                                <RoleGuard
                                    fallback={<NotAuthorisedView />}
                                    requiredRoles={["admin"]}
                                    layout={<AdminLayout />}
                                />
                            }
                        >
                            <Route index element={<AdminDashboardView />} />
                            <Route path="dogs" element={<AdminDogView />} />
                            <Route path="dogs/edit/:dogId" element={<AdminEditDogView />} />
                            <Route path="dogs/create" element={<AdminEditDogView />} />
                            <Route path="users" element={<AdminUsersView />} />
                            <Route path="users/edit/:userId" element={<AdminEditUserView />} />
                            <Route path="users/invite" element={<UserInviteView />} />
                        </Route>

                        {/* Default */}
                        <Route path="/reset" element={<PasswordResetView />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AuthGuard>
            </BrowserRouter>
        </AuthProvider>
    </StrictMode>
);

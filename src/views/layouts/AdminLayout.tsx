import {Outlet} from "react-router";
import AdminHeader from "../../components/admin/AdminHeader.tsx";

export default function AdminLayout() {
    return (
        <div className="admin-layout">
            <AdminHeader/>
            <Outlet/>
        </div>
    );
}
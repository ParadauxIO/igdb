import Header from "../../components/Header.tsx";
import {Outlet} from "react-router";

export default function AdminLayout() {
    return (
        <div className="admin-layout">
            <Header/>
            <Outlet/>
        </div>
    );
}
import Header from "../../components/nav/Header.tsx";
import {Outlet} from "react-router";

export default function AuthenticatedLayout() {
    return (
        <div className="authenticated-layout">
            <Header/>
            <Outlet/>
        </div>
    );
}
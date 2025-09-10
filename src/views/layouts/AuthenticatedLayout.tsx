import Header from "../../components/nav/Header.tsx";
import Footer from "../../components/general/Footer";
import {Outlet} from "react-router";

export default function AuthenticatedLayout() {
    return (
        <div className="authenticated-layout">
            <Header/>
            <Outlet/>
            <Footer/>
        </div>
    );
}
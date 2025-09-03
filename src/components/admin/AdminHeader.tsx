import { Link, NavLink, useLocation } from "react-router";
import { useEffect, useState } from "react";
import "../nav/Header.scss";

export default function AdminHeader() {
    const [navOpen, setNavOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setNavOpen(false);
    }, [location.pathname]);

    return (
        <header className="primary-header admin-header flex">
            <div className="logo">
                <Link to="/">
                    <img src="/logo.svg" alt="Irish Guide Dogs for the Blind Logo" />
                </Link>
                <h3>Admin Panel</h3>
            </div>

            <button
                type="button"
                className={`hamburger${navOpen ? " is-active" : ""}`}
                aria-controls="primary-navigation"
                aria-expanded={navOpen}
                aria-label="Menu"
                onClick={() => setNavOpen((prev) => !prev)}
            >
                <div className="bar" />
            </button>

            <nav role="navigation" aria-label="Primary">
                <ul
                    id="primary-navigation"
                    className="primary-navigation flex"
                    data-visible={navOpen}
                >
                    <li><NavLink to="/admin">Dashboard</NavLink></li>
                    <li><NavLink to="/admin/users">Users</NavLink></li>
                    <li><NavLink to="/admin/dogs">Dogs</NavLink></li>
                    <li><NavLink to="/">Back</NavLink></li>
                </ul>
            </nav>
        </header>
    );
}
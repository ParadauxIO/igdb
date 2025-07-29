import {Link, useLocation} from "react-router";
import {useEffect, useState} from "react";

import "../nav/Header.scss";

export default function AdminHeader() {
    let [navOpen, setNavOpen] = useState(false);
    const location = useLocation();

    // 👇 Reset navOpen on route change
    useEffect(() => {
        setNavOpen(false);
    }, [location.pathname]);

    return (
        <header className="primary-header flex admin-header">
            <h1 className="logo">
                <a href="/">
                    <img src="/logo.svg" alt="Irish Guide Dogs for the Blind Logo"/>
                </a>
                <h3>Admin Panel</h3>
            </h1>

            <button
                className={"hamburger" + (navOpen ? " is-active" : "")}
                aria-controls="primary-navigation"
                aria-expanded={`${navOpen}`}
                aria-label="Menu"
                onClick={() => {
                    setNavOpen(prev => !prev)
                }}
            >
                <div className="bar"/>
            </button>

            <nav>
                <ul
                    id="primary-navigation"
                    className="primary-navigation flex"
                    data-visable={`${navOpen}`}
                >
                    <li><Link to="/admin">Dashboard</Link></li>
                    <li><Link to="/admin/users">Users</Link></li>
                    <li><Link to="/admin/dogs">Dogs</Link></li>

                    <li><Link to="/">Back</Link></li>
                    {/*<li><Link to="/dogs">Dogs</Link></li>*/}
                    {/*{isUpdater && <li><Link to="/update/post">Post Update</Link></li>}*/}
                    {/*{isAdmin && <li><Link to="/admin">Admin</Link></li>}*/}
                    {/*{ user && (*/}
                    {/*    <li><Link to="/users/profile">{user.name ? user.name : "Your profile"}</Link></li>*/}
                    {/*)}*/}
                    {/*<li><Link to="/logout">Logout</Link></li>*/}
                </ul>

            </nav>
        </header>
    )
}
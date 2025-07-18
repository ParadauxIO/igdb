import {Link} from "react-router";
import {useState} from "react";

import "./Header.scss";
import {useAuth} from "../hooks/useAuth.ts";

export default function Header() {
    let [navOpen, setNavOpen] = useState(false);
    const {user} = useAuth();

    return (
        <header className="primary-header flex">
            <h1 className="logo">
                <a href="/">
                    <img src="/logo.svg" alt="Irish Guide Dogs for the Blind Logo"/>
                </a>
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
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/dogs">Our Dogs</Link></li>
                    <li><Link to="/post-update">Post Update</Link></li>
                    <li><Link to="/users">Our Users</Link></li>
                    { user && (
                        <li><Link to="/users/profile">{user.name ? user.name : "Your profile"}</Link></li>
                    )}
                    <li><Link to="/logout">Logout</Link></li>
                </ul>

            </nav>
        </header>
    )
}
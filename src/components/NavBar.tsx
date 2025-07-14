import { Link } from "react-router";
import "./NavBar.scss";

export default function NavBar() {
    return (
        <nav className="navbar">
            <div className="navbar_left">
                <a href="/">
                    <img src="./logo.svg" width="165" height="85" alt="Irish Guide Dogs Logo"/>
                </a>
            </div>
            <div className="navbar_right">
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/dogs">Our Dogs</Link></li>
                    <li><Link to="/post-update">Post Update</Link></li>
                    <li><Link to="/users">Our Users</Link></li>
                    <li><Link to="/logout">Logout</Link></li>
                </ul>
            </div>
        </nav>
    )
}
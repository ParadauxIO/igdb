import { Link } from "react-router";
import "./NavBar.scss";

export default function NavBar() {
    return (
        <nav className="navbar">
            <div className="navbar_left">
                <h2>guidedogs.ie portal</h2>
            </div>
            <div className="navbar_right">
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/dogs">Our Dogs</Link></li>
                    <li><Link to="/logout">Logout</Link></li>
                </ul>
            </div>
        </nav>
    )
}
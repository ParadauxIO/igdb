import "./Footer.scss";
import {Link} from "react-router";

const Footer: React.FC = () => {
    return (
        <footer className="igdb-footer">
            <div className="footer__content">
                <span className="footer__copy">
                    © {new Date().getFullYear()} Irish Guide Dogs.
                </span>
                {" "}<Link to="/terms">Terms</Link>
            </div>
        </footer>
    );
};

export default Footer;
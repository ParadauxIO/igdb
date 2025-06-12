import NavBar from "../components/NavBar";
import FeedView from "./FeedView";
import "./HomeView.scss"
export default function HomeView() {
    return (
        <div className="home">
            <NavBar/>
            <div className="home-feed">
                <FeedView/>
            </div>
        </div>

    )
}
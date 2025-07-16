import Header from "../components/Header.tsx";
import FeedView from "./FeedView";
import "./HomeView.scss"
export default function HomeView() {
    return (
        <div className="home">
            <Header/>
            <div className="home-feed">
                <FeedView/>
            </div>
        </div>

    )
}
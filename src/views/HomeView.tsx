import Header from "../components/Header.tsx";
import UpdateFeed from "../components/UpdateFeed.tsx";
import "./HomeView.scss"
export default function HomeView() {
    return (
        <div className="home">
            <Header/>
            <div className="home-feed">
                <UpdateFeed/>
            </div>
        </div>

    )
}
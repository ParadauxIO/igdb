import NavBar from "../components/NavBar.tsx";
import {useEffect, useState} from "react";
import type {Dog} from "../types/Dog.ts";
import {supabase} from "../state/supabaseClient.ts";
import "./DogView.scss";

export default function DogView() {
    const [dogs, setDogs] = useState<Dog[]>([])
    const [filter, setFilter] = useState<string>("");
    const [loading, setLoading] = useState(true);

    // Filter out dogs based on what their name starts with
    const filteredDogs = dogs.filter(dog => dog.dog_name.toLowerCase().startsWith(filter));

    useEffect(() => {
        const fetchDogs = async () => {
            setLoading(true);
            const {data, error} = await supabase
                .from('dogs')
                .select("*")
                .eq("dog_is_active", true)
                .order("dog_created_at", {ascending: false});

            if (error) {
                console.log("Error occured while fetching dogs:", error);
                return;
            }

            if (data) {
                setDogs(data);
            }

            setLoading(false);
        }
        fetchDogs();
    }, []);

    return (
        <div className="dog-view">
            <NavBar/>
            <div className="dog-view-container">
                <div className={"dog-view-settings"}>
                    <h1>Our Dogs...</h1>
                    <input type="text" placeholder={"search"} value={filter} onChange={(text) => setFilter(text.target.value)}/>
                </div>
                <div>
                    {
                        loading ? (
                            <div>Loading dogs...</div>
                        ) : (
                            <div className="dog-feed">
                                {filteredDogs.map(dog => (
                                    <div key={dog.dog_id} className="dog-feed-item">
                                        <div className="dog-image-container">
                                            {dog.dog_picture && (
                                                <img src={dog.dog_picture}/>
                                            )}
                                        </div>
                                        <div className="dog-container">
                                            <h2>{dog.dog_name}</h2>
                                            <hr/>
                                            <p><strong>Breed:</strong> {dog.dog_breed}</p>
                                            <p><strong>Role:</strong> {dog.dog_role}</p>
                                            <p>... any more fields we wish to show</p>
                                            <button>Edit</button>
                                            <button>Disable</button>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}
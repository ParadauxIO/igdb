import { useEffect, useState } from "react";
import type { Dog } from "../../types/Dog.ts";
import "./DogView.scss";
import {getDogsPublic} from "../../partials/dog.ts";
import {getDogsUserIsFollowing, followDog, unfollowDog} from "../../partials/dogfollowing.ts";

import {useAuth} from "../../state/hooks/useAuth.ts";

export default function DogView() {
    const {user} = useAuth();
    const [dogs, setDogs] = useState<Dog[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFollowing, setIsFollowing] = useState<string[]>([]);

    // load the dogs this user is following
    async function fetchUserDogFollowers() {
        const isFollowing = await getDogsUserIsFollowing(user?.id);
        setIsFollowing(isFollowing);
    }

    useEffect(() => {
        async function fetchDogs() {
            const dogs = await getDogsPublic();
            setDogs(dogs);
        }
        fetchDogs();
           
        fetchUserDogFollowers();
    }, []);

    const handleSubmit = async function toggleDogFollower(user_id, dog_id) {
        console.log('toggleDogFollower()',user_id,dog_id);
        if(isFollowing.includes(dog_id)) {
            // unfollow by deleting
            await unfollowDog(user_id, dog_id);
        } else {
            // follow by adding
            await followDog(user_id, dog_id);
        }
        fetchUserDogFollowers();
    }

    // 🔎 Filter dogs by search term
    const filteredDogs = dogs.filter(dog =>
        dog.dog_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="user-dog-view p-4">
            <div>User: {user?.id || 'Unknown'}</div>
            <div>Following: {isFollowing || 'Unknown'}</div>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search by dog name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border border-gray-300 rounded w-full max-w-md"
                />
            </div>

            <table className="dog-table w-full border-collapse">
                <thead>
                <tr className="bg-gray-100 text-left">
                    <th className="p-2 border">Picture</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Year of Birth</th>
                    <th className="p-2 border">Role</th>
                    <th className="p-2 border">Sex</th>
                    <th className="p-2 border">Follow</th>
                </tr>
                </thead>
                <tbody>
                {
                    filteredDogs.map((dog, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="p-2 border">
                                <img
                                    src={dog.dog_picture ?? ""}
                                    alt={"Picture of " + dog.dog_name}
                                    className="w-24 h-auto object-cover"
                                />
                            </td>
                            <td className="p-2 border font-semibold">{dog.dog_name}</td>
                            <td className="p-2 border">{dog.dog_yob}</td>
                            <td className="p-2 border">{dog.dog_role}</td>
                            <td className="p-2 border">{dog.dog_sex}</td>
                            <td className="p-2 border">
                                <button className="follow-button bg-blue-500 text-white px-4 py-2 rounded" 
                                    onClick={() => handleSubmit(user?.id, dog.dog_id)}>
                                    {isFollowing.includes(dog.dog_id) ? "Unfollow:"+dog.dog_id : "Follow:"+dog.dog_id}
                                </button>
                            </td>
                        </tr>
                    ))
                }
                </tbody>
            </table>
        </div>
    );
}
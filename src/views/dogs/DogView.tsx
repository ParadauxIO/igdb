import { useEffect, useState } from "react";
import type { Dog } from "../../types/Dog.ts";
import "./DogView.scss";
import {getDogsPublic} from "../../partials/dog.ts";

export default function DogView() {
    const [dogs, setDogs] = useState<Dog[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function fetchDogs() {
            const dogs = await getDogsPublic();
            setDogs(dogs);
        }
        fetchDogs();
    }, []);

    // 🔎 Filter dogs by search term
    const filteredDogs = dogs.filter(dog =>
        dog.dog_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="user-dog-view p-4">
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
                                <button className="follow-button bg-blue-500 text-white px-4 py-2 rounded">
                                    Follow
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
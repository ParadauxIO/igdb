import React, {useState, useEffect, useRef} from 'react';
import type {User} from "../../types/User.ts";
import "./LookupInput.scss";

interface LookupInputProps {
    label: string;
    name: string;
    value: string | undefined | null;
    placeholder: string;
    onSelect: (user: User | null) => void;
    searchFunc: (query: string) => Promise<User[]>;
    displayField?: keyof User;
}

export default function LookupInput({
                                        label,
                                        name,
                                        value,
                                        placeholder,
                                        onSelect,
                                        searchFunc,
                                        displayField = 'name'
                                    }: LookupInputProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle search when query changes
    useEffect(() => {
        if (isSearching && query.trim()) {
            const timeoutId = setTimeout(() => {
                searchFunc(query).then(users => {
                    setResults(users);
                }).catch(err => {
                    console.error("Search error:", err);
                    setResults([]);
                });
            }, 300); // Debounce search

            return () => clearTimeout(timeoutId);
        } else if (!isSearching) {
            setResults([]);
        }
    }, [query, searchFunc, isSearching]);

    // Reset when value changes externally (form reset, etc.)
    useEffect(() => {
        if (!value) {
            setSelectedUser(null);
            setQuery('');
        }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        setIsSearching(true);

        // Clear selection when user starts typing
        if (selectedUser) {
            setSelectedUser(null);
            onSelect(null);
        }
    };

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setQuery(String(user[displayField]));
        setResults([]);
        setIsSearching(false);
        onSelect(user);
        inputRef.current?.blur();
    };

    const handleInputBlur = () => {
        // Small delay to allow click on suggestion to work
        setTimeout(() => {
            setResults([]);
            setIsSearching(false);
        }, 150);
    };

    // Display value: selected user's display field or current query
    const displayValue = selectedUser
        ? String(selectedUser[displayField])
        : query;

    return (
        <div className="form-row" style={{position: 'relative'}}>
            <label className="font-semibold">{label}</label>
            <input
                ref={inputRef}
                name={name}
                value={displayValue}
                placeholder={placeholder}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={() => {
                    if (query && !selectedUser) {
                        setIsSearching(true);
                    }
                }}
                autoComplete="off"
                className="border p-2 rounded"
            />
            {results.length > 0 && (
                <ul className="suggestions" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    margin: 0,
                    padding: 0,
                    listStyle: 'none'
                }}>
                    {results.map(user => (
                        <li
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                            }}
                        >
                            {String(user[displayField])}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
import React, { useState, useEffect, useRef } from 'react';
import type { User } from "../types/User.ts";
import "./LookupInput.scss";

interface LookupInputProps {
  label: string;
  name: string;
  value: string | undefined | null;
  onSelect: (user: User | null) => void;
  searchFunc: (query: string) => Promise<User[]>;
  displayField?: keyof User;
}

const LookupInput: React.FC<LookupInputProps> = ({
  label,
  name,
  value,
  onSelect,
  searchFunc,
  displayField = 'name',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [userCache, setUserCache] = useState<Map<string, User>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const skipNextSearch = useRef(false);

  // Fetch search results when query changes
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    if (query) {
      searchFunc(query).then(users => {
        console.log("Search results:", users);
        setResults(users);
        // Update cache with fresh results
        setUserCache(prevCache => {
          const newCache = new Map(prevCache);
          users.forEach(user => newCache.set(user.id, user));
          return newCache;
        });
      });
    } else {
      setResults([]);
    }
  }, [query, searchFunc]);

  const displayText = value && userCache.has(value)
    ? String(userCache.get(value)?.[displayField])
    : query;

  return (
    <div className="form-row" style={{ position: 'relative' }}>
      <label>{label}</label>
      <input
        ref={inputRef}
        name={name}
        value={displayText}
        onChange={e => {
          setQuery(e.target.value);
          onSelect(null);
        }}
        autoComplete="on"
      />
      {results.length > 0 && (
        <ul className="suggestions">
          {results.map(user => (
            <li
              key={user.id}
              onClick={() => {
                skipNextSearch.current = true;
                onSelect(user);
                setQuery(String(user[displayField]));
                setResults([]);
                inputRef.current?.blur();
              }}
            >
              {user[displayField]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LookupInput;
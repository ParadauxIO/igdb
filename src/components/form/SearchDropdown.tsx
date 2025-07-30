import React, {useEffect, useState, useRef} from "react";

interface DropdownItem {
    label: string;
    value: string;
}

interface SearchDropdownProps {
    label: string;
    name: string;
    value: string | null | undefined;
    required?: boolean;
    fetchOptions: () => Promise<DropdownItem[]>;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    error?: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
                                                           label,
                                                           name,
                                                           value,
                                                           required = false,
                                                           fetchOptions,
                                                           onChange,
                                                           error
                                                       }) => {
    const [options, setOptions] = useState<DropdownItem[]>([]);
    const [filteredOptions, setFilteredOptions] = useState<DropdownItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLoading(true);
        fetchOptions()
            .then((opts) => {
                setOptions(opts);
                setFilteredOptions(opts);
            })
            .catch((err) => setLoadError(err.message || "Error loading options"))
            .finally(() => setLoading(false));
    }, [fetchOptions]);

    useEffect(() => {
        const filtered = options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOptions(filtered);
    }, [searchTerm, options]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionSelect = (optionValue: string) => {
        const syntheticEvent = {
            target: {
                name,
                value: optionValue
            }
        } as React.ChangeEvent<HTMLSelectElement>;

        onChange(syntheticEvent);
        setIsOpen(false);
        setSearchTerm("");
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="form-row">
            <label className={required ? "required-label" : undefined}>{label}</label>
            <div className="search-dropdown-container" ref={containerRef}>
                <div
                    className="search-dropdown-trigger"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span>{selectedOption ? selectedOption.label : "Select an option"}</span>
                    <span className="dropdown-arrow">{isOpen ? "▲" : "▼"}</span>
                </div>

                {isOpen && (
                    <div className="search-dropdown-menu">
                        <input
                            type="text"
                            className="search-dropdown-input"
                            placeholder="Search options..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />

                        <div className="search-dropdown-options">
                            {loading && (
                                <div className="dropdown-option disabled">Loading...</div>
                            )}
                            {loadError && (
                                <div className="dropdown-option disabled">{loadError}</div>
                            )}
                            {!loading && !loadError && filteredOptions.length === 0 && (
                                <div className="dropdown-option disabled">No options found</div>
                            )}
                            {filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`dropdown-option ${opt.value === value ? 'selected' : ''}`}
                                    onClick={() => handleOptionSelect(opt.value)}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <select
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    required={required}
                    style={{display: 'none'}}
                >
                    <option value="">Select an option</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
            {error && <small className="error-text">{error}</small>}
        </div>
    );
};

export default SearchDropdown;
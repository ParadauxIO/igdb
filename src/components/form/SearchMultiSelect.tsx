import React, {useEffect, useMemo, useRef, useState} from "react";

export interface DropdownItem {
    label: string;
    value: string;
}

interface SearchMultiSelectProps {
    label: string;
    name: string;
    values: string[] | null | undefined;     // controlled selection
    required?: boolean;
    fetchOptions: () => Promise<DropdownItem[]>;
    onChangeValues: (values: string[]) => void;
    error?: string;
    placeholder?: string;                    // defaults to "Search options..."
    disabled?: boolean;
    maxSelected?: number;                    // optional cap
}

const SearchMultiSelect: React.FC<SearchMultiSelectProps> = ({
                                                                 label,
                                                                 name,
                                                                 values,
                                                                 required = false,
                                                                 fetchOptions,
                                                                 onChangeValues,
                                                                 error,
                                                                 placeholder = "Search options...",
                                                                 disabled = false,
                                                                 maxSelected
                                                             }) => {
    const [options, setOptions] = useState<DropdownItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = useMemo(() => new Set(values ?? []), [values]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchOptions()
            .then((opts) => { if (mounted) { setOptions(opts); } })
            .catch((err) => setLoadError(err?.message || "Error loading options"))
            .finally(() => setLoading(false));
        return () => { mounted = false; };
    }, [fetchOptions]);

    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        const notSelected = options.filter(o => !selected.has(o.value));
        if (!term) return notSelected;
        return notSelected.filter(o => (o.label || "").toLowerCase().includes(term));
    }, [searchTerm, options, selected]);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const addValue = (val: string) => {
        if (disabled) return;
        if (selected.has(val)) return;
        if (maxSelected && (values?.length ?? 0) >= maxSelected) return;
        onChangeValues([...(values ?? []), val]);
        setSearchTerm("");
    };

    const removeValue = (val: string) => {
        if (disabled) return;
        if (!selected.has(val)) return;
        onChangeValues((values ?? []).filter(v => v !== val));
    };

    const selectedItems: DropdownItem[] = useMemo(() => {
        const dict = new Map(options.map(o => [o.value, o]));
        return (values ?? []).map(v => dict.get(v) ?? {value: v, label: v});
    }, [values, options]);

    // For HTML5 required validation we keep a hidden input with a JSON string.
    const hiddenValue = JSON.stringify(values ?? []);

    return (
        <div className="form-row">
            <label className={required ? "required-label" : undefined}>{label}</label>

            <div className={`search-multi-container ${disabled ? "disabled" : ""}`} ref={containerRef}>
                {/* Pillbox display + input trigger */}
                <div
                    className="search-multi-trigger"
                    onClick={() => !disabled && setIsOpen(true)}
                >
                    <div className="pillbox">
                        {selectedItems.length === 0 && (
                            <span className="placeholder">Select one or more…</span>
                        )}
                        {selectedItems.map(item => (
                            <span className="pill" key={item.value}>
                <span className="pill-label">{item.label}</span>
                                {!disabled && (
                                    <button
                                        type="button"
                                        className="pill-remove"
                                        onClick={(e) => { e.stopPropagation(); removeValue(item.value); }}
                                        aria-label={`Remove ${item.label}`}
                                    >
                                        ×
                                    </button>
                                )}
              </span>
                        ))}
                    </div>
                    <span className="dropdown-arrow">{isOpen ? "▲" : "▼"}</span>
                </div>

                {isOpen && !disabled && (
                    <div className="search-dropdown-menu">
                        <input
                            type="text"
                            className="search-dropdown-input"
                            placeholder={placeholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />

                        <div className="search-dropdown-options">
                            {loading && <div className="dropdown-option disabled">Loading...</div>}
                            {loadError && <div className="dropdown-option disabled">{loadError}</div>}
                            {!loading && !loadError && filtered.length === 0 && (
                                <div className="dropdown-option disabled">No options found</div>
                            )}
                            {filtered.map(opt => (
                                <div
                                    key={opt.value}
                                    className="dropdown-option"
                                    onClick={() => addValue(opt.value)}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hidden multiple select for graceful degradation (not relied on) */}
                <select name={`${name}[]`} multiple value={values ?? []} onChange={() => {}} style={{display: "none"}}>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                {/* Hidden input for required validation */}
                <input
                    type="hidden"
                    name={name}
                    value={hiddenValue}
                    required={required && (values?.length ?? 0) === 0}
                    onChange={() => {}}
                />
            </div>

            {error && <small className="error-text">{error}</small>}
        </div>
    );
};

export default SearchMultiSelect;
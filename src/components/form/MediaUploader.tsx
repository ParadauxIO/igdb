import React, { useEffect, useMemo, useRef } from 'react';

type PreviewItem = { file: File; url: string };

interface MediaUploaderProps {
    label: string;
    name: string;
    value?: File[] | null;         // controlled source of truth
    required?: boolean;
    onChange: (files: File[]) => void;
    errorMessage?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
                                                         name,
                                                         value,
                                                         required,
                                                         onChange,
                                                         errorMessage,
                                                     }) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Keep a stable map of File -> objectURL across renders.
    // We only (a) create URLs for new Files and (b) revoke URLs for removed Files.
    const urlMapRef = useRef<Map<File, string>>(new Map());

    const files: File[] = value ?? [];

    const previews: PreviewItem[] = useMemo(() => {
        const next = new Map<File, string>();

        // Create or reuse URLs for current files
        for (const f of files) {
            if (!(f instanceof File)) continue; // Skip non-File items (e.g. string URLs from edit mode)
            
            const existing = urlMapRef.current.get(f);
            if (existing) {
                next.set(f, existing);
            } else {
                next.set(f, URL.createObjectURL(f));
            }
        }

        // Revoke URLs for files no longer present
        for (const [f, url] of urlMapRef.current) {
            if (!next.has(f)) {
                URL.revokeObjectURL(url);
            }
        }

        urlMapRef.current = next;

        return Array.from(next.entries()).map(([file, url]) => ({ file, url }));
    }, [files]);

    // Cleanup all URLs on unmount
    useEffect(() => {
        return () => {
            for (const [, url] of urlMapRef.current) {
                URL.revokeObjectURL(url);
            }
            urlMapRef.current.clear();
        };
    }, []);

    const addFiles = (incoming: FileList | File[]) => {
        const toAdd = Array.from(incoming) as File[];
        onChange([...(value ?? []), ...toAdd]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(e.target.files);
            // allow reselection of the same file(s)
            e.target.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const removeAt = (index: number) => {
        const next = [...files];
        const [removed] = next.splice(index, 1);
        // Revoke URL for the removed file
        const url = urlMapRef.current.get(removed);
        if (url) {
            URL.revokeObjectURL(url);
            urlMapRef.current.delete(removed);
        }
        onChange(next);
    };

    return (
        <div>
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'white',
                }}
            >
                <p>Drag &amp; drop or click to select multiple images</p>
                <input
                    id={name}
                    type="file"
                    accept="image/*"
                    multiple
                    name={name}
                    required={required}
                    ref={fileInputRef}
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                />
            </div>

            {previews.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {previews.map((item, index) => (
                        <div
                            // Use a stable key derived from the File, not the objectURL (which can change).
                            key={`${item.file.name}-${item.file.size}-${item.file.lastModified}-${index}`}
                            style={{ position: 'relative', width: '100px' }}
                        >
                            <img
                                src={item.url}
                                alt={`preview-${index}`}
                                style={{ width: '100%', borderRadius: '4px' }}
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeAt(index);
                                }}
                                aria-label="Remove image"
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    background: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {errorMessage && <p style={{ marginTop: '10px' }}>{errorMessage}</p>}
        </div>
    );
};

export default MediaUploader;
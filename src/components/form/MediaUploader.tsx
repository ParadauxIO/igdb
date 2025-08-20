import React, { useState, useRef, useEffect } from 'react';

type PreviewItem = {
    file: File;
    previewUrl: string;
};

interface MediaUploaderProps {
    label: string;
    name: string;
    value?: File[] | null;
    required?: boolean;
    onChange: (files: File[]) => void;
    errorMessage?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = (props) => {
    const { label, name, value, required, onChange, errorMessage } = props;

    const [files, setFiles] = useState<PreviewItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // If used as a controlled component, build previews from `value`
    useEffect(() => {
        if (!value) {
            setFiles([]);
            return;
        }
        const previews = value.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setFiles((prev) => {
            // Revoke previous URLs to avoid leaks
            prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            return previews;
        });
        // Cleanup on unmount
        return () => {
            previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        };
    }, [value]);

    const handleFilesAdded = (newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles) as File[];
        const updatedFiles: PreviewItem[] = fileArray.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));

        setFiles((prev) => {
            const next = [...prev, ...updatedFiles];
            onChange(next.map((f) => f.file));
            return next;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFilesAdded(e.target.files);
            // allow reselection of the same file(s)
            e.target.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesAdded(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeFile = (indexToRemove: number) => {
        setFiles((prev) => {
            const updated = [...prev];
            const [removed] = updated.splice(indexToRemove, 1);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            onChange(updated.map((f) => f.file));
            return updated;
        });
    };

    return (
        <div>
            {label && <label htmlFor={name} style={{ display: 'block', marginBottom: 8 }}>{label}</label>}

            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'white'
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
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </div>

            {files.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {files.map((item, index) => (
                        <div key={item.previewUrl} style={{ position: 'relative', width: '100px' }}>
                            <img
                                src={item.previewUrl}
                                alt={`preview-${index}`}
                                style={{ width: '100%', borderRadius: '4px' }}
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
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

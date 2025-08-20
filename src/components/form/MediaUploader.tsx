import React, { useEffect, useRef, useState } from "react";

type UploadedFile = {
    file: File;
    previewUrl: string;
};

interface MediaUploaderProps {
    label?: string;
    name: string;
    value?: string | null;
    required?: boolean;
    onChange: (files: File[]) => void;
    errorMessage?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = (props) => {
    const {label, name, required, onChange, errorMessage} = props;

    const [files, setFiles] = useState<UploadedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Revoke all object URLs on unmount
    useEffect(() => {
        return () => {
            files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
        };
    }, [files]);

    const handleFilesAdded = (newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles);
        const updatedFiles: UploadedFile[] = fileArray.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setFiles((prev) => [...prev, ...updatedFiles]);
        onChange(fileArray);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFilesAdded(e.target.files);
            e.target.value = "";
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleFilesAdded(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeFile = (indexToRemove: number) => {
        setFiles((prev) => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[indexToRemove].previewUrl); // Clean up
            updated.splice(indexToRemove, 1);
            onChange(updated.map(f => f.file));
            return updated;
        });
    };

    return (
        <div>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    border: "2px dashed #ccc",
                    borderRadius: "8px",
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "white",
                }}
            >
                <p>Drag & drop or click to select multiple images</p>
                <input
                    id={name}
                    type="file"
                    accept="image/*"
                    multiple
                    name={name}
                    required={required}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{display: "none"}}
                />
            </div>

            {files.length > 0 && (
                <div
                    style={{
                        marginTop: "10px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                    }}
                >
                    {files.map((item, index) => (
                        <div key={index} style={{position: "relative", width: "100px"}}>
                            <img
                                src={item.previewUrl}
                                alt={`preview-${index}`}
                                style={{width: "100%", borderRadius: "4px"}}
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                style={{
                                    position: "absolute",
                                    top: "5px",
                                    right: "5px",
                                    background: "#f44336",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "20px",
                                    height: "20px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                }}
                                aria-label={`Remove image ${index + 1}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {errorMessage && <p style={{marginTop: "10px"}}>{errorMessage}</p>}
        </div>
    );
};

export default MediaUploader;
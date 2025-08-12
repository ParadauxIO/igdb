import React, { useState, useRef } from 'react';

interface MediaUploaderProps {
  label: string;
  name: string;
  value: string | null | undefined;
  required?: boolean;
  onChange: (value) => void;
  errorMessage?: string;
}

const MediaUploader = ( props: MediaUploaderProps) => {
    const {name, value, required, onChange, errorMessage} = props;

    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);
  
    // Handle adding new files and previews
    const handleFilesAdded = (newFiles) => {
        const fileArray = Array.from(newFiles);
        const updatedFiles = fileArray.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        }));
        setFiles((prev) => [...prev, ...updatedFiles]);
        onChange(fileArray);
    };

    const handleFileChange = (e) => {
        handleFilesAdded(e.target.files);
    };
  
    const handleDrop = (e) => {
        e.preventDefault();
        handleFilesAdded(e.dataTransfer.files);
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    
    const removeFile = (indexToRemove) => {
        setFiles((prev) => {
          const updated = [...prev];
          URL.revokeObjectURL(updated[indexToRemove].previewUrl); // Clean up
          updated.splice(indexToRemove, 1);
          return updated;
        });
    };

    return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current.click()}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'white'
        }}
      >
        <p>Drag & drop or click to select multiple images</p>
        <input
          type="file"
          accept="image/*"
          multiple
          name = {name}
          required={required}
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Previews */}
      {files.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {files.map((item, index) => (
            <div key={index} style={{ position: 'relative', width: '100px' }}>
              <img
                src={item.previewUrl}
                alt={`preview-${index}`}
                style={{ width: '100%', borderRadius: '4px' }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
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
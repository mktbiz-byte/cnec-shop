'use client';

import { useState, useRef } from 'react';
import { Button } from './button';
import { X, Upload, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onUpload: (files: File[]) => Promise<string[]>;
  maxFiles?: number;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value = [],
  onChange,
  onUpload,
  maxFiles = 5,
  label,
  description,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - value.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    setUploading(true);
    try {
      const newUrls = await onUpload(filesToUpload);
      onChange([...value, ...newUrls]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {value.length < maxFiles && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">업로드 중...</p>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">클릭하거나 드래그하여 업로드</p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP (최대 {maxFiles}개)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

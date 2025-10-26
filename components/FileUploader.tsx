'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, FileText, Image as ImageIcon, Film, Music, Archive } from 'lucide-react';
import { Button } from './ui/Button';

export interface UploadedFile {
  filename: string;
  size: number;
  mimeType: string;
  blobUrl: string;
  url: string;
}

interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFileSize?: number; // in bytes
  maxTotalSize?: number; // in bytes
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB

export function FileUploader({
  onFilesUploaded,
  maxFileSize = MAX_FILE_SIZE,
  maxTotalSize = MAX_TOTAL_SIZE,
}: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDropzoneVisible, setIsDropzoneVisible] = useState(false);

  const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);

      // Validate total size
      const newTotalSize = acceptedFiles.reduce((sum, file) => sum + file.size, totalSize);
      if (newTotalSize > maxTotalSize) {
        setError(`Total file size exceeds ${formatFileSize(maxTotalSize)}`);
        return;
      }

      // Upload files
      for (const file of acceptedFiles) {
        // Validate individual file size
        if (file.size > maxFileSize) {
          setError(`File "${file.name}" is too large. Maximum size is ${formatFileSize(maxFileSize)}`);
          continue;
        }

        setUploading((prev) => [...prev, file.name]);

        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload/attachment', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const result = await response.json();
          const uploadedFile: UploadedFile = result.data;

          setUploadedFiles((prev) => {
            const updated = [...prev, uploadedFile];
            onFilesUploaded(updated);
            return updated;
          });
        } catch (error) {
          console.error('Upload error:', error);
          setError(error instanceof Error ? error.message : 'Failed to upload file');
        } finally {
          setUploading((prev) => prev.filter((name) => name !== file.name));
        }
      }
    },
    [totalSize, maxFileSize, maxTotalSize, onFilesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    onFilesUploaded(updated);
    setError(null);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <Film className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="w-5 h-5" />;
    if (mimeType.includes('text') || mimeType.includes('document')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <div className="space-y-3">
      {/* Header with Add Files button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
          {uploadedFiles.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {uploadedFiles.length > 0 && (
            <span className="text-xs text-gray-500">
              {formatFileSize(totalSize)} / {formatFileSize(maxTotalSize)}
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsDropzoneVisible(!isDropzoneVisible)}
            className="flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            {isDropzoneVisible ? 'Hide Upload' : 'Add Files'}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collapsible Dropzone */}
      {isDropzoneVisible && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-gray-700 font-medium mb-1">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Max {formatFileSize(maxFileSize)} per file, {formatFileSize(maxTotalSize)} total
              </p>
            </>
          )}
        </div>
      )}

      {/* Uploading files */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((filename) => (
            <div
              key={filename}
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="animate-spin">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-900 flex-1 truncate">Uploading {filename}...</p>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-gray-500 flex-shrink-0">{getFileIcon(file.mimeType)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                aria-label={`Remove ${file.filename}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

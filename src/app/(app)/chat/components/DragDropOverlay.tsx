"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, Image, FileAudio, FileVideo, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragDropOverlayProps {
  onFileDrop: (files: File[]) => void;
  children: React.ReactNode;
  className?: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('audio/')) return FileAudio;
  if (type.startsWith('video/')) return FileVideo;
  if (type.includes('text') || type.includes('document')) return FileText;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  onFileDrop,
  children,
  className,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
  acceptedTypes = [
    'image/*',
    'text/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'audio/*',
    'video/*'
  ]
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`;
    }

    // Check file type
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return `File type "${file.type}" is not supported.`;
    }

    return null;
  }, [maxFileSize, acceptedTypes]);

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Check total number of files
    if (fileArray.length > maxFiles) {
      errors.push(`Too many files. Maximum ${maxFiles} files allowed.`);
      return;
    }

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      // You can show toast notifications here
      return;
    }

    if (validFiles.length > 0) {
      // Create file previews
      const previews: FilePreview[] = validFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));

      setSelectedFiles(previews);
      setShowPreview(true);
    }
  }, [maxFiles, validateFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleConfirmFiles = useCallback(() => {
    const files = selectedFiles.map(fp => fp.file);
    onFileDrop(files);
    setSelectedFiles([]);
    setShowPreview(false);
    
    // Clean up object URLs
    selectedFiles.forEach(fp => {
      if (fp.preview) {
        URL.revokeObjectURL(fp.preview);
      }
    });
  }, [selectedFiles, onFileDrop]);

  const handleRemoveFile = useCallback((id: string) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(fp => fp.id !== id);
      const removed = prev.find(fp => fp.id === id);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  }, []);

  const handleCancelPreview = useCallback(() => {
    // Clean up object URLs
    selectedFiles.forEach(fp => {
      if (fp.preview) {
        URL.revokeObjectURL(fp.preview);
      }
    });
    setSelectedFiles([]);
    setShowPreview(false);
  }, [selectedFiles]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach(fp => {
        if (fp.preview) {
          URL.revokeObjectURL(fp.preview);
        }
      });
    };
  }, [selectedFiles]);

  return (
    <div
      ref={dropRef}
      className={cn("relative w-full h-full", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-blue-50/90 dark:bg-blue-950/90 backdrop-blur-sm border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Drop files here
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Upload up to {maxFiles} files (max {maxFileSize}MB each)
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Supports images, documents, audio, video, and text files
            </p>
          </div>
        </div>
      )}

      {/* File preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Confirm File Upload
                </h3>
                <button
                  onClick={handleCancelPreview}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {selectedFiles.map((filePreview) => {
                  const IconComponent = getFileIcon(filePreview.file.type);
                  return (
                    <div
                      key={filePreview.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      {filePreview.preview ? (
                        <img
                          src={filePreview.preview}
                          alt={filePreview.file.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {filePreview.file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(filePreview.file.size)} • {filePreview.file.type}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveFile(filePreview.id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelPreview}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFiles}
                disabled={selectedFiles.length === 0}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

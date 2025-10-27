"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toastError } from '@/components/toast-varients';

interface DragDropOverlayProps {
  onFileDrop: (files: File[]) => void;
  children: React.ReactNode;
  className?: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  onFileDrop,
  children,
  className,
  maxFiles = 10,
  maxFileSize = 50,
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
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validateFiles = useCallback((files: FileList | File[]): { valid: File[], errors: string[] } => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Check total number of files
    if (fileArray.length > maxFiles) {
      errors.push(`Too many files. Maximum ${maxFiles} files allowed.`);
      return { valid: [], errors };
    }

    // Validate each file
    fileArray.forEach(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`);
        return;
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
        errors.push(`File type "${file.type}" is not supported.`);
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, errors };
  }, [maxFiles, maxFileSize, acceptedTypes]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current += 1;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current -= 1;
    
    if (dragCounter.current <= 0) {
      setIsDragOver(false);
      dragCounter.current = 0;
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    
    if (files && files.length > 0) {
      const { valid, errors } = validateFiles(files);
      
      if (errors.length > 0) {
        errors.forEach(error => toastError('Upload Error', error));
        return;
      }

      if (valid.length > 0) {
        onFileDrop(valid);
      }
    }
  }, [validateFiles, onFileDrop]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const { valid, errors } = validateFiles(files);
      
      if (errors.length > 0) {
        errors.forEach(error => toastError('Upload Error', error));
        return;
      }

      if (valid.length > 0) {
        onFileDrop(valid);
      }
    }
    // Reset input value to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  }, [validateFiles, onFileDrop]);

  const handleOverlayClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      ref={dropRef}
      className={cn(
        "relative w-full h-full transition-colors duration-200",
        isDragOver && "bg-blue-50/20 dark:bg-blue-950/20",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Hidden file input for click to upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Drag overlay - ChatGPT/Claude style */}
      {isDragOver && (
        <div 
          className="absolute inset-0 z-50 bg-blue-50/95 dark:bg-blue-950/95 backdrop-blur-sm border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg flex items-center justify-center"
          onClick={handleOverlayClick}
        >
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
            <p className="text-xs text-blue-500 dark:text-blue-300 mt-2 font-medium">
              Or click to browse files
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

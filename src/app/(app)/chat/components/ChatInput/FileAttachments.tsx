"use client";

import React from 'react';
import { X, FileText, Image, FileAudio, FileVideo, File } from 'lucide-react';
import { ProcessedFile } from '../../utils/fileProcessor';

interface FileAttachmentsProps {
  files: ProcessedFile[];
  onRemoveFile: (fileId: string) => void;
  className?: string;
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

export const FileAttachments: React.FC<FileAttachmentsProps> = ({
  files,
  onRemoveFile,
  className = ''
}) => {
  if (files.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 mb-3 ${className}`}>
      {files.map((file) => {
        const IconComponent = getFileIcon(file.type);
        
        return (
          <div
            key={file.id}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm max-w-xs"
          >
            {file.preview ? (
              <img
                src={file.preview}
                alt={file.name}
                className="w-6 h-6 object-cover rounded"
              />
            ) : (
              <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-gray-100 font-medium truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </p>
            </div>

            <button
              onClick={() => onRemoveFile(file.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
              title="Remove file"
            >
              <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

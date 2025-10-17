"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  UploadCloud, 
  File, 
  Image, 
  FileText, 
  Video, 
  Archive, 
  Search, 
  Download, 
  Trash2, 
  Eye,
  Camera,
  Check,
  ChevronDown
} from "lucide-react";
import { useAssetsStore, type Asset } from "@/stores/assets-store";
import { toastSuccess, toastError } from "@/components/toast-varients";
import { useUserStore } from "@/stores/user-store";

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export default function UploadAssetsPage() {
  // Use Zustand store for assets
  const { 
    assets, 
    isLoading: loading, 
    fetchAssets, 
    addAsset
  } = useAssetsStore();
  
  // Get user data
  const { userData } = useUserStore();
  
  // Helper to get userId
  const getUserId = (): string | null => {
    if (userData?.userId) return userData.userId;
    if (typeof window !== 'undefined') {
      const localUserId = localStorage.getItem('user_id');
      if (localUserId) return localUserId;
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        try {
          const parsed = JSON.parse(userDataStr);
          if (parsed?.userId) return parsed.userId;
        } catch (e) {
          console.error('Failed to parse userData', e);
        }
      }
    }
    return process.env.NEXT_PUBLIC_DEFAULT_USER_ID || null;
  };
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // File upload handler
  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', getUserId() || '');
      formData.append('category', getCategoryFromMimeType(file.type));

      // Initialize progress tracking
      const progressItem: UploadProgress = {
        filename: file.name,
        progress: 0,
        status: 'uploading'
      };
      
      setUploadProgress(prev => [...prev, progressItem]);

      try {
        const response = await fetch('/api/assets/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Upload successful:', result);
          setUploadProgress(prev => 
            prev.map(item => 
              item.filename === file.name 
                ? { ...item, progress: 100, status: 'completed' }
                : item
            )
          );
          return result.asset;
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
          console.error('Upload failed:', response.status, errorData);
          throw new Error(errorData.error || 'Upload failed');
        }
      } catch (error) {
        setUploadProgress(prev => 
          prev.map(item => 
            item.filename === file.name 
              ? { ...item, status: 'error' }
              : item
          )
        );
        console.error('Upload error:', error);
        toastError('Upload Failed', error instanceof Error ? error.message : 'Failed to upload file');
        return null;
      }
    });

    const uploadedAssets = await Promise.all(uploadPromises);
    const successfulUploads = uploadedAssets.filter(asset => asset !== null);
    
    if (successfulUploads.length > 0) {
      successfulUploads.forEach(asset => {
        if (asset) addAsset(asset);
      });
      toastSuccess('Upload Complete', `Successfully uploaded ${successfulUploads.length} file(s)`);
    }

    setIsUploading(false);
    setTimeout(() => setUploadProgress([]), 3000);
  };

  // Get file category from mime type
  const getCategoryFromMimeType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'documents';
    return 'others';
  };



  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter assets based on search
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // View asset
  const handleViewAsset = (asset: Asset) => {
    if (asset.url) {
      window.open(asset.url, '_blank');
    } else {
      toastError('View Failed', 'File URL not available');
    }
  };

  // Download asset
  const handleDownloadAsset = async (asset: Asset) => {
    if (!asset.url) {
      toastError('Download Failed', 'File URL not available');
      return;
    }

    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = asset.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toastSuccess('Download Started', `Downloading ${asset.originalName}`);
    } catch (error) {
      console.error('Error downloading asset:', error);
      toastError('Download Failed', 'An error occurred while downloading the file');
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#605BFF] mx-auto mb-4"></div>
          <p className="text-[#6A707C]">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FAFAFB' }} className="min-h-screen py-8 px-10">
      {/* Header Section */}
      <div className="flex items-center gap-5 mb-10">
        {/* Upload Cloud Icon */}
        <div 
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            boxShadow: '0px 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <UploadCloud 
            style={{
              width: '32px',
              height: '32px',
              strokeWidth: '2.5px',
              color: '#3B43D6'
            }}
          />
        </div>

        {/* Title and Description */}
        <div>
          <h1 
            className="font-semibold"
            style={{
              fontSize: '20px',
              color: '#2D2F34',
              lineHeight: '1.3em',
              marginBottom: '6px'
            }}
          >
            Upload Your Files
          </h1>
          <p 
            style={{
              fontSize: '14px',
              color: '#6A707C',
              lineHeight: '1.4em'
            }}
          >
            Choose a file type below or drag and drop files anywhere
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div 
          className="mb-6 p-5"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            boxShadow: '0px 0px 15px 0px rgba(19,43,76,0.1)'
          }}
        >
          <h3 
            className="font-semibold mb-4"
            style={{
              fontSize: '16px',
              color: '#202020'
            }}
          >
            Upload Progress
          </h3>
          <div className="space-y-3">
            {uploadProgress.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ fontSize: '12px', color: '#000000', opacity: 0.7 }}>
                      {item.filename}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: item.status === 'completed' ? '#47AF47' :
                             item.status === 'error' ? '#EF4444' : '#605BFF'
                    }}>
                      {item.status === 'completed' ? 'Completed' :
                       item.status === 'error' ? 'Error' : `${item.progress}%`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E4E4E4' }}>
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${item.status === 'error' ? 100 : item.progress}%`,
                        backgroundColor: item.status === 'completed' ? '#47AF47' :
                                       item.status === 'error' ? '#EF4444' : '#605BFF'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Type Cards and Drag-Drop Zone */}
      <div className="flex gap-8 mb-12">
        {/* Left: 4 Upload Type Cards in 2x2 Grid */}
        <div className="grid grid-cols-2 gap-6" style={{ width: 'auto' }}>
          {/* Row 1, Col 1 */}
          {/* Photo Card */}
          <div className="relative">
            <input
              id="upload-photo"
              type="file"
              multiple
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files) handleFileUpload(e.target.files);
              }}
            />
            <div 
              className="flex items-center gap-5 cursor-pointer hover:shadow-lg transition-all"
              style={{
                width: '330px',
                height: '110px',
                backgroundColor: '#F8F9FE',
                borderRadius: '12px',
                padding: '20px 24px',
                border: '1px solid #E8EAED'
              }}
            >
              {/* Icon */}
              <div 
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(91, 147, 255, 0.12)',
                  borderRadius: '50%'
                }}
              >
                <Camera 
                  style={{
                    width: '36px',
                    height: '36px',
                    strokeWidth: '2.3px',
                    color: '#605BFF'
                  }}
                />
              </div>
              {/* Text */}
              <div>
                <h4 
                  className="font-semibold mb-1"
                  style={{
                    fontSize: '18px',
                    color: '#2D2F34',
                    lineHeight: '1.3em'
                  }}
                >
                  Photo
                </h4>
                <p 
                  style={{
                    fontSize: '13px',
                    color: '#6A707C',
                    lineHeight: '1.3em'
                  }}
                >
                  Click to upload
                </p>
              </div>
            </div>
          </div>

          {/* Documents Card */}
          <div className="relative">
            <input
              id="upload-documents"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.rtf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files) handleFileUpload(e.target.files);
              }}
            />
            <div 
              className="flex items-center gap-5 cursor-pointer hover:shadow-lg transition-all"
              style={{
                width: '330px',
                height: '110px',
                backgroundColor: '#FFFBF5',
                borderRadius: '12px',
                padding: '20px 24px',
                border: '1px solid #FEF3E8'
              }}
            >
              {/* Icon */}
              <div 
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(249, 145, 0, 0.12)',
                  borderRadius: '50%'
                }}
              >
                <FileText 
                  style={{
                    width: '36px',
                    height: '36px',
                    strokeWidth: '2.3px',
                    color: '#F99100'
                  }}
                />
              </div>
              {/* Text */}
              <div>
                <h4 
                  className="font-semibold mb-1"
                  style={{
                    fontSize: '18px',
                    color: '#2D2F34',
                    lineHeight: '1.3em'
                  }}
                >
                  Documents
                </h4>
                <p 
                  style={{
                    fontSize: '13px',
                    color: '#6A707C',
                    lineHeight: '1.3em'
                  }}
                >
                  Click to upload
                </p>
              </div>
            </div>
          </div>

          {/* Sheets Card */}
          <div className="relative">
            <input
              id="upload-sheets"
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files) handleFileUpload(e.target.files);
              }}
            />
            <div 
              className="flex items-center gap-5 cursor-pointer hover:shadow-lg transition-all"
              style={{
                width: '330px',
                height: '110px',
                backgroundColor: '#F3FBF7',
                borderRadius: '12px',
                padding: '20px 24px',
                border: '1px solid #E8F5EE'
              }}
            >
              {/* Icon - Green Sheets SVG */}
              <div 
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(22, 136, 70, 0.1)',
                  borderRadius: '50%'
                }}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect x="7" y="5" width="22" height="26" rx="2" fill="#168846"/>
                  <rect x="10" y="11" width="6" height="5" fill="white" opacity="0.9"/>
                  <rect x="17" y="11" width="6" height="5" fill="white" opacity="0.9"/>
                  <rect x="10" y="17" width="6" height="5" fill="white" opacity="0.9"/>
                  <rect x="17" y="17" width="6" height="5" fill="white" opacity="0.9"/>
                  <rect x="10" y="23" width="6" height="5" fill="white" opacity="0.9"/>
                  <rect x="17" y="23" width="6" height="5" fill="white" opacity="0.9"/>
                </svg>
              </div>
              {/* Text */}
              <div>
                <h4 
                  className="font-semibold mb-1"
                  style={{
                    fontSize: '18px',
                    color: '#2D2F34',
                    lineHeight: '1.3em'
                  }}
                >
                  Sheets
                </h4>
                <p 
                  style={{
                    fontSize: '13px',
                    color: '#6A707C',
                    lineHeight: '1.3em'
                  }}
                >
                  Click to upload
                </p>
              </div>
            </div>
          </div>

          {/* Presentations Card */}
          <div className="relative">
            <input
              id="upload-presentations"
              type="file"
              multiple
              accept=".pptx,.ppt"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files) handleFileUpload(e.target.files);
              }}
            />
            <div 
              className="flex items-center gap-5 cursor-pointer hover:shadow-lg transition-all"
              style={{
                width: '330px',
                height: '110px',
                backgroundColor: '#FFF9F3',
                borderRadius: '12px',
                padding: '20px 24px',
                border: '1px solid #FEF3E8'
              }}
            >
              {/* Icon - Orange Presentation SVG */}
              <div 
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(215, 118, 0, 0.1)',
                  borderRadius: '50%'
                }}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect x="6" y="9" width="24" height="18" rx="2" fill="#D77600"/>
                  <rect x="8.5" y="12" width="10" height="6" fill="white" opacity="0.9"/>
                  <rect x="8.5" y="19" width="5" height="1.2" fill="white" opacity="0.8"/>
                  <rect x="8.5" y="21.5" width="7" height="1.2" fill="white" opacity="0.8"/>
                  <path d="M20 15 L25 15 L25 21 L20 21 Z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              {/* Text */}
              <div>
                <h4 
                  className="font-semibold mb-1"
                  style={{
                    fontSize: '18px',
                    color: '#2D2F34',
                    lineHeight: '1.3em'
                  }}
                >
                  Presentations
                </h4>
                <p 
                  style={{
                    fontSize: '13px',
                    color: '#6A707C',
                    lineHeight: '1.3em'
                  }}
                >
                  Click to upload
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Drag and Drop Zone */}
        <div 
          className={`cursor-pointer transition-all flex-1 ${isDragActive ? 'border-[#605BFF] bg-blue-50' : ''}`}
          style={{
            minWidth: '520px',
            height: '248px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: isDragActive ? '2px dashed #605BFF' : '2px dashed #D1D5DB',
            padding: '32px'
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragActive(false);
            if (e.dataTransfer.files.length > 0) {
              handleFileUpload(e.dataTransfer.files);
            }
          }}
          onClick={() => document.getElementById('general-upload')?.click()}
        >
          <div 
            className="flex flex-col items-center justify-center h-full gap-4"
            style={{
              backgroundColor: isDragActive ? 'transparent' : '#FAFBFC',
              border: '1px solid #E8EAED',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            {/* Upload Icon */}
            <div
              className="flex items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'rgba(96, 91, 255, 0.08)',
                borderRadius: '50%'
              }}
            >
              <UploadCloud 
                style={{
                  width: '32px',
                  height: '32px',
                  color: '#605BFF',
                  strokeWidth: '2.5px'
                }}
              />
            </div>
            
            {/* Button */}
            <button 
              className="font-semibold hover:bg-[#3239BC] transition-colors"
              style={{
                height: '44px',
                backgroundColor: '#605BFF',
                color: '#FFFFFF',
                fontSize: '14px',
                borderRadius: '8px',
                padding: '0 24px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Or upload any file type
            </button>

            {/* Description */}
            <p 
              className="font-medium"
              style={{
                fontSize: '14px',
                color: '#6A707C',
                textAlign: 'center',
                lineHeight: '1.5em'
              }}
            >
              Drag and drop files here or click to browse
            </p>

            <input
              id="general-upload"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFileUpload(e.target.files);
              }}
            />
          </div>
        </div>
      </div>

      {/* Uploaded Files Section Header */}
      <div className="flex items-center justify-between mb-8">
        {/* Title */}
        <h2 
          className="font-semibold"
          style={{
            fontSize: '20px',
            color: '#2D2F34',
            lineHeight: '1.3em'
          }}
        >
          Uploaded Files
        </h2>

        {/* Search and Category Filter */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div 
            className="relative flex items-center"
            style={{
              width: '320px',
              height: '40px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E7EC',
              borderRadius: '8px'
            }}
          >
            <Search 
              style={{
                width: '16px',
                height: '16px',
                color: '#9CA3AF',
                strokeWidth: '2px',
                position: 'absolute',
                left: '14px'
              }}
            />
            <input
              type="text"
              placeholder="Search Rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full font-medium outline-none bg-transparent"
              style={{
                fontSize: '14px',
                color: '#2D2F34',
                paddingLeft: '42px',
                paddingRight: '14px'
              }}
            />
          </div>

          {/* Category Dropdown */}
          <div 
            className="relative flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors"
            style={{
              width: '180px',
              height: '40px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E7EC',
              borderRadius: '8px',
              padding: '0 14px'
            }}
          >
            <span 
              className="font-medium"
              style={{
                fontSize: '14px',
                color: '#6A707C'
              }}
            >
              {selectedCategory}
            </span>
            <ChevronDown 
              style={{
                width: '16px',
                height: '16px',
                color: '#9CA3AF',
                strokeWidth: '2px'
              }}
            />
          </div>
        </div>
      </div>

      {/* File Cards Grid */}
      {filteredAssets.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center"
          style={{
            backgroundColor: '#FAFBFC',
            borderRadius: '16px',
            padding: '96px 40px',
            border: '1px solid #E8EAED'
          }}
        >
          <div
            className="flex items-center justify-center mb-6"
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#F0F1F3',
              borderRadius: '50%'
            }}
          >
            <File 
              style={{
                width: '40px',
                height: '40px',
                color: '#9CA3AF',
                strokeWidth: '2px'
              }}
            />
          </div>
          <h3 
            className="font-semibold mb-3"
            style={{
              fontSize: '18px',
              color: '#2D2F34'
            }}
          >
            No files found
          </h3>
          <p 
            style={{
              fontSize: '14px',
              color: '#6A707C',
              textAlign: 'center',
              maxWidth: '400px',
              lineHeight: '1.5em'
            }}
          >
            {assets.length === 0 
              ? "Upload your first file to get started with managing your documents" 
              : "Try adjusting your search or upload new files"}
          </p>
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          style={{
            width: '100%'
          }}
        >
          {filteredAssets.map((asset) => (
            <div 
              key={asset._id} 
              className="hover:shadow-xl transition-all cursor-pointer"
              style={{
                minWidth: '280px',
                maxWidth: '320px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid #F0F1F3'
              }}
            >
              {/* Top Row: Icon + Active Badge + Check */}
              <div className="flex items-center justify-between mb-5">
                {/* File Icon */}
                <div 
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: '#F5F6FA',
                    borderRadius: '50%'
                  }}
                >
                  <FileText 
                    style={{
                      width: '28px',
                      height: '28px',
                      strokeWidth: '2px',
                      color: '#605BFF'
                    }}
                  />
                </div>

                {/* Actions: Active Badge + Check Icon */}
                <div className="flex items-center gap-2">
                  {/* Active Badge */}
                  <div 
                    className="font-medium"
                    style={{
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      fontSize: '11px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: '600'
                    }}
                  >
                    Active
                  </div>

                  {/* Check Icon */}
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '20px',
                      height: '20px'
                    }}
                  >
                    <Check 
                      style={{
                        width: '16px',
                        height: '16px',
                        strokeWidth: '2.5px',
                        color: '#D1D5DB'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Filename */}
              <h4 
                className="font-semibold truncate mb-4"
                style={{
                  fontSize: '15px',
                  color: '#2D2F34',
                  lineHeight: '1.4em'
                }}
                title={asset.originalName}
              >
                {asset.originalName}
              </h4>

              {/* File Size and Date */}
              <div className="flex items-center justify-between mb-5">
                <span 
                  style={{
                    fontSize: '13px',
                    color: '#6A707C',
                    fontWeight: '500'
                  }}
                >
                  {formatFileSize(asset.size)}
                </span>
                <span 
                  style={{
                    fontSize: '13px',
                    color: '#6A707C',
                    fontWeight: '500'
                  }}
                >
                  {new Date(asset.uploadDate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {/* Buttons Row */}
              <div className="flex items-center gap-3">
                {/* View Button */}
                <button 
                  className="font-semibold hover:bg-[#1F2937] transition-colors flex-1"
                  style={{
                    backgroundColor: '#374151',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    borderRadius: '8px',
                    padding: '10px 0',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleViewAsset(asset)}
                >
                  View
                </button>

                {/* Download Button */}
                <button 
                  className="font-semibold hover:bg-[#4F46E5] transition-colors flex-1"
                  style={{
                    backgroundColor: '#605BFF',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    borderRadius: '8px',
                    padding: '10px 0',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleDownloadAsset(asset)}
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

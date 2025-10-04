"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Pencil, 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase,
  Camera,
  Edit3,
  Check,
  Loader2
} from "lucide-react";
import { useUserStore, UserData } from "@/stores/user-store";
import { useCompanyStore } from "@/stores/company-store";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useRef } from "react";
import { toastSuccess, toastError } from "@/components/toast-varients";
import { uploadToS3 } from "@/app/api/s3/upload/uploadtos3";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/utils/user.util";
import { useUserProfile, UserProfile } from "@/lib/hooks/useUserProfile";

interface EditableField {
  field: keyof UserData;
  value: string;
  isEditing: boolean;
}

export default function UserProfilePage() {
  const { userData, setUserData } = useUserStore();
  const { selectedCompany } = useCompanyStore();
  
  // Use the new profile hook
  const { 
    profile, 
    isLoading, 
    error, 
    fetchProfile, 
    updateProfile, 
    refreshProfile, 
    clearError 
  } = useUserProfile();
  
  // Profile data state (use profile from hook or fallback to userData)
  const [profileData, setProfileData] = useState(profile || userData);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editable fields state
  const [editableFields, setEditableFields] = useState<Record<string, EditableField>>({});
  
  // Image states
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  
  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profilePicInputRef = useRef<HTMLInputElement | null>(null);

  let bannerImage =
    "https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  if (profileData?.banner?.image) {
    bannerImage = profileData.banner.image;
  }

  // Fetch profile data on component mount - FORCE REAL MONGODB DATA
  useEffect(() => {
    const userId = userData?.userId || localStorage.getItem('user_id');
    console.log('🔍 Profile Page: Attempting to fetch real MongoDB data for userId:', userId);
    
    if (userId) {
      // Always fetch fresh data from MongoDB, don't rely on cached profile
      console.log('📡 Fetching fresh profile data from MongoDB...');
      fetchProfile(userId);
    } else {
      console.warn('⚠️ No userId found - cannot fetch profile from MongoDB');
      toastError('User ID not found', 'Please log in again to load your profile');
    }
  }, [userData?.userId, fetchProfile]);

  // Update profile data when profile from hook changes - PRIORITIZE MONGODB DATA
  useEffect(() => {
    if (profile) {
      console.log('✅ MongoDB Profile Data Loaded:', {
        name: profile.name,
        email: profile.email,
        source: 'MongoDB Atlas',
        hasRealData: true
      });
      setProfileData(profile);
    } else if (userData) {
      console.log('⚠️ Using fallback userData (not from MongoDB):', {
        name: userData.name,
        email: userData.email,
        source: 'User Store/Cache',
        hasRealData: false
      });
      setProfileData(userData);
    } else {
      console.log('❌ No profile data available');
    }
  }, [profile, userData]);

  // Clear error when component mounts
  useEffect(() => {
    if (error) {
      toastError('Profile Error', error);
      clearError();
    }
  }, [error, clearError]);

  // Reset previews when images change
  useEffect(() => {
    setBannerPreview(null);
    setProfilePicPreview(null);
  }, [bannerImage, profileData?.profileImage]);

  // Field editing functions
  const startEditing = (fieldName: string, currentValue: string) => {
    setEditableFields(prev => ({
      ...prev,
      [fieldName]: {
        field: fieldName as keyof UserData,
        value: currentValue || '',
        isEditing: true
      }
    }));
  };

  const cancelEditing = (fieldName: string) => {
    setEditableFields(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const saveField = async (fieldName: string) => {
    const fieldData = editableFields[fieldName];
    if (!fieldData || !profileData) return;

    setIsSaving(true);
    try {
      const updateData = {
        [fieldName]: fieldData.value
      };

      const updatedProfile = await updateProfile(updateData);

      if (updatedProfile) {
        setProfileData(updatedProfile);
        cancelEditing(fieldName);
        // Success toast is handled by the hook
      } else {
        toastError(`Failed to update ${fieldName}`);
      }
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
      toastError(`Failed to update ${fieldName}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateFieldValue = (fieldName: string, value: string) => {
    setEditableFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value
      }
    }));
  };

  const handleBannerEdit = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  const handleBannerFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        setBannerPreview(ev.target?.result as string);
        // Immediately upload and update
        try {
          const updateBanner = await uploadToS3(
            file,
            "banner",
            userData?.userId!
          );
          if (updateBanner.success) {
            toastSuccess("Banner updated successfully");
            if (userData) {
              setUserData({
                ...userData,
                banner: {
                  image: updateBanner.data?.fileUrl || bannerImage,
                },
              });
            }
          } else {
            toastError("Failed to update banner");
          }
        } catch {
          toastError("An error occurred while updating the banner");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove handleBannerCancel and handleBannerSave

  const handleProfilePicEdit = () => {
    if (profilePicInputRef.current) profilePicInputRef.current.value = "";
    profilePicInputRef.current?.click();
  };

  const handleProfilePicFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        setProfilePicPreview(ev.target?.result as string);
        // Immediately upload and update
        try {
          const updateProfilePic = await uploadToS3(
            file,
            "profileImage",
            userData?.userId!
          );
          if (updateProfilePic.success) {
            toastSuccess("Profile picture updated successfully");
            if (userData) {
              setUserData({
                ...userData,
                profileImage:
                  updateProfilePic.data?.fileUrl || userData.profileImage,
              });
            }
          } else {
            toastError("Failed to update profile picture");
          }
        } catch {
          toastError("An error occurred while updating the profile picture");
        }
      };
      reader.readAsDataURL(file);
    }
    if (profilePicInputRef.current) profilePicInputRef.current.value = "";
  };

  // Remove handleProfilePicCancel and handleProfilePicSave

  // Helper functions
  const getBgColor = (name: string): string => {
    const colors = [
      "bg-green-400",
      "bg-blue-400",
      "bg-yellow-400",
      "bg-purple-400",
      "bg-pink-400",
      "bg-orange-400",
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Editable field component
  const EditableFieldComponent = ({ 
    fieldName, 
    label, 
    value, 
    icon: Icon, 
    type = 'text' 
  }: { 
    fieldName: string; 
    label: string; 
    value: string; 
    icon: any; 
    type?: string; 
  }) => {
    const isEditing = editableFields[fieldName]?.isEditing;
    const editValue = editableFields[fieldName]?.value || value;

    return (
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div>
            <Label className="text-sm font-medium">{label}</Label>
            {isEditing ? (
              <Input
                type={type}
                value={editValue}
                onChange={(e) => updateFieldValue(fieldName, e.target.value)}
                className="mt-1 h-8"
                autoFocus
              />
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                {value || 'Not provided'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelEditing(fieldName)}
                disabled={isSaving}
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                onClick={() => saveField(fieldName)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEditing(fieldName, value)}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (!profileData && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No profile data available</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Banner Section */}
        <div className="relative group">
          <img
            src={bannerPreview || bannerImage}
            alt="Profile Banner"
            className="w-full h-48 md:h-64 object-cover"
          />
          <button
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 hover:bg-black/20"
            onClick={handleBannerEdit}
            title="Edit banner"
            type="button"
          >
            <Camera className="h-6 w-6 text-white drop-shadow" />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleBannerFileChange}
          />
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6">
            <div className="z-10 -mt-16 sm:-mt-24 relative group">
              {profilePicPreview || profileData?.profileImage ? (
                <img
                  src={profilePicPreview || profileData?.profileImage}
                  alt={profileData?.name || "User"}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-background object-cover"
                />
              ) : (
                <div
                  className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-background flex items-center justify-center text-white text-4xl font-bold ${
                    getBgColor(profileData?.name || '')
                  }`}
                >
                  {getInitials(profileData?.name || '')}
                </div>
              )}
              <button
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleProfilePicEdit}
                title="Edit profile picture"
                type="button"
              >
                <div className="w-full h-full flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20">
                  <Camera className="h-4 w-4 text-white drop-shadow" />
                </div>
              </button>
              <input
                type="file"
                accept="image/*"
                ref={profilePicInputRef}
                className="hidden"
                onChange={handleProfilePicFileChange}
              />
            </div>
            
            <div className="mt-4 sm:mb-4 flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {profileData?.name || "User"}
                </h1>
                <Badge variant="outline" className="text-xs">
                  {profileData?.status || 'Active'}
                </Badge>
                {profile && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    MongoDB Data
                  </Badge>
                )}
                {!profile && profileData && (
                  <Badge variant="secondary" className="text-xs">
                    Cached Data
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshProfile}
                  disabled={isLoading}
                  className="ml-auto"
                  title="Refresh profile data from MongoDB Atlas"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh MongoDB"
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground">
                {profileData?.email || "No email provided"}
              </p>
              {error && (
                <p className="text-sm text-red-600 mt-1">
                  Error: {error}
                </p>
              )}
              
              {/* Debug Info - Shows data source */}
              {(profile || profileData) && (
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <strong>Data Source:</strong> {profile ? 'MongoDB Atlas Database' : 'Cached/Store Data'} | 
                  <strong> User ID:</strong> {profileData?.userId || 'Not available'} | 
                  <strong> Last Updated:</strong> {profileData?.updatedAt ? new Date(profileData.updatedAt).toLocaleString() : 'Unknown'}
                </div>
              )}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                    {profile && (
                      <Badge variant="default" className="text-xs bg-green-600 ml-auto">
                        Live MongoDB Data
                      </Badge>
                    )}
                    {!profile && profileData && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        Cached/Fallback Data
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EditableFieldComponent
                    fieldName="name"
                    label="Full Name"
                    value={profileData?.name || ''}
                    icon={User}
                  />
                  <EditableFieldComponent
                    fieldName="email"
                    label="Email Address"
                    value={profileData?.email || ''}
                    icon={Mail}
                    type="email"
                  />
                  <EditableFieldComponent
                    fieldName="mobile"
                    label="Phone Number"
                    value={profileData?.mobile || ''}
                    icon={Phone}
                    type="tel"
                  />
                  <EditableFieldComponent
                    fieldName="dob"
                    label="Date of Birth"
                    value={profileData?.dob || ''}
                    icon={Calendar}
                    type="date"
                  />
                  <EditableFieldComponent
                    fieldName="country"
                    label="Country"
                    value={profileData?.country || ''}
                    icon={MapPin}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Professional Information
                    {profile && (
                      <Badge variant="default" className="text-xs bg-green-600 ml-auto">
                        Live MongoDB Data
                      </Badge>
                    )}
                    {!profile && profileData && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        Cached/Fallback Data
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EditableFieldComponent
                    fieldName="designation"
                    label="Job Title"
                    value={profileData?.designation || ''}
                    icon={Briefcase}
                  />
                  
                  {/* About Section */}
                  <div className="p-3 rounded-lg border">
                    <Label className="text-sm font-medium mb-2 block">About</Label>
                    {editableFields['about']?.isEditing ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editableFields['about']?.value || profileData?.about || ''}
                          onChange={(e) => updateFieldValue('about', e.target.value)}
                          placeholder="Tell us about yourself..."
                          className="min-h-[100px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelEditing('about')}
                            disabled={isSaving}
                          >
                            <X className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveField('about')}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-muted-foreground flex-1">
                          {profileData?.about || 'No bio added yet'}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing('about', profileData?.about || '')}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge variant={profileData?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {profileData?.status || 'Active'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Member Since:</span>
                      <span className="text-sm text-muted-foreground">
                        {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {profileData?.reportingManager && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reports To</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{profileData.reportingManager.name}</p>
                      <p className="text-sm text-muted-foreground">{profileData.reportingManager.email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

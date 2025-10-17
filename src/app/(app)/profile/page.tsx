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
  Loader2,
  ChevronDown,
  AlertTriangle
} from "lucide-react";
import { useUserStore, UserData } from "@/stores/user-store";
import { useCompanyStore } from "@/stores/company-store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";
import { toastSuccess, toastError } from "@/components/toast-varients";
import { uploadToSupabase, updateProfileImageInDB, updateBannerInDB } from "@/lib/supabase/storage";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/utils/user.util";
import { useUserProfile, UserProfile } from "@/lib/hooks/useUserProfile";
import { createClient } from "@/lib/supabase/client";

interface EditableField {
  field: keyof UserData;
  value: string;
  isEditing: boolean;
}

export default function UserProfilePage() {
  const { userData, setUserData } = useUserStore();
  const { selectedCompany } = useCompanyStore();
  const supabase = createClient();
  
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
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Editable fields state
  const [editableFields, setEditableFields] = useState<Record<string, EditableField>>({});
  
  // Image states
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  
  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profilePicInputRef = useRef<HTMLInputElement | null>(null);

  // Banner image logic - keep previous image during upload
  let bannerImage = "https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  if (profileData?.banner?.image) {
    bannerImage = profileData.banner.image;
  }
  
  // During upload, show the current banner image (not the preview)
  const displayBannerImage = isBannerUploading ? bannerImage : (bannerPreview || bannerImage);

  // Fetch profile data on component mount
  useEffect(() => {
    const initializeProfile = async () => {
      setIsInitializing(true);
      
      // First check if we have userId in userData
      let userId = userData?.userId;
      
      // If not, try to get it from Supabase auth
      if (!userId) {
        console.log('� Profile page: No userId in store, fetching from Supabase auth...');
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !user) {
            console.error('❌ Profile page: Failed to get auth user:', authError);
            setIsInitializing(false);
            return;
          }
          
          userId = user.id;
          console.log('✅ Profile page: Got userId from auth:', userId);
        } catch (error) {
          console.error('❌ Profile page: Error getting auth user:', error);
          setIsInitializing(false);
          return;
        }
      }
      
      if (userId) {
        console.log('�🔄 Profile page: Fetching profile for user:', userId);
        await fetchProfile(userId);
      } else {
        console.warn('⚠️ Profile page: No userId available');
      }
      
      setIsInitializing(false);
    };
    
    initializeProfile();
  }, [userData?.userId, fetchProfile, supabase]);

  // Update profile data when profile from hook changes
  useEffect(() => {
    if (profile) {
      setProfileData(profile);
    } else if (userData) {
      setProfileData(userData);
    } else {
      setProfileData(null);
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
    setIsBannerUploading(false);
    setIsUploadingProfilePic(false);
  }, [bannerImage, profileData?.profileImage]);

  // Validation functions
  const validateName = (name: string): { isValid: boolean; error?: string } => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Name is required' };
    }
    if (name.trim().length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters' };
    }
    if (name.trim().length > 100) {
      return { isValid: false, error: 'Name must not exceed 100 characters' };
    }
    // Allow letters, spaces, hyphens, apostrophes, and periods
    const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
    if (!nameRegex.test(name)) {
      return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods' };
    }
    return { isValid: true };
  };

  const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: 'Email is required' };
    }
    // Comprehensive email regex that validates Gmail and other providers
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    // Additional Gmail-specific validation if needed
    if (email.toLowerCase().includes('@gmail.com')) {
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!gmailRegex.test(email.toLowerCase())) {
        return { isValid: false, error: 'Please enter a valid Gmail address' };
      }
    }
    return { isValid: true };
  };

  const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
    if (!phone || phone.trim().length === 0) {
      return { isValid: false, error: 'Phone number is required' };
    }
    // Remove spaces, hyphens, and parentheses for validation
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it contains only digits and optional + at the start
    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      return { isValid: false, error: 'Phone number must contain 10-15 digits only (spaces and hyphens allowed)' };
    }
    
    // Additional check: ensure no letters
    if (/[a-zA-Z]/.test(phone)) {
      return { isValid: false, error: 'Phone number cannot contain letters' };
    }
    
    return { isValid: true };
  };

  const validateCountry = (country: string): { isValid: boolean; error?: string } => {
    if (!country || country.trim().length === 0) {
      return { isValid: false, error: 'Country is required' };
    }
    if (country.trim().length < 2) {
      return { isValid: false, error: 'Please select a valid country' };
    }
    return { isValid: true };
  };

  const validateDesignation = (designation: string): { isValid: boolean; error?: string } => {
    if (designation && designation.trim().length > 0) {
      if (designation.trim().length < 2) {
        return { isValid: false, error: 'Designation must be at least 2 characters' };
      }
      if (designation.trim().length > 100) {
        return { isValid: false, error: 'Designation must not exceed 100 characters' };
      }
      // Allow letters, numbers, spaces, and common punctuation
      const designationRegex = /^[a-zA-Z0-9\s\-\/,\.&()]+$/;
      if (!designationRegex.test(designation)) {
        return { isValid: false, error: 'Designation contains invalid characters' };
      }
    }
    return { isValid: true };
  };

  const validateAbout = (about: string): { isValid: boolean; error?: string } => {
    if (about && about.trim().length > 0) {
      if (about.trim().length < 10) {
        return { isValid: false, error: 'About section must be at least 10 characters' };
      }
      if (about.trim().length > 500) {
        return { isValid: false, error: 'About section must not exceed 500 characters' };
      }
    }
    return { isValid: true };
  };

  const validateDOB = (dob: string): { isValid: boolean; error?: string } => {
    if (!dob || dob.trim().length === 0) {
      return { isValid: true }; // DOB is optional
    }
    
    const dobDate = new Date(dob);
    const today = new Date();
    const minAge = 13; // Minimum age requirement
    const maxAge = 120; // Maximum realistic age
    
    if (isNaN(dobDate.getTime())) {
      return { isValid: false, error: 'Please enter a valid date' };
    }
    
    // Check if date is not in the future
    if (dobDate > today) {
      return { isValid: false, error: 'Date of birth cannot be in the future' };
    }
    
    // Check minimum age
    const ageInYears = (today.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageInYears < minAge) {
      return { isValid: false, error: `You must be at least ${minAge} years old` };
    }
    
    if (ageInYears > maxAge) {
      return { isValid: false, error: 'Please enter a valid date of birth' };
    }
    
    return { isValid: true };
  };

  // Validate field based on field name
  const validateField = (fieldName: string, value: string): { isValid: boolean; error?: string } => {
    switch (fieldName) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'mobile':
        return validatePhoneNumber(value);
      case 'country':
        return validateCountry(value);
      case 'designation':
        return validateDesignation(value);
      case 'about':
        return validateAbout(value);
      case 'dob':
        return validateDOB(value);
      default:
        return { isValid: true };
    }
  };

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

    // Validate the field before saving
    const validation = validateField(fieldName, fieldData.value);
    if (!validation.isValid) {
      toastError('Validation Error', validation.error || 'Invalid input');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        [fieldName]: fieldData.value.trim()
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
    setEditableFields(prev => {
      const existingField = prev[fieldName] || {
        field: fieldName as keyof UserData,
        isEditing: true
      };
      
      return {
        ...prev,
        [fieldName]: {
          ...existingField,
          value
        }
      };
    });
  };

  const handleBannerEdit = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  const handleBannerFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set uploading state - this will keep the previous image visible
    setIsBannerUploading(true);
    setIsSaving(true);

    try {
      // Upload to Supabase Storage
      const uploadResult = await uploadToSupabase(
        file,
        "banners",
        userData?.userId!
      );

      if (uploadResult.success && uploadResult.url) {
        const newBannerUrl = uploadResult.url;
        
        console.log('🎨 New banner URL:', newBannerUrl);
        
        // Update database first
        const dbUpdateResult = await updateBannerInDB(userData?.userId!, newBannerUrl);
        
        if (!dbUpdateResult.success) {
          throw new Error(dbUpdateResult.error || "Failed to update database");
        }
        
        console.log('✅ Database updated, now updating UI...');
        
        // Update profile data state with the new URL
        const updatedProfileData = {
          ...profileData,
          banner: {
            image: newBannerUrl,
          },
        };
        setProfileData(updatedProfileData as any);
        
        console.log('📱 Profile data updated:', updatedProfileData.banner);
        
        // Update user store with the new URL
        if (userData) {
          setUserData({
            ...userData,
            banner: {
              image: newBannerUrl,
            },
          });
          console.log('💾 User store updated');
        }

        // Force refresh from database to ensure sync
        if (userData?.userId) {
          console.log('🔄 Refreshing profile from database...');
          await refreshProfile();
        }

        toastSuccess("Banner updated successfully");
      } else {
        throw new Error(uploadResult.error || "Upload failed");
      }
    } catch (error) {
      console.error("Banner update error:", error);
      toastError("Failed to update banner. Please try again.");
    } finally {
      setIsSaving(false);
      setIsBannerUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
    if (!file) return;

    // Set uploading state and show optimistic preview
    setIsUploadingProfilePic(true);
    const optimisticUrl = URL.createObjectURL(file);
    setProfilePicPreview(optimisticUrl);
    setIsSaving(true);

    try {
      // Upload to Supabase Storage
      const uploadResult = await uploadToSupabase(
        file,
        "avatars",
        userData?.userId!
      );

      if (uploadResult.success && uploadResult.url) {
        const newImageUrl = uploadResult.url;
        
        console.log('🎨 New profile image URL:', newImageUrl);
        
        // Update database first
        const dbUpdateResult = await updateProfileImageInDB(userData?.userId!, newImageUrl);
        
        if (!dbUpdateResult.success) {
          throw new Error(dbUpdateResult.error || "Failed to update database");
        }
        
        console.log('✅ Database updated, now updating UI...');
        
        // Clear blob URL after successful upload
        setProfilePicPreview(null);
        URL.revokeObjectURL(optimisticUrl);
        
        // Update profile data state immediately
        const updatedProfileData = {
          ...profileData,
          profileImage: newImageUrl,
        };
        setProfileData(updatedProfileData as any);
        
        console.log('📱 Profile data updated with new image');
        
        // Update user store immediately
        if (userData) {
          setUserData({
            ...userData,
            profileImage: newImageUrl,
          });
          console.log('💾 User store updated');
        }

        // Force refresh from database to ensure sync
        if (userData?.userId) {
          console.log('🔄 Refreshing profile from database...');
          await refreshProfile();
        }

        toastSuccess("Profile picture updated successfully");
      } else {
        throw new Error(uploadResult.error || "Upload failed");
      }
    } catch (error) {
      console.error("Profile picture update error:", error);
      toastError("Failed to update profile picture. Please try again.");
      // Clean up blob URL on error
      if (optimisticUrl) {
        URL.revokeObjectURL(optimisticUrl);
      }
      setProfilePicPreview(null);
    } finally {
      setIsSaving(false);
      setIsUploadingProfilePic(false);
      if (profilePicInputRef.current) {
        profilePicInputRef.current.value = "";
      }
    }
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

  // Custom DOB component with better UI
  const DOBFieldComponent = () => {
    const isEditing = editableFields['dob']?.isEditing;
    const currentDOB = profileData?.dob || '';
    
    // Parse current date or set defaults
    const parseDate = (dateStr: string) => {
      if (!dateStr) return { day: '', month: '', year: '' };
      
      // Handle different date formats
      let day = '', month = '', year = '';
      
      if (dateStr.includes('-')) {
        // Format: YYYY-MM-DD or DD-MM-YYYY
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            year = parts[0];
            month = parseInt(parts[1]).toString(); // Remove leading zeros
            day = parseInt(parts[2]).toString(); // Remove leading zeros
          } else {
            // DD-MM-YYYY
            day = parseInt(parts[0]).toString();
            month = parseInt(parts[1]).toString();
            year = parts[2];
          }
        }
      } else if (dateStr.includes('/')) {
        // Format: MM/DD/YYYY or DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          day = parseInt(parts[1]).toString();
          month = parseInt(parts[0]).toString();
          year = parts[2];
        }
      }
      
      return { day, month, year };
    };

    const { day, month, year } = parseDate(isEditing ? editableFields['dob']?.value || currentDOB : currentDOB);

    const updateDOBField = (newDay: string, newMonth: string, newYear: string) => {
      // Ensure we have valid values before formatting
      const validDay = newDay || day || '1';
      const validMonth = newMonth || month || '1';
      const validYear = newYear || year || new Date().getFullYear().toString();
      
      const formattedDate = `${validYear}-${validMonth.padStart(2, '0')}-${validDay.padStart(2, '0')}`;
      updateFieldValue('dob', formattedDate);
    };

    // Validate DOB
    const dobValue = isEditing ? editableFields['dob']?.value || currentDOB : currentDOB;
    const validation = isEditing ? validateDOB(dobValue) : { isValid: true };
    const hasError = isEditing && !validation.isValid;

    const formatDisplayDate = (dateStr: string) => {
      if (!dateStr) return 'Not provided';
      const { day, month, year } = parseDate(dateStr);
      if (!day || !month || !year) return 'Not provided';
      
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const monthName = monthNames[parseInt(month) - 1] || month;
      return `${monthName} ${day}, ${year}`;
    };

    // Generate options
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const months = [
      { value: '1', label: 'January' },
      { value: '2', label: 'February' },
      { value: '3', label: 'March' },
      { value: '4', label: 'April' },
      { value: '5', label: 'May' },
      { value: '6', label: 'June' },
      { value: '7', label: 'July' },
      { value: '8', label: 'August' },
      { value: '9', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' },
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

    return (
      <div className="flex flex-col">
        <div className={`flex items-center justify-between p-3 rounded-lg border ${hasError ? 'border-red-400 bg-red-50/50' : 'border-[#E6E6E6]'}`}>
          <div className="flex items-center gap-3 flex-1">
            <Calendar className={`h-4 w-4 ${hasError ? 'text-red-500' : 'text-[#6A707C]'}`} />
            <div className="flex-1">
              <Label className={`text-sm font-medium ${hasError ? 'text-red-600' : 'text-[#2D2F34]'}`}>Date of Birth</Label>
              {isEditing ? (
                <div className="flex gap-2 mt-1">
                  <Select 
                    value={month || ''} 
                    onValueChange={(value) => updateDOBField(day, value, year)}
                  >
                    <SelectTrigger className={`w-[120px] h-8 ${hasError ? 'border-red-400' : 'border-[#E4E4E4]'}`}>
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={day || ''} 
                    onValueChange={(value) => updateDOBField(value, month, year)}
                  >
                    <SelectTrigger className={`w-[80px] h-8 ${hasError ? 'border-red-400' : 'border-[#E4E4E4]'}`}>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={year || ''} 
                    onValueChange={(value) => updateDOBField(day, month, value)}
                  >
                    <SelectTrigger className={`w-[100px] h-8 ${hasError ? 'border-red-400' : 'border-[#E4E4E4]'}`}>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-[#6A707C] mt-1">
                  {formatDisplayDate(currentDOB)}
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
                  onClick={() => cancelEditing('dob')}
                  disabled={isSaving}
                  className="h-9 border-[#E4E4E4] hover:bg-[#FAFAFB]"
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveField('dob')}
                  disabled={isSaving || hasError}
                  className="h-9 bg-[#605BFF] hover:bg-[#4D47CC] text-white disabled:opacity-50"
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
                onClick={() => startEditing('dob', currentDOB)}
                className="h-9 hover:bg-[#EFF1F6]"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {/* Validation error message */}
        {hasError && validation.error && (
          <p className="text-xs text-red-600 mt-1 ml-10 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {validation.error}
          </p>
        )}
      </div>
    );
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
    // Use ?? instead of || to allow empty strings
    const editValue = editableFields[fieldName]?.value ?? value ?? '';
    
    // Real-time validation
    const validation = isEditing ? validateField(fieldName, editValue) : { isValid: true };
    const hasError = isEditing && !validation.isValid;

    // Input validation handler with character filtering
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      
      // Apply field-specific input filtering
      if (fieldName === 'mobile') {
        // Allow only digits, spaces, hyphens, parentheses, and + at start
        newValue = newValue.replace(/[^0-9\s\-\(\)\+]/g, '');
      } else if (fieldName === 'name') {
        // Allow only letters, spaces, hyphens, apostrophes, and periods
        newValue = newValue.replace(/[^a-zA-Z\s\-'\.]/g, '');
      }
      
      updateFieldValue(fieldName, newValue);
    };

    return (
      <div className="flex flex-col">
        <div className={`flex items-center justify-between p-3 rounded-lg border ${hasError ? 'border-red-400 bg-red-50/50' : 'border-[#E6E6E6]'}`}>
          <div className="flex items-center gap-3 flex-1">
            <Icon className={`h-4 w-4 ${hasError ? 'text-red-500' : 'text-[#6A707C]'}`} />
            <div className="flex-1">
              <Label className={`text-sm font-medium ${hasError ? 'text-red-600' : 'text-[#2D2F34]'}`}>{label}</Label>
              {isEditing ? (
                <Input
                  type={type}
                  value={editValue}
                  onChange={handleInputChange}
                  className={`mt-1 h-8 w-full border-[#E4E4E4] focus:border-[#3B43D6] ${hasError ? 'border-red-400 focus:border-red-500' : ''}`}
                  autoFocus
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              ) : (
                <p className="text-sm text-[#6A707C] mt-1">
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
                  className="h-9 border-[#E4E4E4] hover:bg-[#FAFAFB]"
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveField(fieldName)}
                  disabled={isSaving || hasError}
                  className="h-9 bg-[#605BFF] hover:bg-[#4D47CC] text-white disabled:opacity-50"
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
                className="h-9 hover:bg-[#EFF1F6]"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {/* Validation error message */}
        {hasError && validation.error && (
          <p className="text-xs text-red-600 mt-1 ml-10 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {validation.error}
          </p>
        )}
      </div>
    );
  };

  // Only show full page loading during initial load, not during updates
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">No profile data available</p>
          <p className="text-sm text-muted-foreground mb-4">
            Please try signing out and signing in again
          </p>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFB]">
      <div className="max-w-7xl mx-auto">
        {/* Banner Section - Keep existing styling */}
        <div className="relative group">
          <img
            src={displayBannerImage}
            alt="Profile Banner"
            className="w-full h-48 md:h-64 object-cover"
          />
          {/* Loading overlay */}
          {isSaving && isBannerUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
                <p className="text-white text-sm font-medium">Uploading banner...</p>
              </div>
            </div>
          )}
           <button
             className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/10 hover:bg-black/20 ${
               isSaving && isBannerUploading 
                 ? 'opacity-0 cursor-not-allowed' 
                 : 'opacity-0 group-hover:opacity-100'
             }`}
             onClick={handleBannerEdit}
             title={isSaving && isBannerUploading ? "Uploading banner..." : "Edit banner"}
             type="button"
             disabled={isSaving && isBannerUploading}
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
                  src={profileData.profileImage}
                  alt={profileData?.name || "User"}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div
                  className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white flex items-center justify-center text-white text-4xl font-bold shadow-md ${
                    getBgColor(profileData?.name || '')
                  }`}
                >
                  {getInitials(profileData?.name || '')}
                </div>
              )}
              {/* Loading overlay for profile picture */}
              {isSaving && profilePicPreview && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
               <button
                 className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                   isSaving && isUploadingProfilePic 
                     ? 'opacity-0 cursor-not-allowed' 
                     : 'opacity-0 group-hover:opacity-100'
                 }`}
                 onClick={handleProfilePicEdit}
                 title={isSaving && isUploadingProfilePic ? "Uploading profile picture..." : "Edit profile picture"}
                 type="button"
                 disabled={isSaving && isUploadingProfilePic}
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
                <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2F34]">
                  {profileData?.name || "User"}
                </h1>
                <Badge variant="outline" className="text-xs border-[#E4E4E4] text-[#6A707C]">
                  {profileData?.status || 'Active'}
                </Badge>
              </div>
              <p className="text-[#6A707C]">
                {profileData?.email || "No email provided"}
              </p>
              {error && (
                <p className="text-sm text-red-600 mt-1">
                  Error: {error}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-8 bg-[#E6E6E6]" />

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
            {/* Main Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white rounded-xl shadow-sm border-[#E6E6E6]">
                <CardHeader className="border-b border-[#E6E6E6]">
                  <CardTitle className="flex items-center gap-2 text-[#2D2F34] font-semibold">
                    <User className="h-5 w-5 text-[#3B43D6]" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <EditableFieldComponent
                    fieldName="name"
                    label="Full Name"
                    value={profileData?.name || ''}
                    icon={User}
                  />
                  {/* Email field - Display only (managed by Supabase Auth) */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-sm font-medium">Email Address</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {profileData?.email || 'Not provided'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Email is managed by your account settings
                        </p>
                      </div>
                    </div>
                  </div>
                  <EditableFieldComponent
                    fieldName="mobile"
                    label="Phone Number"
                    value={profileData?.mobile || ''}
                    icon={Phone}
                    type="tel"
                  />
                  <DOBFieldComponent />
                  <EditableFieldComponent
                    fieldName="country"
                    label="Country"
                    value={profileData?.country || ''}
                    icon={MapPin}
                  />
                </CardContent>
              </Card>

              <Card className="bg-white rounded-xl shadow-sm border-[#E6E6E6]">
                <CardHeader className="border-b border-[#E6E6E6]">
                  <CardTitle className="flex items-center gap-2 text-[#2D2F34] font-semibold">
                    <Briefcase className="h-5 w-5 text-[#3B43D6]" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
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
                        <div className="relative">
                          <Textarea
                            value={editableFields['about']?.value ?? profileData?.about ?? ''}
                            onChange={(e) => updateFieldValue('about', e.target.value)}
                            placeholder="Tell us about yourself... (10-500 characters)"
                            className={`min-h-[100px] ${
                              (() => {
                                const validation = validateAbout(editableFields['about']?.value ?? '');
                                return !validation.isValid ? 'border-red-400 bg-red-50/50 focus:border-red-400' : '';
                              })()
                            }`}
                          />
                          <div className="flex justify-between items-center mt-1">
                            <div className="flex-1">
                              {(() => {
                                const validation = validateAbout(editableFields['about']?.value ?? '');
                                return !validation.isValid ? (
                                  <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {validation.error}
                                  </p>
                                ) : null;
                              })()}
                            </div>
                            <span className={`text-xs ${
                              (editableFields['about']?.value?.length ?? 0) > 500 
                                ? 'text-red-600 font-medium' 
                                : 'text-muted-foreground'
                            }`}>
                              {editableFields['about']?.value?.length ?? 0}/500
                            </span>
                          </div>
                        </div>
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
                            disabled={isSaving || !validateAbout(editableFields['about']?.value ?? '').isValid}
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
              <Card className="bg-white rounded-xl shadow-sm border-[#E6E6E6]">
                <CardHeader className="border-b border-[#E6E6E6]">
                  <CardTitle className="text-[#2D2F34] font-semibold">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
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
                <Card className="bg-white rounded-xl shadow-sm border-[#E6E6E6]">
                  <CardHeader className="border-b border-[#E6E6E6]">
                    <CardTitle className="text-[#2D2F34] font-semibold">Reports To</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
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

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
  AlertTriangle,
  FileText
} from "lucide-react";
import { useUserStore, UserData } from "@/stores/user-store";
import { useCompanyStore } from "@/stores/company-store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";
import Image from 'next/image';
import { toastSuccess, toastError } from "@/components/toast-varients";
import { uploadAndUpdateImage } from "@/lib/supabase/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/utils/user.util";
import { useUserProfile, UserProfile } from "@/lib/hooks/useUserProfile";
import { createClient } from "@/lib/supabase/client";
import { formatGlobalDate } from "@/utils/date.util";

// Comprehensive country list for profile selection
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Brazzaville)","Congo (Kinshasa)",
  "Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland",
  "France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea",
  "Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico",
  "Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru",
  "Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman",
  "Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia",
  "Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa",
  "South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan",
  "Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan",
  "Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

interface EditableField {
  field: keyof UserData;
  value: string;
  isEditing: boolean;
}

// Module-level editable field component to avoid remounting on every render
function EditableFieldComponent({
  fieldName,
  label,
  value,
  icon: Icon,
  type = 'text',
  isGlobalEditMode,
  editableFields,
  updateFieldValue,
  validateField,
}: {
  fieldName: string;
  label: string;
  value: string;
  icon: any;
  type?: string;
  isGlobalEditMode: boolean;
  editableFields: Record<string, EditableField>;
  updateFieldValue: (fieldName: string, value: string) => void;
  validateField: (fieldName: string, value: string) => { isValid: boolean; error?: string };
}) {
  const isEditing = isGlobalEditMode && editableFields[fieldName]?.isEditing;
  const editValue = editableFields[fieldName]?.value ?? value ?? '';
  const validation = isEditing ? validateField(fieldName, editValue) : { isValid: true };
  const hasError = isEditing && !validation.isValid;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (fieldName === 'mobile') {
      newValue = newValue.replace(/[^0-9\s\-\(\)\+]/g, '');
    } else if (fieldName === 'name') {
      newValue = newValue.replace(/[^a-zA-Z\s\-'\.]/g, '');
    }
    updateFieldValue(fieldName, newValue);
  };

  return (
    <div className="flex flex-col">
      <div className={`p-3 rounded-lg border ${hasError ? 'border-red-400 bg-red-50/50' : 'border-[#E6E6E6]'}`}>
        <div className="flex items-center gap-3 mb-1">
          <Icon className={`h-4 w-4 ${hasError ? 'text-red-500' : 'text-[#6A707C]'}`} />
          <Label className={`text-sm font-medium ${hasError ? 'text-red-600' : 'text-[#2D2F34]'}`}>{label}</Label>
        </div>
        <div className="ml-4 sm:ml-7">
          {isEditing ? (
            <Input
              type={type}
              value={editValue}
              onChange={handleInputChange}
              className={`h-8 w-full border-[#E4E4E4] focus:border-[#3B43D6] ${hasError ? 'border-red-400 focus:border-red-500' : ''}`}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          ) : (
            <p className="text-sm text-[#6A707C] py-1">{value || 'Not provided'}</p>
          )}
        </div>
      </div>
      {hasError && validation.error && (
        <p className="text-xs text-red-600 mt-1 ml-10 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {validation.error}
        </p>
      )}
    </div>
  );
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
  
  // Global edit mode state
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  
  // Editable fields state
  const [editableFields, setEditableFields] = useState<Record<string, EditableField>>({});
  
  // Image states
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [isProfilePicUploading, setIsProfilePicUploading] = useState(false);
  
  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profilePicInputRef = useRef<HTMLInputElement | null>(null);

  // Banner image logic - prioritize profile data from hook (latest from database)
  const bannerImage = profile?.banner?.image || userData?.banner?.image || "https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

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

  // Reset upload states when component unmounts or user changes
  useEffect(() => {
    return () => {
      setIsBannerUploading(false);
      setIsProfilePicUploading(false);
    };
  }, []);

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
    const normalized = country.trim();
    if (normalized.length < 2 || normalized.length > 56) {
      return { isValid: false, error: 'Please select a valid country name' };
    }
    // Allow letters, spaces, ampersand, hyphens and periods (e.g., "Côte d'Ivoire" may be normalized by backend)
    const countryRegex = /^[a-zA-Z\s\-\&\.']+$/;
    if (!countryRegex.test(normalized)) {
      return { isValid: false, error: 'Country name contains invalid characters' };
    }
    return { isValid: true };
  };

  const validateDesignation = (designation: string): { isValid: boolean; error?: string } => {
    if (designation && designation.trim().length > 0) {
      const d = designation.trim();
      if (d.length < 2) {
        return { isValid: false, error: 'Job Title must be at least 2 characters' };
      }
      if (d.length > 100) {
        return { isValid: false, error: 'Job Title must not exceed 100 characters' };
      }
      // No long runs of punctuation, allow letters, numbers and common job-title punctuation
      const designationRegex = /^[a-zA-Z0-9][a-zA-Z0-9\s\-\/\,\.\&()]{0,98}[a-zA-Z0-9\)]?$/;
      if (!designationRegex.test(d)) {
        return { isValid: false, error: 'Job Title contains invalid characters or formatting' };
      }
      // Disallow titles that are only numbers or punctuation
      if (/^[0-9\W_]+$/.test(d)) {
        return { isValid: false, error: 'Job Title must contain letters' };
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

  // Global edit mode functions
  const startGlobalEdit = () => {
    setIsGlobalEditMode(true);
    // Initialize all fields for editing with current values
    const fieldsToEdit = ['name', 'mobile', 'dob', 'country', 'designation', 'about'];
    const initialFields: Record<string, EditableField> = {};
    
    fieldsToEdit.forEach(fieldName => {
      const currentValue = profileData?.[fieldName as keyof UserData] as string || '';
      initialFields[fieldName] = {
        field: fieldName as keyof UserData,
        value: currentValue,
        isEditing: true
      };
    });
    
    setEditableFields(initialFields);
  };

  const cancelGlobalEdit = () => {
    setIsGlobalEditMode(false);
    setEditableFields({});
  };

  const handleSaveClick = () => {
    setShowSaveConfirmation(true);
  };

  const confirmSave = async () => {
    setShowSaveConfirmation(false);
    setIsSaving(true);
    
    try {
      // Validate all fields first
      const fieldsToValidate = Object.keys(editableFields);
      for (const fieldName of fieldsToValidate) {
        const fieldData = editableFields[fieldName];
        if (fieldData) {
          const validation = validateField(fieldName, fieldData.value);
          if (!validation.isValid) {
            toastError('Validation Error', `${fieldName}: ${validation.error}`);
            setIsSaving(false);
            return;
          }
        }
      }

      // Prepare update data
      const updateData: Partial<UserData> = {};
      fieldsToValidate.forEach(fieldName => {
        const fieldData = editableFields[fieldName];
        if (fieldData) {
          updateData[fieldName as keyof UserData] = fieldData.value.trim() as any;
        }
      });

      const updatedProfile = await updateProfile(updateData as any);

      if (updatedProfile) {
        setProfileData(updatedProfile);
        setIsGlobalEditMode(false);
        setEditableFields({});
        toastSuccess('Profile updated successfully!');
      } else {
        toastError('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toastError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelSave = () => {
    setShowSaveConfirmation(false);
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

    setIsBannerUploading(true);
    setIsSaving(true);

    try {
      console.log('🚀 Starting banner upload...');
      
      // Upload image and update database
      const result = await uploadAndUpdateImage(file, 'banner', userData?.userId!);
      
      if (result.success && result.url) {
        console.log('✅ Banner upload successful:', result.url);
        
        // Update user store directly (same as header)
        if (userData) {
          setUserData({
            ...userData,
            banner: {
              ...userData.banner,
              image: result.url,
            },
          });
        }
        
        // Also update the profile hook for consistency
        await updateProfile(
          { 
            banner: {
              ...userData?.banner,
              image: result.url,
            }
          },
          { suppressToast: true }
        );
        
        console.log('🎉 Banner updated successfully in UI');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Banner upload error:', error);
      toastError('Failed to update banner. Please try again.');
    } finally {
      setIsSaving(false);
      setIsBannerUploading(false);
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

    setIsProfilePicUploading(true);
    setIsSaving(true);

    try {
      console.log('🚀 Starting profile picture upload...');
      
      // Upload image and update database
      const result = await uploadAndUpdateImage(file, 'profileImage', userData?.userId!);
      
      if (result.success && result.url) {
        console.log('✅ Profile picture upload successful:', result.url);
        
        // Update user store directly (same as header)
        if (userData) {
          setUserData({
            ...userData,
            profileImage: result.url,
          });
        }
        
        // Also update the profile hook for consistency
        await updateProfile(
          { profileImage: result.url },
          { suppressToast: true }
        );
        
        console.log('🎉 Profile picture updated successfully in UI');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Profile picture upload error:', error);
      toastError('Failed to update profile picture. Please try again.');
    } finally {
      setIsSaving(false);
      setIsProfilePicUploading(false);
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
    const isEditing = isGlobalEditMode && editableFields['dob']?.isEditing;
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
      
      // Create a date object and use global format
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return formatGlobalDate(dateObj);
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
        <div className={`p-3 rounded-lg border ${hasError ? 'border-red-400 bg-red-50/50' : 'border-[#E6E6E6]'}`}>
          <div className="flex items-center gap-3 mb-1">
            <Calendar className={`h-4 w-4 ${hasError ? 'text-red-500' : 'text-[#6A707C]'}`} />
            <Label className={`text-sm font-medium ${hasError ? 'text-red-600' : 'text-[#2D2F34]'}`}>Date of Birth</Label>
          </div>
          <div className="ml-4 sm:ml-7">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Select 
                  value={month || ''} 
                  onValueChange={(value) => updateDOBField(day, value, year)}
                >
                  <SelectTrigger className={`w-full sm:w-[120px] h-8 ${hasError ? 'border-red-400' : 'border-[#E4E4E4]'}`}>
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
                  <SelectTrigger className={`w-full sm:w-[80px] h-8 ${hasError ? 'border-red-400' : 'border-[#E4E4E4]'}`}>
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
                  <SelectTrigger className={`w-full sm:w-[100px] h-8 ${hasError ? 'border-red-400' : 'border-[#E4E4E4]'}`}>
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
              <p className="text-sm text-[#6A707C] py-1">
                {formatDisplayDate(currentDOB)}
              </p>
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

  

  // Render the page even during initial load, but show skeletons while initializing
  // If there's absolutely no profileData after initialization, show a helpful empty state
  if (!profileData && !isInitializing) {
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
          {isInitializing ? (
            <div className="w-full h-48 md:h-64 bg-gray-200 animate-pulse flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="w-full h-48 md:h-64 relative">
              <Image
                src={bannerImage || ''}
                alt="Profile Banner"
                fill
                className="object-cover"
                priority={false}
              />
            </div>
          )}
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
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 mb-4 sm:mb-0">
            <div className="z-10 -mt-16 sm:-mt-24 relative group">
              {isInitializing ? (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-gray-200 animate-pulse flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : profile?.profileImage || userData?.profileImage ? (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white relative shadow-md overflow-hidden">
                  <Image
                    src={(profile?.profileImage || userData?.profileImage) || ''}
                    alt={profile?.name || userData?.name || "User"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 128px, 160px"
                  />
                </div>
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
              {isSaving && isProfilePicUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
               <button
                 className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                   isSaving && isProfilePicUploading 
                     ? 'opacity-0 cursor-not-allowed' 
                     : 'opacity-0 group-hover:opacity-100'
                 }`}
                 onClick={handleProfilePicEdit}
                 title={isSaving && isProfilePicUploading ? "Uploading profile picture..." : "Edit profile picture"}
                 type="button"
                 disabled={isSaving && isProfilePicUploading}
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
                {isInitializing ? (
                  <div className="space-y-2">
                    <div className="w-48 h-6 bg-gray-200 rounded-md animate-pulse" />
                    <div className="w-24 h-4 bg-gray-200 rounded-md animate-pulse mt-2" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2F34]">
                      {profileData?.name || "User"}
                    </h1>
                    <Badge variant="outline" className="text-xs border-[#E4E6E6] text-[#6A707C]">
                      {profileData?.status || 'Active'}
                    </Badge>
                  </>
                )}
              </div>
              {isInitializing ? (
                <div className="w-64 h-4 bg-gray-200 rounded-md animate-pulse" />
              ) : (
                <p className="text-[#6A707C]">
                  {profileData?.email || "No email provided"}
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600 mt-1">
                  Error: {error}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-8 bg-[#E6E6E6]" />

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pb-8">
            {/* Main Profile Information */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card className="bg-white rounded-xl shadow-sm border-[#E6E6E6]">
                <CardHeader className="border-b border-[#E6E6E6]">
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <CardTitle className="flex items-center gap-2 text-[#2D2F34] font-semibold text-sm sm:text-base">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#3B43D6]" />
                      Personal Information
                    </CardTitle>
                    {!isGlobalEditMode && (
                      <Button
                        onClick={startGlobalEdit}
                        className="bg-[#605BFF] hover:bg-[#4D47CC] text-white shadow-sm border-0 font-medium h-8 w-8 p-0"
                        size="sm"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <EditableFieldComponent
                    fieldName="name"
                    label="Full Name"
                    value={profileData?.name || ''}
                    icon={User}
                    isGlobalEditMode={isGlobalEditMode}
                    editableFields={editableFields}
                    updateFieldValue={updateFieldValue}
                    validateField={validateField}
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
                    isGlobalEditMode={isGlobalEditMode}
                    editableFields={editableFields}
                    updateFieldValue={updateFieldValue}
                    validateField={validateField}
                  />
                  <DOBFieldComponent />
                  {/* Country selection: use a select dropdown when editing */}
                  <div className="flex flex-col">
                    <div className={`p-3 rounded-lg border ${isGlobalEditMode && !validateCountry(editableFields['country']?.value ?? profileData?.country ?? '').isValid ? 'border-red-400 bg-red-50/50' : 'border-[#E6E6E6]'}`}>
                      <div className="flex items-center gap-3 mb-1">
                        <MapPin className={`h-4 w-4 text-[#6A707C]`} />
                        <Label className="text-sm font-medium text-[#2D2F34]">Country</Label>
                      </div>
                      <div className="ml-4 sm:ml-7">
                        {isGlobalEditMode ? (
                          <select
                            value={editableFields['country']?.value ?? profileData?.country ?? ''}
                            onChange={(e) => updateFieldValue('country', e.target.value)}
                            className="h-8 w-full border-[#E4E4E4] focus:border-[#3B43D6] rounded-md px-2 text-[13px]"
                          >
                            <option value="">Select country</option>
                            {COUNTRIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-sm text-[#6A707C] py-1">{profileData?.country || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                    {/* Inline validation message */}
                    {isGlobalEditMode && (() => {
                      const v = validateCountry(editableFields['country']?.value ?? profileData?.country ?? '');
                      return (!v.isValid && v.error) ? (
                        <p className="text-xs text-red-600 mt-1 ml-10 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{v.error}</p>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-xl shadow-sm border-[#E6E6E6]">
                <CardHeader className="border-b border-[#E6E6E6]">
                  <CardTitle className="flex items-center gap-2 text-[#2D2F34] font-semibold text-sm sm:text-base">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-[#3B43D6]" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <EditableFieldComponent
                    fieldName="designation"
                    label="Job Title"
                    value={profileData?.designation || ''}
                    icon={Briefcase}
                    isGlobalEditMode={isGlobalEditMode}
                    editableFields={editableFields}
                    updateFieldValue={updateFieldValue}
                    validateField={validateField}
                  />
                  
                  {/* About Section */}
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center gap-3 mb-1">
                      <FileText className="h-4 w-4 text-[#6A707C]" />
                      <Label className="text-sm font-medium text-[#2D2F34]">About</Label>
                    </div>
                    <div className="ml-4 sm:ml-7">
                    {isGlobalEditMode && editableFields['about']?.isEditing ? (
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
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {profileData?.about || 'No bio added yet'}
                      </p>
                    )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Global Save/Cancel Buttons */}
              {isGlobalEditMode && (
                <div className="flex justify-center sm:justify-end gap-3 pt-4 sm:pt-6 border-t border-[#E6E6E6] mt-4 sm:mt-6">
                  <Button
                    variant="outline"
                    onClick={cancelGlobalEdit}
                    disabled={isSaving}
                    className="h-10 w-10 sm:h-10 sm:w-10 p-0 border-[#E6E6E6] hover:bg-[#F8F9FA] text-[#6A707C] font-medium shadow-sm touch-manipulation"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSaveClick}
                    disabled={isSaving}
                    className="bg-[#605BFF] hover:bg-[#4D47CC] text-white h-10 w-10 sm:h-10 sm:w-10 p-0 font-medium shadow-sm border-0 disabled:opacity-50 touch-manipulation"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="bg-white rounded-xl shadow-sm border-[#E6E6E6]">
                <CardHeader className="border-b border-[#E6E6E6]">
                  <CardTitle className="text-[#2D2F34] font-semibold text-sm sm:text-base">Account Status</CardTitle>
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
                        {profileData?.createdAt ? formatGlobalDate(profileData.createdAt) : 'N/A'}
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

      {/* Save Confirmation Dialog */}
      {showSaveConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 max-w-sm sm:max-w-lg w-full mx-4 border border-[#E6E6E6]">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-[#2D2F34]">Confirm Changes</h3>
            <p className="text-[#6A707C] mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
              Do you want to save the changes you made to your profile?
            </p>
            <div className="flex justify-center sm:justify-end gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={cancelSave}
                disabled={isSaving}
                className="h-12 w-12 p-0 border-[#E6E6E6] hover:bg-[#F8F9FA] text-[#6A707C] font-medium"
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                onClick={confirmSave}
                disabled={isSaving}
                className="bg-[#605BFF] hover:bg-[#4D47CC] text-white h-12 w-12 p-0 font-medium shadow-sm border-0 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

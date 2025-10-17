"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Settings, User, Save, Edit3, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserStore } from "@/stores/user-store";
import { userApi } from "@/lib/api-client";

// Optimized countries list - memoized for performance
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'BR', name: 'Brazil' },
] as const;

// Memoized form field component for better performance
const FormField = memo(({ 
  label, 
  icon: Icon, 
  children 
}: { 
  label: string; 
  icon: React.ElementType; 
  children: React.ReactNode; 
}) => (
  <div className="flex items-center gap-3 p-3 border rounded-lg">
    <Icon className="h-5 w-5 text-muted-foreground" />
    <div className="flex-1">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  </div>
));

FormField.displayName = 'FormField';

// Memoized debug panel component
const DebugPanel = memo(({ 
  isEditing, 
  profile 
}: { 
  isEditing: boolean; 
  profile: any; 
}) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">Debug Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs space-y-2">
          <p><strong>Edit Mode:</strong> {isEditing ? 'ON' : 'OFF'}</p>
          <p><strong>Current Mobile:</strong> "{profile.mobile}"</p>
          <p><strong>Current Name:</strong> "{profile.name}"</p>
          <p><strong>Current Email:</strong> "{profile.email}"</p>
        </div>
      </CardContent>
    </Card>
  );
});

DebugPanel.displayName = 'DebugPanel';

function SettingsPage() {
  const { userData, setUserData } = useUserStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Simple profile state - initialize with default values
  const [profile, setProfile] = useState({
    name: 'Mohammad Nouman',
    email: 'mohammadnouman604@gmail.com',
    mobile: '8431609172',
    country: '',
  });

  // Backup for cancel functionality
  const [originalProfile, setOriginalProfile] = useState({
    name: 'Mohammad Nouman',
    email: 'mohammadnouman604@gmail.com',
    mobile: '8431609172',
    country: '',
  });

  // Load user data
  useEffect(() => {
    if (userData) {
      const newProfile = {
        name: userData.name || 'Mohammad Nouman',
        email: userData.email || 'mohammadnouman604@gmail.com',
        mobile: userData.mobile || '8431609172',
        country: userData.country || '',
      };
      setProfile(newProfile);
      setOriginalProfile(newProfile);
    }
  }, [userData]);

  // Memoized computed values for performance
  const isProfileChanged = useMemo(() => {
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  }, [profile, originalProfile]);

  const countriesOptions = useMemo(() => {
    return COUNTRIES.map((country) => ({
      value: country.name,
      label: country.name,
      code: country.code
    }));
  }, []);

  // Debounced change handler for better performance
  const handleChange = useCallback((field: string, value: string) => {
    console.log(`Updating ${field}:`, value);
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  // Optimized save function with better error handling
  const optimizedSaveProfile = useCallback(async () => {
    if (!userData?.userId) {
      alert('User ID not found. Please refresh and try again.');
      return;
    }

    if (!isProfileChanged) {
      alert('No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      const profileDataToSend: Record<string, string> = {};

      // Only send non-empty fields that have changed
      Object.entries(profile).forEach(([key, value]) => {
        if (value && value.trim() && value !== originalProfile[key as keyof typeof originalProfile]) {
          profileDataToSend[key] = value.trim();
        }
      });

      if (Object.keys(profileDataToSend).length === 0) {
        alert('No changes detected.');
        setIsSaving(false);
        return;
      }

      const response = await userApi.updateProfile(userData.userId, profileDataToSend) as any;

      if (response?.success) {
        setUserData({ ...userData, ...profile });
        setOriginalProfile({ ...profile });
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        throw new Error(response?.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [userData, profile, originalProfile, isProfileChanged, setUserData]);

  const startEditing = useCallback(() => {
    setOriginalProfile({ ...profile });
    setIsEditing(true);
  }, [profile]);

  const cancelEditing = useCallback(() => {
    setProfile({ ...originalProfile });
    setIsEditing(false);
  }, [originalProfile]);


  return (
    <div className="min-h-screen bg-[#FAFAFB] p-6 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Modern Header Section */}
        <div className="mb-8">
          <div className="flex items-start gap-5 mb-6">
            <div className="w-14 h-14 rounded-full bg-[#EFF1F6] flex items-center justify-center flex-shrink-0">
              <Settings className="h-7 w-7 text-[#3B43D6]" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-[#2D2F34] mb-2">
                Profile Settings
              </h1>
              <p className="text-sm text-[#6A707C]">
                Manage your personal information and account preferences. Keep your profile up-to-date for better collaboration.
              </p>
            </div>
            <Button
              onClick={optimizedSaveProfile}
              disabled={isSaving || !isEditing || !isProfileChanged}
              className="flex items-center gap-2 bg-[#605BFF] hover:bg-[#4D47CC] text-white h-9 px-4"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-white rounded-xl shadow-sm border-[#E6E6E6]">
          <CardHeader className="border-b border-[#E6E6E6] pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#2D2F34]">
                <User className="h-5 w-5 text-[#3B43D6]" />
                <span className="font-semibold">Personal Information</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={isEditing ? cancelEditing : startEditing}
                className="flex items-center gap-2 h-9 hover:bg-[#EFF1F6]"
              >
                <Edit3 className="h-4 w-4" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4">
              {/* Full Name */}
              <FormField label="Full Name" icon={User}>
                {isEditing ? (
                  <Input
                    value={profile.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1 border-[#E4E4E4] focus:border-[#3B43D6]"
                  />
                ) : (
                  <p className="text-[#6A707C] mt-1">{profile.name || 'Not provided'}</p>
                )}
              </FormField>

              {/* Email Address */}
              <FormField label="Email Address" icon={Mail}>
                {isEditing ? (
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="mt-1 border-[#E4E4E4] focus:border-[#3B43D6]"
                  />
                ) : (
                  <p className="text-[#6A707C] mt-1">{profile.email || 'Not provided'}</p>
                )}
              </FormField>

              {/* Phone Number */}
              <FormField label="Phone Number" icon={Phone}>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={profile.mobile}
                    onChange={(e) => {
                      console.log('Phone changing to:', e.target.value);
                      handleChange('mobile', e.target.value);
                    }}
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    className="mt-1 border-[#E4E4E4] focus:border-[#3B43D6]"
                  />
                ) : (
                  <p className="text-[#6A707C] mt-1">{profile.mobile || 'Not provided'}</p>
                )}
              </FormField>

              {/* Country */}
              <FormField label="Country" icon={MapPin}>
                {isEditing ? (
                  <Select
                    value={profile.country}
                    onValueChange={(value: string) => handleChange('country', value)}
                  >
                    <SelectTrigger className="mt-1 border-[#E4E4E4] focus:border-[#3B43D6]">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countriesOptions.map((country) => (
                        <SelectItem key={country.code} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-[#6A707C] mt-1">{profile.country || 'Not provided'}</p>
                )}
              </FormField>

              {/* Edit Controls */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-[#E6E6E6]">
                  <Button
                    size="sm"
                    onClick={optimizedSaveProfile}
                    disabled={isSaving || !isProfileChanged}
                    className="flex items-center gap-2 bg-[#605BFF] hover:bg-[#4D47CC] text-white h-9"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="h-9 border-[#E4E4E4] hover:bg-[#FAFAFB]"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <DebugPanel isEditing={isEditing} profile={profile} />
      </div>
    </div>
  );
}

// Export memoized component for better performance
export default memo(SettingsPage);

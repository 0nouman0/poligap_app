"use client";

import { ProfileDataTest } from '@/components/ProfileDataTest';

export default function TestProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">MongoDB Profile Integration Test</h1>
          <p className="text-muted-foreground">
            Debug and test the MongoDB user profile integration
          </p>
        </div>
        
        <ProfileDataTest />
      </div>
    </div>
  );
}

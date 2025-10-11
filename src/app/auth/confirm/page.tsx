"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const supabase = createClient();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the hash from URL (contains the verification token)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'signup' && access_token) {
          // Set the session with the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setStatus('error');
            setMessage('Failed to verify email. The link may have expired.');
            return;
          }

          // Get the user to confirm they're logged in
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error('User error:', userError);
            setStatus('error');
            setMessage('Failed to verify email. Please try again.');
            return;
          }

          // Check if email is verified
          if (user.email_confirmed_at) {
            setStatus('success');
            setMessage('Email verified successfully! Redirecting to login...');
            
            // Sign out the user so they can log in properly
            await supabase.auth.signOut();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              router.push('/auth/signin?verified=true');
            }, 3000);
          } else {
            setStatus('error');
            setMessage('Email verification is pending. Please check your inbox.');
          }
        } else {
          setStatus('error');
          setMessage('Invalid verification link. Please request a new one.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    verifyEmail();
  }, [router, supabase]);

  const logoSrc = "/assets/poligap-high-resolution-logo.png";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image 
              src={logoSrc} 
              alt="Poligap AI" 
              width={120} 
              height={120} 
              className="object-contain" 
            />
          </div>
          <div className="flex justify-center">
            <div className={`rounded-full p-3 ${
              status === 'loading' ? 'bg-blue-100' : 
              status === 'success' ? 'bg-green-100' : 
              'bg-red-100'
            }`}>
              {status === 'loading' && <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-12 w-12 text-green-600" />}
              {status === 'error' && <XCircle className="h-12 w-12 text-red-600" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-2">
              <p className="text-sm text-green-800">
                Your account has been verified successfully!
              </p>
              <p className="text-xs text-green-700">
                You'll be redirected to the login page in a few seconds...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/verify-email')}
                variant="outline"
                className="w-full"
              >
                Request New Verification Email
              </Button>
              <Button
                onClick={() => router.push('/auth/signin')}
                variant="default"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Go to Sign In
              </Button>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center text-sm text-gray-500">
              Please wait while we verify your email address...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

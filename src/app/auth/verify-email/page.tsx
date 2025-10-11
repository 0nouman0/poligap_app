"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResendLoading(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      // Call Supabase to resend confirmation email
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendSuccess(true);
        setCountdown(60); // 60 second cooldown
      } else {
        setResendError(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setResendError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

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
            <div className="rounded-full bg-purple-100 p-3">
              <Mail className="h-12 w-12 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription className="text-base">
            We've sent a verification link to
            <div className="font-semibold text-purple-700 mt-1">
              {email || 'your email address'}
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-blue-900">Next Steps:</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">1.</span>
                <span>Check your email inbox (and spam folder)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">2.</span>
                <span>Click the verification link in the email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">3.</span>
                <span>You'll be redirected to the login page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">4.</span>
                <span>Sign in with your credentials</span>
              </li>
            </ol>
          </div>

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                Verification email sent successfully! Please check your inbox.
              </p>
            </div>
          )}

          {resendError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{resendError}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={resendLoading || countdown > 0}
              variant="outline"
              className="w-full"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>Resend in {countdown}s</>
              ) : (
                <>Resend Verification Email</>
              )}
            </Button>

            <Link href="/auth/signin" className="block">
              <Button 
                variant="default" 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Already Verified? Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="text-center text-xs text-gray-500 pt-4">
            Having trouble? Contact{" "}
            <a href="mailto:support@poligap.com" className="text-purple-600 hover:underline">
              support@poligap.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useTheme } from "next-themes";
import { toastError } from "@/components/toast-varients";
import { cn } from "@/lib/utils";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { createClient } from "@/lib/supabase/client";
import { clearOldCache } from "@/lib/utils/clear-old-cache";

// Validation schema
const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const prevThemeRef = useRef<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    
    // Check if user came from email verification
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      setVerificationSuccess(true);
      // Clear the URL parameter after 5 seconds
      setTimeout(() => {
        window.history.replaceState({}, '', '/auth/signin');
      }, 5000);
    }
    
    // Clear old MongoDB cache on mount
    clearOldCache();
    // Force light mode on this page and restore previous theme on unmount
    prevThemeRef.current = theme ?? resolvedTheme;
    setTheme("light");
    return () => {
      if (prevThemeRef.current) {
        setTheme(prevThemeRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid')) {
          setError("password", {
            type: "manual",
            message: "Incorrect email or password.",
          });
        } else {
          toastError("Sign in failed", error.message);
        }
        return;
      }

      if (authData?.user) {
        router.push("/home");
        router.refresh();
      }
    } catch (error) {
      console.log("signin error =>", error);
      toastError("Network error", "Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const krooloLogoSrc = "/assets/poligap-logo.png";

  return (
    <div className="min-h-screen flex bg-white text-gray-900">
      {/* Left Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center">
              <Image
                src={krooloLogoSrc}
                alt="PoliGap AI Logo"
                width={280}
                height={280}
                priority
                className="object-contain"
                style={{ width: 'auto', height: 'auto', maxWidth: '200px' }}
              />
            </div>
          </div>

          {/* Sign In Form */}
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-center">Sign in</h2>
            
            {/* Email Verification Success Banner */}
            {verificationSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900">Email Verified Successfully!</h3>
                  <p className="text-xs text-green-700 mt-1">
                    Your account is now active. Please sign in to continue.
                  </p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">
                  Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  disabled={isLoading}
                  className={cn(
                    "w-full px-3 py-2 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",
                    "hover:border-base-purple",
                    "focus:border-base-purple",
                    "focus-visible:border-base-purple",
                    errors.email &&
                      "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"
                  )}
                />

                {errors.email && (
                  <p className="text-xs text-error-red">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    disabled={isLoading}
                    className={cn(
                      "w-full px-3 py-2 pr-10 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",
                      "hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple",
                      errors.password &&
                        "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <VisibilityIcon className="h-4 w-4 " />
                    ) : (
                      <VisibilityOffIcon className="h-4 w-4 " />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error-red">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full cursor-pointer bg-base-purple hover:bg-base-purple-hover text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-xs text-gray-500">
              {"Don't have an account? "}
              <Link
                href="/auth/signup"
                className="text-base-purple hover:text-base-purple-hover font-medium"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

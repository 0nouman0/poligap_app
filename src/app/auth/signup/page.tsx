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
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toastError } from "@/components/toast-varients";
import { clearOldCache } from "@/lib/utils/clear-old-cache";

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const prevThemeRef = useRef<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    // Clear old MongoDB cache on mount
    clearOldCache();
    // Force light mode while on this page; restore on unmount
    prevThemeRef.current = theme ?? resolvedTheme;
    setTheme("light");
    return () => {
      if (prevThemeRef.current) setTheme(prevThemeRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Sign up with Supabase Auth with email confirmation required
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          setError("email", { type: "manual", message: "Email already registered" });
        } else {
          toastError("Signup failed", authError.message);
        }
        return;
      }

      if (authData?.user) {
        // Create profile entry via API
        const profileResponse = await fetch('/api/users/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: authData.user.id,
            email: data.email,
            name: data.name,
          }),
        });

        if (!profileResponse.ok) {
          console.error('Profile creation failed, but user is signed up');
        }

        // Check if email confirmation is required
        if (authData.user.email_confirmed_at === null) {
          // Email confirmation is required - redirect to verification page
          router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
        } else {
          // Email is already confirmed (shouldn't happen for new signups, but just in case)
          router.push("/home");
          router.refresh();
        }
      }
    } catch (e) {
      console.error('Signup error:', e);
      toastError("Network error", "Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const logoSrc = "/assets/poligap-high-resolution-logo.png";

  return (
    <div className="min-h-screen flex bg-white text-gray-900">
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <Image src={logoSrc} alt="Poligap AI" width={200} height={200} className="object-contain" />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-medium text-center">Sign up</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
                <Input id="name" placeholder="Jane Doe" {...register("name")} disabled={isLoading}
                  className={cn(
                    "w-full px-3 py-2 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",
                    "hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple",
                    errors.name && "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"
                  )}
                />
                {errors.name && <p className="text-xs text-error-red">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">Work Email</Label>
                <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} disabled={isLoading}
                  className={cn(
                    "w-full px-3 py-2 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",
                    "hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple",
                    errors.email && "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"
                  )}
                />
                {errors.email && <p className="text-xs text-error-red">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <Input id="password" type="password" placeholder="Enter a strong password" {...register("password")} disabled={isLoading}
                  className={cn(
                    "w-full px-3 py-2 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",
                    "hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple",
                    errors.password && "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"
                  )}
                />
                {errors.password && <p className="text-xs text-error-red">{errors.password.message}</p>}
              </div>

              {apiError && <p className="text-xs text-error-red">{apiError}</p>}

              <Button type="submit" className="w-full cursor-pointer bg-base-purple hover:bg-base-purple-hover text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>) : ("Create Account")}
              </Button>
            </form>
            <div className="mt-2 text-center text-xs text-gray-500">
              Already have an account? <Link href="/auth/signin" className="text-base-purple hover:text-base-purple-hover font-medium">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";"use client";



import { useEffect, useRef, useState } from "react";import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";import { useRouter } from "next/navigation";

import Link from "next/link";import Link from "next/link";

import { useForm } from "react-hook-form";import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";import { z } from "zod";

import { Loader2 } from "lucide-react";import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";import { Label } from "@/components/ui/label";

import Image from "next/image";import Image from "next/image";

import { useTheme } from "next-themes";import { useTheme } from "next-themes";

import { toastError, toastSuccess } from "@/components/toast-varients";import { cn } from "@/lib/utils";

import { cn } from "@/lib/utils";import { createClient } from "@/lib/supabase/client";

import VisibilityIcon from "@mui/icons-material/Visibility";import { toastError } from "@/components/toast-varients";

import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";import { clearOldCache } from "@/lib/utils/clear-old-cache";

import { createClient } from "@/lib/supabase/client";

const signUpSchema = z.object({

// Validation schema  name: z.string().min(1, "Name is required"),

const signUpSchema = z.object({  email: z

  name: z.string().min(1, "Name is required"),    .string()

  email: z    .min(1, "Email is required")

    .string()    .email("Please enter a valid email address"),

    .min(1, "Email is required")  password: z

    .email("Please enter a valid email address"),    .string()

  password: z    .min(1, "Password is required")

    .string()    .min(6, "Password must be at least 6 characters"),

    .min(1, "Password is required")});

    .min(6, "Password must be at least 6 characters"),

  confirmPassword: z.string().min(1, "Please confirm your password"),type SignUpFormData = z.infer<typeof signUpSchema>;

}).refine((data) => data.password === data.confirmPassword, {

  message: "Passwords don't match",export default function SignUpPage() {

  path: ["confirmPassword"],  const [isLoading, setIsLoading] = useState(false);

});  const [apiError, setApiError] = useState<string | null>(null);

  const router = useRouter();

type SignUpFormData = z.infer<typeof signUpSchema>;  const { theme, resolvedTheme, setTheme } = useTheme();

  const prevThemeRef = useRef<string | undefined>(undefined);

export default function SignUpPage() {  const [mounted, setMounted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);  const supabase = createClient();

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);  useEffect(() => {

  const router = useRouter();    setMounted(true);

  const { theme, resolvedTheme, setTheme } = useTheme();    // Clear old MongoDB cache on mount

  const prevThemeRef = useRef<string | undefined>(undefined);    clearOldCache();

  const [mounted, setMounted] = useState(false);    // Force light mode while on this page; restore on unmount

  const supabase = createClient();    prevThemeRef.current = theme ?? resolvedTheme;

    setTheme("light");

  useEffect(() => {    return () => {

    setMounted(true);      if (prevThemeRef.current) setTheme(prevThemeRef.current);

    // Force light mode on this page and restore previous theme on unmount    };

    prevThemeRef.current = theme ?? resolvedTheme;    // eslint-disable-next-line react-hooks/exhaustive-deps

    setTheme("light");  }, []);

    return () => {

      if (prevThemeRef.current) {  const { register, handleSubmit, formState: { errors }, setError } = useForm<SignUpFormData>({

        setTheme(prevThemeRef.current);    resolver: zodResolver(signUpSchema),

      }    defaultValues: { name: "", email: "", password: "" },

    };  });

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);  const onSubmit = async (data: SignUpFormData) => {

    setIsLoading(true);

  const {    setApiError(null);

    register,    

    handleSubmit,    try {

    formState: { errors },      // Sign up with Supabase Auth with email confirmation required

    setError,      const { data: authData, error: authError } = await supabase.auth.signUp({

  } = useForm<SignUpFormData>({        email: data.email,

    resolver: zodResolver(signUpSchema),        password: data.password,

    defaultValues: {        options: {

      name: "",          data: {

      email: "",            name: data.name,

      password: "",          },

      confirmPassword: "",          emailRedirectTo: `${window.location.origin}/auth/confirm`,

    },        },

  });      });



  const onSubmit = async (data: SignUpFormData) => {      if (authError) {

    setIsLoading(true);        if (authError.message.toLowerCase().includes('already registered')) {

          setError("email", { type: "manual", message: "Email already registered" });

    try {        } else {

      const { data: authData, error } = await supabase.auth.signUp({          toastError("Signup failed", authError.message);

        email: data.email,        }

        password: data.password,        return;

        options: {      }

          data: {

            name: data.name,      if (authData?.user) {

          },        // Create profile entry via API

          emailRedirectTo: `${window.location.origin}/auth/signin?verified=true`,        const profileResponse = await fetch('/api/users/create-profile', {

        },          method: 'POST',

      });          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({

      if (error) {            id: authData.user.id,

        if (error.message.toLowerCase().includes('already registered')) {            email: data.email,

          setError("email", {            name: data.name,

            type: "manual",          }),

            message: "This email is already registered. Please sign in instead.",        });

          });

        } else {        if (!profileResponse.ok) {

          toastError("Sign up failed", error.message);          console.error('Profile creation failed, but user is signed up');

        }        }

        return;

      }        // Check if email confirmation is required

        if (authData.user.email_confirmed_at === null) {

      if (authData?.user) {          // Email confirmation is required - redirect to verification page

        toastSuccess(          router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);

          "Account created!",        } else {

          "Please check your email to verify your account."          // Email is already confirmed (shouldn't happen for new signups, but just in case)

        );          router.push("/home");

        // Redirect to a confirmation page or signin          router.refresh();

        setTimeout(() => {        }

          router.push("/auth/confirm");      }

        }, 2000);    } catch (e) {

      }      console.error('Signup error:', e);

    } catch (error) {      toastError("Network error", "Please check your connection.");

      console.log("signup error =>", error);    } finally {

      toastError("Network error", "Please check your connection.");      setIsLoading(false);

    } finally {    }

      setIsLoading(false);  };

    }

  };  const logoSrc = "/assets/poligap-logo.png";



  const krooloLogoSrc = "/assets/poligap-logo.png";  return (

    <div className="min-h-screen flex bg-white text-gray-900">

  return (      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">

    <div className="min-h-screen flex bg-white text-gray-900">        <div className="w-full max-w-md space-y-8">

      {/* Left Side - Sign Up Form */}          <div className="text-center">

      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">            <div className="flex items-center justify-center">

        <div className="w-full max-w-md space-y-8">              <Image src={logoSrc} alt="Poligap AI" width={280} height={280} className="object-contain" />

          {/* Logo */}            </div>

          <div className="text-center mb-8">          </div>

            <div className="flex items-center justify-center">

              <Image          <div className="space-y-6">

                src={krooloLogoSrc}            <h2 className="text-xl font-medium text-center">Sign up</h2>

                alt="PoliGap AI Logo"            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                width={500}              <div className="space-y-2">

                height={500}                <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>

                priority                <Input id="name" placeholder="Jane Doe" {...register("name")} disabled={isLoading}

                className="object-contain"                  className={cn(

                style={{ width: 'auto', height: 'auto', maxWidth: '450px' }}                    "w-full px-3 py-2 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",

              />                    "hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple",

            </div>                    errors.name && "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"

          </div>                  )}

                />

          {/* Sign Up Form */}                {errors.name && <p className="text-xs text-error-red">{errors.name.message}</p>}

          <div className="space-y-6">              </div>

            <h2 className="text-xl font-medium text-center">Create Account</h2>

                          <div className="space-y-2">

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">                <Label htmlFor="email" className="text-xs font-medium">Work Email</Label>

              <div className="space-y-2">                <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} disabled={isLoading}

                <Label htmlFor="name" className="text-xs font-medium">                  className={cn(

                  Full Name                    "w-full px-3 py-2 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",

                </Label>                    "hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple",

                <Input                    errors.email && "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"

                  id="name"                  )}

                  type="text"                />

                  placeholder="John Doe"                {errors.email && <p className="text-xs text-error-red">{errors.email.message}</p>}

                  {...register("name")}              </div>

                  disabled={isLoading}

                  className={cn(              <div className="space-y-2">

                    "w-full px-3 py-2 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",                <Label htmlFor="password" className="text-xs font-medium">Password</Label>

                    "hover:border-base-purple",                <Input id="password" type="password" placeholder="Enter a strong password" {...register("password")} disabled={isLoading}

                    "focus:border-base-purple",                  className={cn(

                    "focus-visible:border-base-purple",                    "w-full px-3 py-2 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",

                    errors.name &&                    "hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple",

                      "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"                    errors.password && "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"

                  )}                  )}

                />                />

                {errors.name && (                {errors.password && <p className="text-xs text-error-red">{errors.password.message}</p>}

                  <p className="text-xs text-error-red">              </div>

                    {errors.name.message}

                  </p>              {apiError && <p className="text-xs text-error-red">{apiError}</p>}

                )}

              </div>              <Button type="submit" className="w-full cursor-pointer bg-base-purple hover:bg-base-purple-hover text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>

                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>) : ("Create Account")}

              <div className="space-y-2">              </Button>

                <Label htmlFor="email" className="text-xs font-medium">            </form>

                  Work Email            <div className="mt-2 text-center text-xs text-gray-500">

                </Label>              Already have an account? <Link href="/auth/signin" className="text-base-purple hover:text-base-purple-hover font-medium">Sign in</Link>

                <Input            </div>

                  id="email"          </div>

                  type="email"        </div>

                  placeholder="john@example.com"      </div>

                  {...register("email")}    </div>

                  disabled={isLoading}  );

                  className={cn(}

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
                    placeholder="Create a password"
                    {...register("password")}
                    disabled={isLoading}
                    className={cn(
                      "w-full px-3 py-2 pr-10 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",
                      "hover:border-base-purple",
                      "focus:border-base-purple",
                      "focus-visible:border-base-purple",
                      errors.password &&
                        "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <VisibilityOffIcon className="h-4 w-4" />
                    ) : (
                      <VisibilityIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error-red">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                    className={cn(
                      "w-full px-3 py-2 pr-10 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors",
                      "hover:border-base-purple",
                      "focus:border-base-purple",
                      "focus-visible:border-base-purple",
                      errors.confirmPassword &&
                        "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <VisibilityOffIcon className="h-4 w-4" />
                    ) : (
                      <VisibilityIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-error-red">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-base-purple hover:bg-base-purple-hover text-white rounded-md font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-xs text-gray-500">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="text-base-purple hover:text-base-purple-hover font-medium"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { toastError, toastSuccess } from "@/components/toast-varients";
import { cn } from "@/lib/utils";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { createClient } from "@/lib/supabase/client";

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const prevThemeRef = useRef<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    prevThemeRef.current = theme ?? resolvedTheme;
    setTheme("light");
    return () => {
      if (prevThemeRef.current) {
        setTheme(prevThemeRef.current);
      }
    };
  }, []);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { name: data.name },
          emailRedirectTo: `${window.location.origin}/auth/signin?verified=true`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          setError("email", { type: "manual", message: "This email is already registered. Please sign in instead." });
        } else {
          toastError("Sign up failed", error.message);
        }
        return;
      }

      if (authData?.user) {
        toastSuccess("Account created!", "Please check your email to verify your account.");
        setTimeout(() => router.push("/auth/confirm"), 2000);
      }
    } catch (error) {
      console.log("signup error =>", error);
      toastError("Network error", "Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const krooloLogoSrc = "/assets/poligap-logo.png";

  return (
    <div className="min-h-screen flex bg-white text-gray-900">
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center">
              <Image src={krooloLogoSrc} alt="PoliGap AI Logo" width={500} height={500} priority className="object-contain" style={{ width: 'auto', height: 'auto', maxWidth: '450px' }} />
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-center">Create Account</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe" {...register("name")} disabled={isLoading} className={cn("w-full px-3 py-2 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple", errors.name && "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500")} />
                {errors.name && <p className="text-xs text-error-red">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">Work Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" {...register("email")} disabled={isLoading} className={cn("w-full px-3 py-2 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple", errors.email && "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500")} />
                {errors.email && <p className="text-xs text-error-red">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a password" {...register("password")} disabled={isLoading} className={cn("w-full px-3 py-2 pr-10 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple", errors.password && "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <VisibilityOffIcon className="h-4 w-4" /> : <VisibilityIcon className="h-4 w-4" />}</button>
                </div>
                {errors.password && <p className="text-xs text-error-red">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" {...register("confirmPassword")} disabled={isLoading} className={cn("w-full px-3 py-2 pr-10 rounded-md border border-transparent outline-none bg-transparent shadow-none transition-colors hover:border-base-purple focus:border-base-purple focus-visible:border-base-purple", errors.confirmPassword && "border border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 focus-visible:border-red-500")} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showConfirmPassword ? <VisibilityOffIcon className="h-4 w-4" /> : <VisibilityIcon className="h-4 w-4" />}</button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-error-red">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-10 bg-base-purple hover:bg-base-purple-hover text-white rounded-md font-medium">{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : "Sign Up"}</Button>
            </form>
            <div className="mt-4 text-center text-xs text-gray-500">Already have an account? <Link href="/auth/signin" className="text-base-purple hover:text-base-purple-hover font-medium">Sign in</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}

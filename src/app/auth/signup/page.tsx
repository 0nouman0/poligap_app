"use client";

import { useEffect, useState } from "react";
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const resp = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await resp.json();
      console.log("signup result =>", result);

      if (result?.data?.status === "ERROR") {
        const msg = result?.data?.message || "Sign up failed";
        if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("registered")) {
          setError("email", { type: "manual", message: "Email already registered" });
        } else {
          setApiError(msg);
        }
        return;
      }

      if (!resp.ok) {
        setApiError("Server error. Please try again.");
        return;
      }

      // Extract token and userId in a robust way
      const accessToken =
        result?.data?.data?.userToken?.AccessToken ||
        result?.data?.userToken?.AccessToken ||
        result?.userToken?.AccessToken ||
        result?.token || "";
      const userId =
        result?.data?.data?.userData?.userId ??
        result?.data?.userData?.userId ??
        result?.userData?.userId ?? "";

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("__LOGIN_SESSION__", accessToken);
      }
      if (userId) {
        localStorage.setItem("user_id", String(userId));
      }

      if (!accessToken) {
        setApiError("Account created but token missing in response. Please sign in.");
        router.push("/auth/signin");
        return;
      }

      router.push("/home");
    } catch (e) {
      setApiError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const logoSrc = "/assets/poligap-high-resolution-logo.png";

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <Image src={logoSrc} alt="Poligap AI" width={150} height={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">Create your PoliGap AI account</h1>
              <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                Sign up to start analyzing your compliance documents.
              </p>
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

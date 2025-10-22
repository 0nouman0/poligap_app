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
import { Eye, EyeOff } from "lucide-react";
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
    .min(8, "Password must be at least 8 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;

// Compact rotating facts box for the right panel
function DidYouKnow() {
  const facts = [
    { t: "AI accelerates contract reviews by 40–60% in enterprise legal ops.", c: "Gartner Legal Tech Hype Cycle, 2024" },
    { t: "Automated compliance checks can reduce audit prep time by ~35%.", c: "Deloitte RegTech Survey, 2023" },
    { t: "Policy templates mapped to controls cut downstream rework by ~25%.", c: "ISACA Governance Insights, 2023" },
    { t: "Early standards alignment lowers remediation costs by up to 30%.", c: "NIST CSF Adoption Report, 2022" },
    { t: "Clause libraries reduce drafting variance and negotiation cycles.", c: "WorldCC Contracting Benchmarks, 2023" },
    { t: "Proactive monitoring decreases regulatory incident exposure.", c: "BCG Compliance Outlook, 2024" },
    { t: "AI triage improves review prioritization for high‑risk contracts.", c: "ACLA Legal Operations Study, 2024" },
    { t: "Structured reviews improve obligation tracking and KPI reporting.", c: "PwC Risk & Controls Study, 2023" },
    { t: "Automated summaries lift stakeholder comprehension and velocity.", c: "McKinsey GenAI Use‑Cases, 2024" },
    { t: "Central policy governance improves auditability and change control.", c: "ISACA Audit Considerations, 2024" },
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % facts.length), 3500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs italic">
      <div className="text-[12px] text-indigo-900 min-h-[34px] transition-opacity duration-300">{facts[idx].t}</div>
      <div className="text-[10px] text-indigo-700/80 mt-1">[{idx + 1}] {facts[idx].c}</div>
    </div>
  );
}

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

  // Forgot Password UI state
  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep] = useState<"email" | "otp">("email");
  const [fpEmail, setFpEmail] = useState("");
  const [fpOTP, setFpOTP] = useState("");
  const [fpNewPass, setFpNewPass] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMessage, setFpMessage] = useState<string | null>(null);

  // Right panel: animated feature showcase
  const features = [
    {
      phrase: "Check compliances",
      title: "Regulatory Change Monitoring",
      subtitle: "Track evolving obligations across jurisdictions in real time.",
      suggestion: "Consider reviewing new ISO and GDPR updates impacting your policies.",
      progress: 62,
      actions: ["Prioritize", "Review", "Acknowledge"],
    },
    {
      phrase: "Review contracts",
      title: "AI‑Assisted Contract Review",
      subtitle: "Identify risks, deviations, and missing clauses instantly.",
      suggestion: "Clause variance detected: strengthen indemnity and data security terms.",
      progress: 78,
      actions: ["Flag Risk", "Edit Clause", "Approve"],
    },
    {
      phrase: "Generate policies",
      title: "Policy Generation & Governance",
      subtitle: "Draft, align, and version policies with measurable controls.",
      suggestion: "Draft aligns with SOC 2 controls; add incident response escalation steps.",
      progress: 54,
      actions: ["Refine", "Map Controls", "Publish"],
    },
    {
      phrase: "Monitor standards",
      title: "Standards Alignment",
      subtitle: "Continuously benchmark against ISO, NIST, SOC 2, and more.",
      suggestion: "NIST CSF gaps detected in Protect (PR.PT) domain—recommend remediation.",
      progress: 41,
      actions: ["Create Task", "Assign", "Track"],
    },
  ] as const;
  const phrases = features.map(f => f.phrase);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState<number>(features[0].progress);
  const current = features[phraseIndex % features.length];

  // Step-by-step flow animation (Upload → Parse → Edit → Download)
  const steps = [
    { key: "upload", title: "Upload", desc: "Drag & drop documents for instant intake." },
    { key: "parse", title: "Parse", desc: "Extract entities, clauses, and metadata." },
    { key: "edit", title: "Edit", desc: "Refine with AI suggestions and controls." },
    { key: "download", title: "Export", desc: "Download polished outputs and share." },
  ] as const;
  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStepIndex((i) => (i + 1) % steps.length), 1400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const full = phrases[phraseIndex % phrases.length];
    const speed = deleting ? 40 : 70;
    const timer = setTimeout(() => {
      if (!deleting) {
        const next = full.slice(0, typed.length + 1);
        setTyped(next);
        if (next === full) {
          setTimeout(() => setDeleting(true), 900);
        }
      } else {
        const next = full.slice(0, typed.length - 1);
        setTyped(next);
        if (next.length === 0) {
          setDeleting(false);
          setPhraseIndex((i) => (i + 1) % phrases.length);
        }
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [typed, deleting, phraseIndex]);

  // When phrase (feature) changes, animate progress towards its target
  useEffect(() => {
    const newTarget = features[phraseIndex % features.length].progress;
    setTargetProgress(newTarget);
  }, [phraseIndex]);

  useEffect(() => {
    if (progress === targetProgress) return;
    const step = progress < targetProgress ? 1 : -1;
    const id = setInterval(() => {
      setProgress((p) => {
        const np = p + step;
        if ((step > 0 && np >= targetProgress) || (step < 0 && np <= targetProgress)) {
          clearInterval(id);
          return targetProgress;
        }
        return np;
      });
    }, 12);
    return () => clearInterval(id);
  }, [targetProgress, progress]);

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

  // Forgot Password helpers
  const sendReset = async () => {
    if (!fpEmail) {
      setFpMessage("Please enter your email.");
      return;
    }
    setFpLoading(true);
    setFpMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(fpEmail, {
        redirectTo: `${window.location.origin}/auth/signin`,
      });
      if (error) throw error;
      setFpMessage("Reset email sent. Check your inbox for the OTP or link.");
      setFpStep("otp");
    } catch (e: any) {
      setFpMessage(e?.message || "Failed to send reset email");
    } finally {
      setFpLoading(false);
    }
  };

  const submitOtpReset = async () => {
    if (!fpEmail || !fpOTP || !fpNewPass) {
      setFpMessage("Enter email, OTP, and new password.");
      return;
    }
    setFpLoading(true);
    setFpMessage(null);
    try {
      const { data: sessionData, error: verifyErr } = await supabase.auth.verifyOtp({
        email: fpEmail,
        token: fpOTP,
        type: "recovery",
      });
      if (verifyErr) throw verifyErr;

      const { error: updErr } = await supabase.auth.updateUser({ password: fpNewPass });
      if (updErr) throw updErr;

      setFpMessage("Password updated. You can now sign in.");
      setFpStep("email");
      setShowForgot(false);
    } catch (e: any) {
      setFpMessage(e?.message || "Reset failed. Check OTP and try again.");
    } finally {
      setFpLoading(false);
    }
  };

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

  const krooloLogoSrc = "/assets/Poligap_wide_erased.png";

  return (
    <div className="min-h-screen flex bg-white text-gray-900">
      <div className="flex flex-col lg:flex-row w-full h-screen">
          {/* Left: Card with form */}
          <div className="w-full lg:w-2/3 flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-border p-8">
              {/* Logo */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center">
                  <Image
                    src={krooloLogoSrc}
                    alt="Logo"
                    width={400}
                    height={120}
                    priority
                    className="object-contain"
                    style={{ width: '220px', height: 'auto' }}
                  />
                </div>
              </div>

              {/* Sign In Form */}
              <div className="space-y-6">
                <h2 className="font-h2 text-center">Sign In</h2>
            
            {/* Email Verification Success Banner */}
            {verificationSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-title-14 text-green-900">Email Verified Successfully!</h3>
                  <p className="font-body-12 text-green-700 mt-1">
                    Your account is now active. Please sign in to continue.
                  </p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-title-14">
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
                  <p className="font-body-12 text-error-red">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-title-14">
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
                      <Eye className="h-4 w-4 " />
                    ) : (
                      <EyeOff className="h-4 w-4 " />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="font-body-12 text-error-red">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full cursor-pointer bg-base-purple hover:bg-base-purple-hover text-white py-2 px-4 rounded-md font-body-16-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="font-body-16">Signing In...</span>
                  </>
                ) : (
                  <span className="font-body-16">Sign In</span>
                )}
              </Button>
            </form>
                <div className="mt-4 text-center font-body-14 text-secondary">
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setFpStep("email"); setFpMessage(null); }}
                    className="text-base-purple hover:text-base-purple-hover font-body-14-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Animated feature showcase (light theme) */}
          <div className="hidden lg:flex w-full lg:w-[40%] items-center justify-center bg-white p-6">
            <div className="w-full max-w-xl text-gray-900 rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                Powered by Advanced AI Technology
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
                All‑in‑One Comprehensive Tool for
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">AI‑Powered Legal & Compliance</span>
              </h2>
              <div className="mt-5 text-base text-gray-600 min-h-[28px]">
                <span className="text-gray-500">Current focus: </span>
                <span className="font-medium text-gray-900">{typed}<span className="animate-pulse">|</span></span>
              </div>
              {/* Mockup card */}
              <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  poligap.com/dashboard
                </div>
                <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 grid place-items-center">✦</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{current.title}</div>
                        <div className="text-xs text-gray-600">{current.subtitle}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">In Progress</span>
                  </div>
                  <div className="mt-4 text-sm text-gray-700">
                    Insight: {current.suggestion}
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-[width] duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-4 flex gap-2 text-xs">
                    {current.actions.map((a, i) => (
                      <span key={i} className="px-3 py-1 rounded-md bg-gray-100 text-gray-800 border border-gray-200">{a}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Step-by-step flow */}
              <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                {/* Stepper */}
                <div className="flex items-center justify-between">
                  {steps.map((s, i) => (
                    <div key={s.key} className="flex-1 flex items-center">
                      <div className={`relative z-10 h-8 w-8 rounded-full grid place-items-center text-xs font-semibold ${i <= stepIndex ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                        {i + 1}
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`mx-2 h-1 rounded-full flex-1 ${i < stepIndex ? "bg-indigo-400" : "bg-gray-200"}`} />
                      )}
                    </div>
                  ))}
                </div>
                {/* Step copy */}
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-900">{steps[stepIndex].title}</div>
                  <div className="text-xs text-gray-600">{steps[stepIndex].desc}</div>
                </div>
                {/* Preview area */}
                <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 min-h-[120px]">
                  {stepIndex === 0 && (
                    <div className="text-center text-gray-600">
                      <div className="mx-auto mb-2 h-10 w-10 rounded-md bg-indigo-100 text-indigo-600 grid place-items-center">⬆️</div>
                      <div className="text-sm font-medium">Upload documents</div>
                      <div className="text-xs">PDF, DOCX, or TXT up to 25MB</div>
                    </div>
                  )}
                  {stepIndex === 1 && (
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Parsing… extracting key clauses</div>
                      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-[pulse_1.2s_ease-in-out_infinite] w-2/3" />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-gray-700">
                        <div className="rounded-md bg-white border p-2">Parties: 2</div>
                        <div className="rounded-md bg-white border p-2">Effective Date: 2025‑01‑01</div>
                        <div className="rounded-md bg-white border p-2">Term: 24 months</div>
                      </div>
                    </div>
                  )}
                  {stepIndex === 2 && (
                    <div>
                      <div className="text-xs text-gray-600 mb-2">AI Editor</div>
                      <div className="rounded-md border bg-white p-2 text-[11px] leading-5">
                        <span className="bg-yellow-100 text-yellow-800 px-1 rounded">Suggestion:</span> Strengthen confidentiality survival clause from 2 → 5 years.
                      </div>
                      <div className="mt-2 flex gap-2 text-[10px]">
                        <span className="px-2 py-1 rounded-md bg-gray-100 border">Accept</span>
                        <span className="px-2 py-1 rounded-md bg-gray-100 border">Modify</span>
                        <span className="px-2 py-1 rounded-md bg-gray-100 border">Comment</span>
                      </div>
                    </div>
                  )}
                  {stepIndex === 3 && (
                    <div className="text-center">
                      <div className="mx-auto mb-2 h-10 w-10 rounded-md bg-green-100 text-green-700 grid place-items-center">⬇️</div>
                      <div className="text-sm font-medium text-gray-900">Export ready</div>
                      <div className="text-xs text-gray-600">Download PDF / DOCX or share a secure link</div>
                    </div>
                  )}
                </div>
              </div>
              {/* Did you know - compact facts below capsule */}
              <div className="mt-5">
                <DidYouKnow />
              </div>
            </div>
          </div>
          {/* Forgot Password Modal */}
          {showForgot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" onClick={() => setShowForgot(false)} />
              <div className="relative w-[420px] bg-white rounded-lg shadow-lg border p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-[#202020]">Reset password</h3>
                  <button onClick={() => setShowForgot(false)} className="text-gray-500">✕</button>
                </div>
                {fpMessage && (
                  <div className="text-xs text-gray-700 bg-gray-50 border rounded p-2">{fpMessage}</div>
                )}
                {fpStep === "email" ? (
                  <div className="space-y-3">
                    <Label htmlFor="fpEmail" className="font-title-14">Email</Label>
                    <Input id="fpEmail" type="email" value={fpEmail} onChange={(e)=>setFpEmail(e.target.value)} placeholder="you@example.com" />
                    <Button onClick={sendReset} disabled={fpLoading} className="w-full bg-base-purple hover:bg-base-purple-hover text-white">
                      {fpLoading ? "Sending…" : "Send reset email / OTP"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="fpOTP" className="font-title-14">OTP from email</Label>
                    <Input id="fpOTP" value={fpOTP} onChange={(e)=>setFpOTP(e.target.value)} placeholder="Enter OTP" />
                    <Label htmlFor="fpNewPass" className="font-title-14">New password</Label>
                    <Input id="fpNewPass" type="password" value={fpNewPass} onChange={(e)=>setFpNewPass(e.target.value)} placeholder="Enter new password" />
                    <Button onClick={submitOtpReset} disabled={fpLoading} className="w-full bg-base-purple hover:bg-base-purple-hover text-white">
                      {fpLoading ? "Updating…" : "Update password"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    
    // 1. Authenticate with Supabase
    const { data: authData, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error || !authData?.user) {
      toast.error(error?.message ?? "Failed to sign in");
      setLoading(false);
      return;
    }

    // 2. Fetch the specific logged-in user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    const role = profile?.role ?? "student";

    // 3. Ensure role-based routing (prevents sending students to admin routes)
    const redirectParam = params.get("redirect");
    const target = 
      redirectParam && redirectParam.startsWith(`/dashboard/${role}`)
        ? redirectParam
        : `/dashboard/${role}`;

    router.push(target);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#FDFAFF] p-4 md:p-8 font-sans selection:bg-[#EADDFF] selection:text-[#25005A]">
      {/* Main Container */}
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[32px] border border-[#ECE6F0] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.08)] md:grid-cols-2">
        
        {/* Left Side: Clean Sign In Form */}
        <div className="flex flex-col justify-between p-8 sm:p-10 md:p-12">
          <div>
            {/* Academic Portal Pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ECE6F0] bg-[#FDF2F4] px-3.5 py-1.5 text-xs font-bold text-[#630ed4]">
              <span className="h-2 w-2 rounded-full bg-[#FF4D6D]" />
              <span>Academic Portal</span>
            </div>

            {/* Headline */}
            <div className="space-y-1.5 mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1c1b1b]">
                Welcome back
              </h1>
              <p className="text-sm text-[#4a4455]">
                Please enter your details to sign in.
              </p>
            </div>

            {/* Registration Success Banner */}
            {params.get("registered") && (
              <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Account created. You can now sign in.</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="block text-xs font-bold uppercase tracking-wider text-[#1c1b1b]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b7487]" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                    className="h-11 rounded-xl border-2 border-[#E5E2E1] pl-10 pr-4 text-sm text-[#1c1b1b] placeholder:text-[#7b7487]/60 transition-all focus-visible:border-[#7C3AED] focus-visible:ring-4 focus-visible:ring-[#7C3AED]/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="block text-xs font-bold uppercase tracking-wider text-[#1c1b1b]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b7487]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-2 border-[#E5E2E1] pl-10 pr-10 text-sm text-[#1c1b1b] placeholder:text-[#7b7487]/60 transition-all focus-visible:border-[#7C3AED] focus-visible:ring-4 focus-visible:ring-[#7C3AED]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7b7487] hover:text-[#1c1b1b] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] text-sm font-bold text-white shadow-sm transition-all hover:bg-[#6D28D9] hover:shadow-md hover:shadow-[#7C3AED]/25 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side: 3-Circle Gradient Design */}
        <div className="relative hidden md:flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8DCF8] via-[#F4EDFC] to-[#FDF3DE]">
          
          {/* Top-Right Vibrant Coral Circle */}
          <div className="absolute top-12 right-12 h-32 w-32 rounded-full bg-[#FF4D6D] shadow-[0_16px_36px_rgba(255,77,109,0.35)]" />

          {/* Center Semi-Transparent Frosted White Disc */}
          <div className="h-48 w-48 sm:h-52 sm:w-52 rounded-full bg-white/45 backdrop-blur-sm" />

          {/* Bottom-Left Vibrant Sunny Yellow Circle */}
          <div className="absolute bottom-12 left-12 h-28 w-28 rounded-full bg-[#FFD600] shadow-[0_14px_32px_rgba(255,214,0,0.38)]" />

        </div>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
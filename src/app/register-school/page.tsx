"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerSchool } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle 
} from "lucide-react";

export default function RegisterSchoolPage() {
  const [state, formAction, pending] = useActionState(registerSchool, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#FDFAFF] p-4 md:p-8 font-sans selection:bg-[#EADDFF] selection:text-[#25005A]">
      {/* Main Container */}
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[32px] border border-[#ECE6F0] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.08)] md:grid-cols-2">
        
        {/* Left Side: Clean Registration Form */}
        <div className="flex flex-col justify-between p-8 sm:p-10 md:p-12">
          <div>
            {/* Academic Portal Pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ECE6F0] bg-[#FDF2F4] px-3.5 py-1.5 text-xs font-bold text-[#630ed4]">
              <span className="h-2 w-2 rounded-full bg-[#FF4D6D]" />
              <span>Academic Portal</span>
            </div>

            {/* Headline */}
            <div className="space-y-1.5 mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1c1b1b]">
                Register school
              </h1>
              <p className="text-sm text-[#4a4455]">
                Create the school workspace and your admin account.
              </p>
            </div>

            {/* Error Message Banner */}
            {state?.error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Registration Form */}
            <form action={formAction} className="space-y-4">
              {/* School Name */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="schoolName" 
                  className="block text-xs font-bold uppercase tracking-wider text-[#1c1b1b]"
                >
                  School Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b7487]" />
                  <Input
                    id="schoolName"
                    name="schoolName"
                    required
                    placeholder="Greenfield High"
                    className="h-11 rounded-xl border-2 border-[#E5E2E1] pl-10 pr-4 text-sm text-[#1c1b1b] placeholder:text-[#7b7487]/60 transition-all focus-visible:border-[#7C3AED] focus-visible:ring-4 focus-visible:ring-[#7C3AED]/10"
                  />
                </div>
              </div>

              {/* Admin Name */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="adminName" 
                  className="block text-xs font-bold uppercase tracking-wider text-[#1c1b1b]"
                >
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b7487]" />
                  <Input
                    id="adminName"
                    name="adminName"
                    required
                    placeholder="Jane Doe"
                    className="h-11 rounded-xl border-2 border-[#E5E2E1] pl-10 pr-4 text-sm text-[#1c1b1b] placeholder:text-[#7b7487]/60 transition-all focus-visible:border-[#7C3AED] focus-visible:ring-4 focus-visible:ring-[#7C3AED]/10"
                  />
                </div>
              </div>

              {/* Admin Email */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="email" 
                  className="block text-xs font-bold uppercase tracking-wider text-[#1c1b1b]"
                >
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b7487]" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="admin@school.edu"
                    className="h-11 rounded-xl border-2 border-[#E5E2E1] pl-10 pr-4 text-sm text-[#1c1b1b] placeholder:text-[#7b7487]/60 transition-all focus-visible:border-[#7C3AED] focus-visible:ring-4 focus-visible:ring-[#7C3AED]/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
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
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={pending}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] text-sm font-bold text-white shadow-sm transition-all hover:bg-[#6D28D9] hover:shadow-md hover:shadow-[#7C3AED]/25 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating workspace…</span>
                    </>
                  ) : (
                    <>
                      <span>Create school & admin account</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs text-[#4a4455]">
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="font-bold text-[#7C3AED] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Right Side: Exact Visual Replica of the 3-Circle Gradient Design */}
        <div className="relative hidden md:flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8DCF8] via-[#F4EDFC] to-[#FDF3DE]">
          
          {/* Top-Right Vibrant Coral Circle with Soft Glow */}
          <div className="absolute top-12 right-12 h-32 w-32 rounded-full bg-[#FF4D6D] shadow-[0_16px_36px_rgba(255,77,109,0.35)]" />

          {/* Center Semi-Transparent Frosted White Disc */}
          <div className="h-48 w-48 sm:h-52 sm:w-52 rounded-full bg-white/45 backdrop-blur-sm" />

          {/* Bottom-Left Vibrant Sunny Yellow Circle with Soft Glow */}
          <div className="absolute bottom-12 left-12 h-28 w-28 rounded-full bg-[#FFD600] shadow-[0_14px_32px_rgba(255,214,0,0.38)]" />

        </div>

      </div>
    </main>
  );
}
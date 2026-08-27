"use client";

import { useState, useActionState } from "react";
import { verifyPortalAccess } from "./actions";
import { registerSchool } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  LogOut,
} from "lucide-react";

export default function SecurityPortalPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [showPortalPassword, setShowPortalPassword] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);

  // School registration state
  const [regState, regAction, regPending] = useActionState(registerSchool, null);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  async function handlePortalLogin(e: React.FormEvent) {
    e.preventDefault();
    setPortalLoading(true);
    setPortalError("");
    const fd = new FormData();
    fd.set("email", portalEmail);
    fd.set("password", portalPassword);
    const result = await verifyPortalAccess(fd);
    if (result.ok) {
      setUnlocked(true);
    } else {
      setPortalError(result.error ?? "Access denied.");
    }
    setPortalLoading(false);
  }

  // -------- Locked: Portal Login --------
  if (!unlocked) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#0F0B1A] p-4 md:p-8 font-sans">
        <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-[#2A1F3D] bg-[#161024] shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
          <div className="p-8 sm:p-10">
            {/* Shield Icon */}
            <div className="mb-8 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#630ED4] shadow-[0_8px_24px_rgba(124,58,237,0.4)]">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>

            <div className="space-y-1.5 mb-8 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Security Portal
              </h1>
              <p className="text-sm text-[#9D8BB5]">
                Restricted access. Authorized personnel only.
              </p>
            </div>

            {portalError && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-800/50 bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{portalError}</span>
              </div>
            )}

            <form onSubmit={handlePortalLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9D8BB5]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B5A85]" />
                  <Input
                    type="email"
                    required
                    value={portalEmail}
                    onChange={(e) => setPortalEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="h-11 rounded-xl border-2 border-[#2A1F3D] bg-[#0F0B1A] pl-10 pr-4 text-sm text-white placeholder:text-[#6B5A85]/60 transition-all focus-visible:border-[#7C3AED] focus-visible:ring-4 focus-visible:ring-[#7C3AED]/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9D8BB5]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B5A85]" />
                  <Input
                    type={showPortalPassword ? "text" : "password"}
                    required
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-2 border-[#2A1F3D] bg-[#0F0B1A] pl-10 pr-10 text-sm text-white placeholder:text-[#6B5A85]/60 transition-all focus-visible:border-[#7C3AED] focus-visible:ring-4 focus-visible:ring-[#7C3AED]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPortalPassword(!showPortalPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B5A85] hover:text-white transition-colors"
                  >
                    {showPortalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={portalLoading}
                className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#630ED4] text-sm font-bold text-white shadow-sm transition-all hover:shadow-md hover:shadow-[#7C3AED]/25 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <>
                    <span>Unlock portal</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // -------- Unlocked: School Registration --------
  // Check if registration succeeded (redirect to login happens via server action,
  // but if we're still here and regState has ok, show success)
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#FDFAFF] p-4 md:p-8 font-sans">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] border border-[#ECE6F0] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.08)] md:grid-cols-2 grid">
        {/* Left: Registration Form */}
        <div className="flex flex-col justify-between p-8 sm:p-10 md:p-12">
          <div>
            {/* Unlocked badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
              <Shield className="h-3.5 w-3.5" />
              <span>Portal unlocked</span>
            </div>

            <div className="space-y-1.5 mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1c1b1b]">
                Register new school
              </h1>
              <p className="text-sm text-[#4a4455]">
                Create a new school workspace and its first admin account.
              </p>
            </div>

            {regState?.error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{regState.error}</span>
              </div>
            )}

            <form
              action={async (fd: FormData) => {
                await regAction(fd);
                // If no error, the server action redirects to /login?registered=1
                // If there's an error, regState will be updated
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1c1b1b]">
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1c1b1b]">
                  Admin Name
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1c1b1b]">
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1c1b1b]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b7487]" />
                  <Input
                    id="password"
                    name="password"
                    type={showRegPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-2 border-[#E5E2E1] pl-10 pr-10 text-sm text-[#1c1b1b] placeholder:text-[#7b7487]/60 transition-all focus-visible:border-[#7C3AED] focus-visible:ring-4 focus-visible:ring-[#7C3AED]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7b7487] hover:text-[#1c1b1b] transition-colors"
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={regPending}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] text-sm font-bold text-white shadow-sm transition-all hover:bg-[#6D28D9] hover:shadow-md hover:shadow-[#7C3AED]/25 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {regPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating workspace…</span>
                    </>
                  ) : (
                    <>
                      <span>Create school &amp; admin account</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Lock portal button */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setUnlocked(false);
                setPortalEmail("");
                setPortalPassword("");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7b7487] hover:text-[#1c1b1b] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Lock portal
            </button>
          </div>
        </div>

        {/* Right Side: 3-Circle Gradient Design */}
        <div className="relative hidden md:flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8DCF8] via-[#F4EDFC] to-[#FDF3DE]">
          <div className="absolute top-12 right-12 h-32 w-32 rounded-full bg-[#FF4D6D] shadow-[0_16px_36px_rgba(255,77,109,0.35)]" />
          <div className="h-48 w-48 sm:h-52 sm:w-52 rounded-full bg-white/45 backdrop-blur-sm" />
          <div className="absolute bottom-12 left-12 h-28 w-28 rounded-full bg-[#FFD600] shadow-[0_14px_32px_rgba(255,214,0,0.38)]" />
        </div>
      </div>
    </main>
  );
}

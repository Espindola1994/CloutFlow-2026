"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck, QrCode, Key, ArrowRight, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type LoginStep = "PASSWORD" | "ENROLLMENT" | "TOTP" | "RECOVERY" | "RECOVERY_CODES_DISPLAY";

interface EnrollmentData {
  qrCode: string;
  manualKey: string;
  issuer: string;
  account: string;
}

export default function AdminLogin() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("PASSWORD");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [generatedRecoveryCodes, setGeneratedRecoveryCodes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totpInputRef = useRef<HTMLInputElement>(null);
  const recoveryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "TOTP" || step === "ENROLLMENT") {
      setTimeout(() => totpInputRef.current?.focus(), 150);
    } else if (step === "RECOVERY") {
      setTimeout(() => recoveryInputRef.current?.focus(), 150);
    }
  }, [step]);

  // Handle Step 1: Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      toast.error("Please enter password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.data?.stage === "ENROLLMENT_REQUIRED") {
          // Fetch enrollment QR & Secret
          await fetchEnrollmentInfo();
          setStep("ENROLLMENT");
        } else {
          setStep("TOTP");
        }
      } else {
        const msg = data.error?.message || "Incorrect password. Please try again.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch {
      setErrorMessage("Incorrect password. Please try again.");
      toast.error("Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentInfo = async () => {
    try {
      const res = await fetch("/api/auth/2fa/enroll");
      const data = await res.json();
      if (res.ok && data.success) {
        setEnrollmentData(data.data);
      } else {
        toast.error(data.error?.message || "Failed to load 2FA setup details.");
      }
    } catch {
      toast.error("Network error while loading 2FA setup.");
    }
  };

  // Handle Step 2: Verify TOTP Code
  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = totpCode.trim();
    if (clean.length !== 6 || !/^\d{6}$/.test(clean)) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const isEnrollment = step === "ENROLLMENT";
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean, isEnrollment }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (isEnrollment && data.data?.recoveryCodes) {
          // Show recovery codes to user once
          setGeneratedRecoveryCodes(data.data.recoveryCodes);
          setStep("RECOVERY_CODES_DISPLAY");
          toast.success("Two-Factor Authentication activated successfully!");
        } else {
          toast.success("Login successful");
          window.location.href = "/admin/dashboard";
        }
      } else {
        const msg = data.error?.message || "Invalid verification code. Please try again.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch {
      setErrorMessage("Failed to verify code. Please try again.");
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Recovery Code submission
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!recoveryCode.trim()) {
      toast.error("Please enter a recovery code");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: recoveryCode.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Logged in with recovery code. ${data.data.remainingCount} codes remaining.`);
        window.location.href = "/admin/dashboard";
      } else {
        const msg = data.error?.message || "Invalid or used recovery code.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch {
      setErrorMessage("Error validating recovery code.");
      toast.error("Error validating recovery code.");
    } finally {
      setLoading(false);
    }
  };

  const copyManualKey = () => {
    if (enrollmentData?.manualKey) {
      navigator.clipboard.writeText(enrollmentData.manualKey);
      setCopiedKey(true);
      toast.success("Secret key copied to clipboard");
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const copyAllRecoveryCodes = () => {
    if (generatedRecoveryCodes.length > 0) {
      const text = `CloutFlow Admin Recovery Codes:\n\n${generatedRecoveryCodes.join("\n")}\n\nKeep these codes in a safe place. Each code can only be used once.`;
      navigator.clipboard.writeText(text);
      setCopiedCodes(true);
      toast.success("Recovery codes copied to clipboard");
      setTimeout(() => setCopiedCodes(false), 2500);
    }
  };

  const finishEnrollmentAndEnter = () => {
    window.location.href = "/admin/dashboard";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1F5F5] p-4 font-sans antialiased">
      <Card className="w-full max-w-md border border-[#E0E6F1] bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Header */}
        <CardHeader className="space-y-1.5 text-center pb-4 pt-7 px-6 bg-gradient-to-b from-[#F7F4FF] to-white border-b border-[#F0F2F6]">
          <div className="mx-auto mb-2 bg-[#0F8F8A]/10 p-3 rounded-2xl w-fit border border-[#0F8F8A]/20">
            {step === "PASSWORD" ? (
              <Lock className="h-6 w-6 text-[#0F8F8A]" />
            ) : step === "ENROLLMENT" ? (
              <QrCode className="h-6 w-6 text-[#0F8F8A]" />
            ) : step === "RECOVERY" || step === "RECOVERY_CODES_DISPLAY" ? (
              <Key className="h-6 w-6 text-[#0F8F8A]" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-[#0F8F8A]" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#071D26] flex items-center justify-center gap-1.5">
            <span>Clout</span>
            <span className="text-[#0F8F8A]">Flow</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#0F8F8A]/15 text-[#0F8F8A] border border-[#0F8F8A]/25 ml-1">
              Admin
            </span>
          </CardTitle>
          <CardDescription className="text-sm text-[#66738F]">
            {step === "PASSWORD" && "Enter your password to access the dashboard"}
            {step === "ENROLLMENT" && "Secure your administrator account with Google Authenticator"}
            {step === "TOTP" && "Enter the 6-digit code from Google Authenticator"}
            {step === "RECOVERY" && "Enter a backup recovery code"}
            {step === "RECOVERY_CODES_DISPLAY" && "Save your backup recovery codes"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: PASSWORD */}
          {step === "PASSWORD" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold text-[#17213B] uppercase tracking-wider">
                  Admin Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="h-11 rounded-xl border-[#DCE4F0] focus-visible:ring-[#0F8F8A] text-sm"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-[#0F8F8A] hover:bg-[#0D7E7A] text-white font-bold rounded-xl shadow-sm transition-all"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Continue"}
                <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </form>
          )}

          {/* STEP 2A: FIRST-TIME ENROLLMENT SETUP */}
          {step === "ENROLLMENT" && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <p className="text-xs text-[#52637B]">
                  1. Scan this QR Code with your <strong>Google Authenticator</strong> app.
                </p>

                {enrollmentData?.qrCode ? (
                  <div className="flex justify-center p-3 bg-white border border-[#DCE4F0] rounded-2xl w-fit mx-auto shadow-inner">
                    <Image
                      src={enrollmentData.qrCode}
                      alt="TOTP QR Code"
                      width={200}
                      height={200}
                      unoptimized
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto flex items-center justify-center border border-dashed rounded-xl bg-gray-50">
                    <span className="text-xs text-gray-400">Loading QR code...</span>
                  </div>
                )}

                {enrollmentData?.manualKey && (
                  <div className="pt-2">
                    <p className="text-[11px] text-[#7A89A2] mb-1">Cannot scan? Enter code manually:</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <code className="text-xs font-mono font-bold text-[#071D26] bg-[#F4F7FB] px-2.5 py-1 rounded-lg border border-[#DDE5F7] tracking-wider select-all">
                        {enrollmentData.manualKey}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#0F8F8A] hover:bg-[#0F8F8A]/10"
                        onClick={copyManualKey}
                        title="Copy Key"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleTotpSubmit} className="space-y-4 pt-1 border-t border-[#EEF1F7]">
                <div className="space-y-1.5">
                  <Label htmlFor="enrollmentCode" className="text-xs font-bold text-[#17213B] uppercase tracking-wider block text-center">
                    2. Enter the 6-digit code shown in the app
                  </Label>
                  <Input
                    id="enrollmentCode"
                    ref={totpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    disabled={loading}
                    required
                    className="h-12 text-center text-2xl font-mono font-bold tracking-[0.35em] rounded-xl border-[#DCE4F0] focus-visible:ring-[#0F8F8A]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#0F8F8A] hover:bg-[#0D7E7A] text-white font-bold rounded-xl shadow-sm transition-all"
                  disabled={loading || totpCode.trim().length !== 6}
                >
                  {loading ? "Activating..." : "Activate & Continue"}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2B: STANDARD LOGIN TOTP */}
          {step === "TOTP" && (
            <div className="space-y-4">
              <form onSubmit={handleTotpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totpCode" className="text-xs font-bold text-[#17213B] uppercase tracking-wider block text-center">
                    Security Code
                  </Label>
                  <Input
                    id="totpCode"
                    ref={totpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    disabled={loading}
                    required
                    className="h-12 text-center text-2xl font-mono font-bold tracking-[0.35em] rounded-xl border-[#DCE4F0] focus-visible:ring-[#0F8F8A]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#0F8F8A] hover:bg-[#0D7E7A] text-white font-bold rounded-xl shadow-sm transition-all"
                  disabled={loading || totpCode.trim().length !== 6}
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </Button>
              </form>

              <div className="text-center pt-2 border-t border-[#EEF1F7]">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setStep("RECOVERY");
                  }}
                  className="text-xs font-medium text-[#0F8F8A] hover:underline"
                >
                  Use a recovery code
                </button>
              </div>
            </div>
          )}

          {/* STEP 2C: RECOVERY CODE LOGIN */}
          {step === "RECOVERY" && (
            <div className="space-y-4">
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recoveryCode" className="text-xs font-bold text-[#17213B] uppercase tracking-wider block text-center">
                    Enter Recovery Code
                  </Label>
                  <Input
                    id="recoveryCode"
                    ref={recoveryInputRef}
                    type="text"
                    autoComplete="off"
                    placeholder="ABCD-EFGH-IJKL"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    disabled={loading}
                    required
                    className="h-11 text-center font-mono font-bold tracking-wider rounded-xl border-[#DCE4F0] focus-visible:ring-[#0F8F8A]"
                  />
                  <p className="text-[11px] text-[#7A89A2] text-center">
                    Each backup code can only be used once.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#0F8F8A] hover:bg-[#0D7E7A] text-white font-bold rounded-xl shadow-sm transition-all"
                  disabled={loading || !recoveryCode.trim()}
                >
                  {loading ? "Verifying..." : "Verify Recovery Code"}
                </Button>
              </form>

              <div className="text-center pt-2 border-t border-[#EEF1F7]">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setStep("TOTP");
                  }}
                  className="text-xs font-medium text-[#0F8F8A] hover:underline"
                >
                  Back to Google Authenticator
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: RECOVERY CODES DISPLAY (SHOWN ONCE UPON SETUP) */}
          {step === "RECOVERY_CODES_DISPLAY" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <strong>Important:</strong> Save these backup codes in a secure password manager.
                If you lose access to Google Authenticator, these codes are the only way to recover your admin account.
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#F4F7FB] p-3.5 rounded-xl border border-[#DCE4F0]">
                {generatedRecoveryCodes.map((code, idx) => (
                  <div key={idx} className="font-mono text-xs font-bold text-[#071D26] text-center bg-white py-1.5 rounded-lg border border-[#E0E6F1]">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 border-[#DCE4F0] text-xs font-bold text-[#17213B]"
                  onClick={copyAllRecoveryCodes}
                >
                  {copiedCodes ? <Check className="w-3.5 h-3.5 mr-1 text-[#0F8F8A]" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedCodes ? "Copied" : "Copy Codes"}
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-10 bg-[#0F8F8A] hover:bg-[#0D7E7A] text-white text-xs font-bold rounded-xl"
                  onClick={finishEnrollmentAndEnter}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

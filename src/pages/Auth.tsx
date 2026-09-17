import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, ArrowRight, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="vm-orb grid size-10 place-items-center rounded-2xl text-white shadow-lg">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-slate-900">
              Paytm <span className="text-gradient">Vyapar-Mind</span>
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              AI Business Operator
            </p>
          </div>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="glass-strong w-full max-w-md rounded-3xl p-7 sm:p-8">
          {step === "signIn" ? (
            <>
              <div className="text-center">
                <div className="vm-orb mx-auto grid size-14 place-items-center rounded-2xl text-white shadow-lg">
                  <Sparkles className="size-7" />
                </div>
                <h1 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900">
                  Merchant sign-in
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Enter your email to log in or sign up
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="mt-6">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      className="glass-inset border-white/70 bg-white/80 pl-9"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-full border-white/70 bg-white/70"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                  </Button>
                </div>
                {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
              </form>

              <div className="mt-6">
                <div className="relative flex items-center">
                  <span className="w-full border-t border-white/70" />
                  <span className="absolute w-full text-center">
                    <span className="bg-transparent px-2 text-xs uppercase tracking-wider text-muted-foreground">
                      or
                    </span>
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full rounded-full border-white/70 bg-white/60 font-semibold"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                >
                  <UserX className="mr-2 size-4" />
                  Continue as Guest
                </Button>
              </div>

              <p className="mt-6 text-center text-[11px] leading-4 text-muted-foreground">
                Demo merchant is seeded automatically on first launch.
              </p>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="vm-orb mx-auto grid size-14 place-items-center rounded-2xl text-white shadow-lg">
                  <Mail className="size-7" />
                </div>
                <h1 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900">
                  Check your email
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  We've sent a code to {step.email}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="mt-6">
                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                        const form = (e.target as HTMLElement).closest("form");
                        if (form) form.requestSubmit();
                      }
                    }}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && (
                  <p className="mt-3 text-center text-sm text-rose-500">{error}</p>
                )}
                <Button
                  type="submit"
                  className="vm-orb mt-6 w-full rounded-full border-0 font-bold text-white"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      Verify code <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("signIn")}
                  disabled={isLoading}
                  className="mt-2 w-full rounded-full"
                >
                  Use different email
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="pb-6 text-center text-[11px] text-muted-foreground">
        Paytm Vyapar-Mind · hackathon prototype ·{" "}
        <Link to="/" className="underline hover:text-indigo-500">
          back to home
        </Link>
      </p>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense fallback={null}>
      <Auth {...props} />
    </Suspense>
  );
}

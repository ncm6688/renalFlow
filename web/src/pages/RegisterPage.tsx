import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Input, Label, SubtleLink } from "../components/ui";
import { useAuth } from "../store/auth";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const register = useAuth((s) => s.register);
  const loading = useAuth((s) => s.loading);
  const error = useAuth((s) => s.error);
  const nav = useNavigate();

  const canSubmit = useMemo(() => name.trim() && email.trim() && password.trim().length >= 6, [name, email, password]);

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <svg width="34" height="34" viewBox="0 0 44 44" aria-hidden="true" className="shrink-0">
                <defs>
                  <linearGradient id="sage2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8CB399" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#7FAF92" stopOpacity="0.18" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="40" height="40" rx="14" fill="url(#sage2)" stroke="#E2E8F0" />
                <path d="M15 23c5-9 17-9 13 2-2 6-9 10-13 8" fill="none" stroke="#5E8F76" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <div>
                <div className="text-sm font-semibold text-[#5E8F76]">RenalFlow</div>
                <div className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">Create your account</div>
              </div>
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Keep it simple — you can start tracking metrics in under a minute.
            </div>
          </div>

          <Card>
            <CardBody>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!canSubmit) return;
                  await register(name, email, password);
                  nav("/dashboard");
                }}
              >
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" disabled={!canSubmit || loading} className="w-full">
                  {loading ? "Creating..." : "Create account"}
                </Button>

                <div className="text-center text-sm text-slate-600">
                  Already have an account? <SubtleLink to="/login">Sign in</SubtleLink>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}


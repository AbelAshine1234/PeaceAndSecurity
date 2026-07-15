"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <AuthLayout showBranding={false}>
      <div className="flex flex-col items-center text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your email to receive a reset link
        </p>
      </div>

      {submitted ? (
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Check your email</h3>
            <p className="text-muted-foreground text-sm">
              We have sent a password reset link to <br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-foreground"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              disabled={loading}
              className={`h-12 bg-muted/30 border-input/50 ${errors.email ? "border-red-500 bg-red-50" : ""}`}
              required
            />
            {errors.email && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary text-white transition-all rounded shadow-none border-none"
            disabled={loading}
          >
            {loading ? "Sending Link..." : "Send Reset Link"}
          </Button>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { LogIn, UserPlus, Key, Mail, Phone, BookOpen, Upload, ShieldAlert, CheckCircle } from "lucide-react";
import { UserRole } from "../types";

interface AuthPageProps {
  onAuthSuccess: (user: any) => void;
  defaultRole?: "student" | "teacher";
}

export default function AuthPage({ onAuthSuccess, defaultRole = "student" }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(defaultRole === "teacher" ? UserRole.TEACHER : UserRole.STUDENT);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [expertise, setExpertise] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fastTrackMessage, setFastTrackMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  
  // Forgot password flow state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please fill in your email address.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      onAuthSuccess(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        phone,
        role,
        expertise: role === UserRole.TEACHER ? expertise : undefined,
        cvUrl: role === UserRole.TEACHER ? (cvUrl || "https://example.com/uploaded_cv.pdf") : undefined,
        password,
        fastTrackMessage: fastTrackMessage || undefined
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      // Automatically login
      onAuthSuccess(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError("Please specify your email address.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request recovery code.");
      }

      setRecoverySent(true);
    } catch (err: any) {
      setError(err.message || "Failed to process recovery request.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !tokenInput || !newPasswordInput) {
      setError("Please fill in all recovery fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          token: tokenInput,
          newPassword: newPasswordInput
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setResetSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to process password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-page" className="max-w-md w-full mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-8 space-y-6 animate-fade-in my-8">
      {/* Tab Switcher */}
      {!showForgotPassword && (
        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <button
            id="tab-login"
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${isLogin ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
          >
            Sign In
          </button>
          <button
            id="tab-register"
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${!isLogin ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
          >
            Create Account
          </button>
        </div>
      )}

      {/* Forgot Password Modal view */}
      {showForgotPassword ? (
        <div className="space-y-5">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-2xl text-slate-800">Recover Password</h3>
            <p className="text-slate-500 text-sm">We'll dispatch a secure recovery token to your integrated mailbox.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-3.5 rounded-lg border border-red-200 text-xs font-medium flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resetSuccess ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 flex items-start space-x-3 text-sm animate-fade-in">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Password Reset Successful!</span>
                  <p className="text-emerald-700 mt-1">Your new secure password has been registered. You can now return to the login screen and authenticate.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setRecoverySent(false);
                  setResetSuccess(false);
                  setTokenInput("");
                  setNewPasswordInput("");
                  setError("");
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-sm"
              >
                Return to Login
              </button>
            </div>
          ) : recoverySent ? (
            <form id="reset-form" onSubmit={handleResetPassword} className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 text-xs">
                📧 Secure Token sent to <span className="font-bold">{forgotEmail}</span>. Access your Secure Webmail once logged in to retrieve it, or use standard test users.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Enter Verification Token</label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="e.g. TOK-123456"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 font-mono text-center"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">New Secure Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                    required
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-sm"
              >
                {loading ? "Resetting Password..." : "Submit New Password"}
              </button>
            </form>
          ) : (
            <form id="forgot-form" onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@edu.com or teacher@edu.com"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-sm"
              >
                {loading ? "Sending..." : "Send Verification Email"}
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setRecoverySent(false);
                setResetSuccess(false);
                setTokenInput("");
                setNewPasswordInput("");
                setError("");
              }}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      ) : isLogin ? (
        /* LOGIN FORM */
        <form id="login-form" onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-2xl text-slate-800">Welcome Back</h3>
            <p className="text-slate-500 text-sm">Please log in to manage your learning workspace.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-3.5 rounded-lg border border-red-200 text-xs font-medium flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Fills */}
          <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 text-xs text-blue-800 space-y-1">
            <div className="font-bold">Quick Access Test Profiles:</div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button type="button" onClick={() => setEmail("student@edu.com")} className="text-left bg-white px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer truncate">
                Student: student@edu.com
              </button>
              <button type="button" onClick={() => setEmail("sarah.jenkins@edu.com")} className="text-left bg-white px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer truncate">
                Teacher: sarah.jenkins@edu.com
              </button>
              <button type="button" onClick={() => setEmail("admin@edu.com")} className="text-left bg-white px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer truncate col-span-2 text-center">
                Admin: admin@edu.com
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@edu.com"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="block text-xs font-semibold text-slate-500">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me-chk"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500"
              />
              <label htmlFor="remember-me-chk" className="ml-2 text-xs font-semibold text-slate-500">
                Remember my active session
              </label>
            </div>
          </div>

          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? "Authenticating..." : "Sign In Workspace"}</span>
          </button>
        </form>
      ) : (
        /* REGISTRATION FORM */
        <form id="register-form" onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-2xl text-slate-800">Create Account</h3>
            <p className="text-slate-500 text-sm">Select your learning or advisory tier.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Role selection toggle */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              type="button"
              onClick={() => setRole(UserRole.STUDENT)}
              className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${role === UserRole.STUDENT ? "border-blue-500 bg-blue-50/50 text-blue-700" : "border-slate-200 text-slate-500"}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.TEACHER)}
              className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${role === UserRole.TEACHER ? "border-blue-500 bg-blue-50/50 text-blue-700" : "border-slate-200 text-slate-500"}`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Instructor</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@edu.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {role === UserRole.TEACHER && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Expertise / Specialty</label>
                  <input
                    type="text"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    placeholder="e.g. Machine Learning, Cybersecurity"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">CV File Link (PDF/DOC)</label>
                  <input
                    type="text"
                    value={cvUrl}
                    onChange={(e) => setCvUrl(e.target.value)}
                    placeholder="https://example.com/cv.pdf"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Upload simulator: Paste a link or leave default.</span>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Interactive Message to Admin (Optional)</label>
              <textarea
                value={fastTrackMessage}
                onChange={(e) => setFastTrackMessage(e.target.value)}
                placeholder="Briefly request instant clearance or verify credentials..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 resize-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Visible to administrators reviewing your request queue.</span>
            </div>
          </div>

          <button
            id="register-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 mt-4 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? "Registering..." : "Create Workspace"}</span>
          </button>
        </form>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signInAdmin } from '@/lib/auth';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const { user, error: authError } = await signInAdmin(email.trim(), password);

      if (authError || !user) {
        setError(authError || 'Failed to authenticate as admin. Please verify your credentials.');
        setLoading(false);
        return;
      }

      // Successful admin login
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4 sm:p-6 text-neutral-900">
      <div className="w-full max-w-[420px] rounded-2xl border border-neutral-200 bg-white p-8 sm:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-neutral-50 p-1 border border-neutral-100 shadow-sm flex items-center justify-center">
            <Image
              src="/khf_logo_f.png"
              alt="Kunddan Home Foods Logo"
              width={76}
              height={76}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Welcome to Kunddan Home Foods
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Sign in to access your management dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            id="login-error-alert"
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 text-xs leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#54382c] focus:outline-none focus:ring-1 focus:ring-[#54382c] transition-colors disabled:bg-neutral-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#54382c] focus:outline-none focus:ring-1 focus:ring-[#54382c] transition-colors disabled:bg-neutral-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-button"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center rounded-lg bg-[#54382c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#432b22] focus:outline-none focus:ring-2 focus:ring-[#54382c] focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

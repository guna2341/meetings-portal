'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Login failed. Please try again.');
        return;
      }

      localStorage.setItem("data", JSON.stringify(data?.data));

      // Redirect to organization selection on success
      router.push('/select-org');
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
              >
                <path
                  d="M8 6C8 3.79086 9.79086 2 12 2C14.2091 2 16 3.79086 16 6V8H8V6Z"
                  fill="white"
                />
                <path
                  d="M4 10C4 8.89543 4.89543 8 6 8H18C19.1046 8 20 8.89543 20 10V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V10Z"
                  fill="white"
                />
                <circle cx="12" cy="15" r="2" fill="#2563eb" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Sign In</h1>
            <p className="text-sm text-gray-500">Welcome to Meetings Portal</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="you@company.com"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Enter your password"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between -mt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-blue-600"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700 select-none">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-sm text-blue-600 hover:underline bg-transparent border-none cursor-pointer disabled:opacity-60"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium text-sm rounded-md px-4 py-2.5 transition-colors mt-5 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div className="text-center mt-6 text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="text-blue-600 hover:underline font-medium bg-transparent border-none cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
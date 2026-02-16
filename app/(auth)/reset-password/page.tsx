'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    console.log('Password reset for token:', token);
    
    // Add your password reset logic here
    // This would typically validate the token and update the password
    setIsSubmitted(true);
  };

  // Check if token is missing
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10">
            <div className="text-center mb-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-600 rounded-lg flex items-center justify-center">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                >
                  <path 
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" 
                    fill="white"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Invalid Reset Link
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                This password reset link is invalid or has expired.
              </p>
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-blue-600 hover:underline font-medium bg-transparent border-none cursor-pointer"
              >
                Request a new reset link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" 
                  fill="white"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500">
              {isSubmitted 
                ? "Your password has been reset"
                : "Enter your new password"
              }
            </p>
          </div>

          {!isSubmitted ? (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label 
                    htmlFor="confirmPassword" 
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-800">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-md px-4 py-2.5 transition-colors"
                >
                  Reset Password
                </button>
              </form>

              {/* Back to login */}
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-sm text-blue-600 hover:underline font-medium bg-transparent border-none cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success message */}
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <p className="text-sm text-green-800">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-md px-4 py-2.5 transition-colors"
              >
                Go to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
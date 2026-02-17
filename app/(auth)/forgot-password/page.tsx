'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    console.log('Password reset requested for:', email);
    
    // Add your password reset logic here
    // This would typically send a reset email to the user
    setIsSubmitted(true);
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
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" 
                  fill="white"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Forgot Password?
            </h1>
            <p className="text-sm text-gray-500">
              {isSubmitted 
                ? "Check your email for reset instructions"
                : "Enter your email to reset your password"
              }
            </p>
          </div>

          {!isSubmitted ? (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                    placeholder="you@company.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-md px-4 py-2.5 transition-colors"
                >
                  Send Reset Link
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
                  We&apos;ve sent a password reset link to <strong>{email}</strong>. 
                  Please check your inbox and follow the instructions.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-md px-4 py-2.5 transition-colors"
                >
                  Back to Sign In
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium text-sm rounded-md px-4 py-2.5 border border-gray-300 transition-colors"
                >
                  Resend Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
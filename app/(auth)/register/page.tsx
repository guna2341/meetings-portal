'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Validate terms acceptance
    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    console.log('Registration attempt:', {
      fullName: formData.fullName,
      email: formData.email,
    });

    // Add your registration logic here
    alert('Registration functionality would be connected to your backend authentication system');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5 py-12">
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
                  d="M15 12C17.21 12 19 10.21 19 8C19 5.79 17.21 4 15 4C12.79 4 11 5.79 11 8C11 10.21 12.79 12 15 12ZM6 10V7H4V10H1V12H4V15H6V12H9V10H6ZM15 14C12.33 14 7 15.34 7 18V20H23V18C23 15.34 17.67 14 15 14Z" 
                  fill="white"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Create Account
            </h1>
            <p className="text-sm text-gray-500">
              Join Meetings Portal today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label 
                htmlFor="fullName" 
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                placeholder="John Doe"
                required
              />
            </div>

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
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                placeholder="Create a password"
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
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                placeholder="Confirm your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 cursor-pointer accent-blue-600 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 select-none">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => window.open('/terms', '_blank')}
                    className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Terms and Conditions
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => window.open('/privacy', '_blank')}
                    className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-md px-4 py-2.5 transition-colors"
            >
              Create Account
            </button>
          </form>

          {/* Sign in link */}
          <div className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline font-medium bg-transparent border-none cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
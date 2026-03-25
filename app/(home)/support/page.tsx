"use client";

import { useState } from "react";
import { HelpCircle, Mail, Send, MessageSquare } from "lucide-react";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    // Construct the mailto link
    const mailtoLink = `mailto:gunanihilofficial@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message)}`;

    // Open the default email client
    window.location.href = mailtoLink;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-50">
          <HelpCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Need assistance or have feedback? Reach out to our support team directly. We're here to help you get the most out of MeetHub.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 p-8 md:p-10 max-w-2xl mx-auto relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl opacity-60"></div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
              What do you need help with?
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Briefly describe your issue (e.g., Trouble resetting password)"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium text-gray-800 placeholder:font-normal placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
              Detailed Description
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide as much detail as possible so we can best assist you. (Steps to reproduce, error messages, etc.)"
              rows={6}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium text-gray-800 placeholder:font-normal placeholder:text-gray-400 resize-none"
              required
            />
          </div>

          <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl flex items-start gap-3 border border-blue-100">
            <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Clicking <strong>Send Query</strong> will open your default email application (like Outlook, Mail, or Gmail) with your message addressed securely to our support team at <span className="font-semibold underline">gunanihilofficial@gmail.com</span>.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!subject || !message}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
              Prepare Email to Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

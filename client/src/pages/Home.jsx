import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Shield, Zap, Building2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Building2 size={24} />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">DealOS</span>
        </div>
        <Link 
          to="/login" 
          className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-8 border border-blue-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          PROBE Agent 2.0 Now Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight max-w-4xl mb-6 leading-tight">
          The Intelligent Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Debt Capital</span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed">
          Automate your deal prep, instantly generate institutional-grade One-Pagers, and match with the right lenders using AI.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/login" 
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
          >
            Start Your Raise <ArrowRight size={20} />
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mt-24 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <Bot className="text-blue-500 mb-4" size={32} />
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI-Powered Onboarding</h3>
            <p className="text-gray-500 text-sm">Chat with PROBE to instantly extract financials and build your deal profile from raw documents.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <Zap className="text-amber-500 mb-4" size={32} />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Live One-Pagers</h3>
            <p className="text-gray-500 text-sm">Generate dynamic, interactive Teasers that update in real-time as your data room fills up.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <Shield className="text-emerald-500 mb-4" size={32} />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Secure Data Room</h3>
            <p className="text-gray-500 text-sm">Enterprise-grade storage for your financials, cap tables, and compliance documents.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
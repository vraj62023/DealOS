import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { User, Building, Shield, Bell, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');

  const handleSave = (e) => {
    e.preventDefault();
    // This will eventually dispatch to your backend to update the user
    toast.success('Settings updated successfully!');
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, team, and security preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User size={18} /> My Profile
          </button>
          <button 
            onClick={() => setActiveTab('company')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'company' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Building size={18} /> Company Details
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Shield size={18} /> Security
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={user?.name || ''} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={user?.email || ''} 
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Contact support to change your email.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role / Designation</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chief Financial Officer"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === 'company' && (
            <div className="space-y-6 max-w-2xl">
               <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Corporate Identity</h2>
               <p className="text-sm text-gray-500">
                 Company details are primarily managed by the PROBE Agent during onboarding. 
                 If you need to make manual corrections to your corporate profile, please navigate to the Chat and instruct the agent.
               </p>
            </div>
          )}

          {(activeTab === 'security' || activeTab === 'notifications') && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Shield size={48} className="mb-4 text-gray-200" />
              <p className="text-gray-500 font-medium">This module is under construction</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
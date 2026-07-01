import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, updateUser } from '../app/features/authSlice';
import api from '../configs/api';
import { 
  User, 
  Building, 
  Shield, 
  Bell, 
  Save, 
  LogOut, 
  Copy, 
  Check, 
  RefreshCw, 
  KeyRound,
  Edit2,
  X,
  Lock,
  Globe,
  Settings as SettingsIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [copied, setCopied] = useState(false);
  
  // Tab states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    role: user?.role || 'Financial Admin'
  });
  
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Company states
  const [companyData, setCompanyData] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [editCompanyMode, setEditCompanyMode] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    industry: '',
    website: '',
    incorporationYear: '',
    registeredOffice: '',
    branchOffice: '',
    pan: '',
    cin: ''
  });
  const [savingCompany, setSavingCompany] = useState(false);

  // Webhooks & Security states
  const [webhookUrl, setWebhookUrl] = useState(user?.webhookUrl || 'http://localhost:5000/api/webhooks/upload');
  const [webhookSecret, setWebhookSecret] = useState(user?.webhookSecret || 'dealos_secure_webhook_secret_key_12345');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [rotatingSecret, setRotatingSecret] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailAuditReports: user?.notificationPreferences?.emailAuditReports ?? true,
    dynamicMatchingAlerts: user?.notificationPreferences?.dynamicMatchingAlerts ?? true,
    webhookStatusSubscriptions: user?.notificationPreferences?.webhookStatusSubscriptions ?? false,
    digestFrequency: user?.notificationPreferences?.digestFrequency ?? 'instantly'
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    if (activeTab === 'company') {
      fetchCompanyData();
    }
  }, [activeTab]);

  const fetchCompanyData = async () => {
    try {
      setLoadingCompany(true);
      const { data } = await api.get('/company/profile');
      setCompanyData(data);
      setCompanyForm({
        companyName: data.companyName || '',
        industry: data.industry || '',
        website: data.website || '',
        incorporationYear: data.incorporationYear || '',
        registeredOffice: data.registeredOffice || '',
        branchOffice: data.branchOffice || '',
        pan: data.pan || '',
        cin: data.cin || ''
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load company profile');
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      return toast.error('Name cannot be empty');
    }
    
    try {
      const { data } = await api.put('/auth/profile', {
        name: profileForm.name,
        role: profileForm.role
      });
      dispatch(updateUser(data));
      toast.success('Profile settings updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile settings');
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return toast.error('Please fill in all password fields');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }

    try {
      setSavingPassword(true);
      await api.put('/auth/profile', {
        password: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Invalid current password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCompanySave = async (e) => {
    e.preventDefault();
    try {
      setSavingCompany(true);
      const { data } = await api.put('/company/update', companyForm);
      setCompanyData(data.company || data);
      setEditCompanyMode(false);
      toast.success('Company profile updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update company profile');
    } finally {
      setSavingCompany(false);
    }
  };

  const handleWebhookSave = async (e) => {
    e.preventDefault();
    try {
      setSavingWebhook(true);
      const { data } = await api.put('/auth/profile', { webhookUrl });
      dispatch(updateUser(data));
      toast.success('Webhook endpoint configuration saved!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save webhook settings');
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleRotateSecret = async () => {
    if (!window.confirm('Are you sure you want to rotate the HMAC signature secret key? Any existing Lambda or S3 events signed with the old secret will fail validation.')) {
      return;
    }
    
    try {
      setRotatingSecret(true);
      const { data } = await api.post('/auth/rotate-webhook-secret');
      setWebhookSecret(data.webhookSecret);
      dispatch(updateUser({ webhookSecret: data.webhookSecret }));
      toast.success('HMAC Key rotated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to rotate webhook secret');
    } finally {
      setRotatingSecret(false);
    }
  };

  const handleNotificationsSave = async (e) => {
    e.preventDefault();
    try {
      setSavingNotifications(true);
      const { data } = await api.put('/auth/profile', {
        notificationPreferences: notifications
      });
      dispatch(updateUser(data));
      toast.success('Notification preferences saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save notification preferences');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.success('You have logged out securely.');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('HMAC Secret copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for rendering initials avatar
  const getInitials = (name) => {
    if (!name) return 'OS';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="text-blue-600" size={24} /> Platform Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, team, and security preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 space-y-1 shrink-0">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer border-l-4 ${
              activeTab === 'profile' 
                ? 'bg-blue-50 text-blue-700 border-blue-600' 
                : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <User size={18} /> My Profile
          </button>
          <button 
            onClick={() => setActiveTab('company')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer border-l-4 ${
              activeTab === 'company' 
                ? 'bg-blue-50 text-blue-700 border-blue-600' 
                : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Building size={18} /> Company Details
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer border-l-4 ${
              activeTab === 'security' 
                ? 'bg-blue-50 text-blue-700 border-blue-600' 
                : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Shield size={18} /> Security & Session
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer border-l-4 ${
              activeTab === 'notifications' 
                ? 'bg-blue-50 text-blue-700 border-blue-600' 
                : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-8 max-w-2xl">
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="flex items-center gap-6 border-b border-gray-100 pb-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow shadow-blue-500/30 shrink-0">
                    {getInitials(profileForm.name)}
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-gray-900">{profileForm.name || 'Your Profile'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{profileForm.role} • {user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={profileForm.name} 
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-medium text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={user?.email || ''} 
                      disabled
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed font-medium"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Contact dynamic platform administrator to change email.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Role / Designation</label>
                  <select 
                    value={profileForm.role}
                    onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                    className="w-full border border-gray-300 bg-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-medium text-gray-800 cursor-pointer"
                  >
                    <option value="Financial Admin">Financial Admin</option>
                    <option value="Chief Financial Officer">Chief Financial Officer (CFO)</option>
                    <option value="Accounts Manager">Accounts Manager</option>
                    <option value="Audit Lead">Audit Lead</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                    <Save size={18} /> Save Profile Settings
                  </button>
                </div>
              </form>


            </div>
          )}
          
          {/* COMPANY TAB */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Corporate Identity Details</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Ensure your corporate data matches registered MCA filings.</p>
                </div>
                <div className="flex items-center gap-3">
                  {!editCompanyMode ? (
                    <button 
                      onClick={() => setEditCompanyMode(true)}
                      className="text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100/50 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 size={13} /> Edit Company details
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setEditCompanyMode(false);
                        if (companyData) {
                          setCompanyForm({
                            companyName: companyData.companyName || '',
                            industry: companyData.industry || '',
                            website: companyData.website || '',
                            incorporationYear: companyData.incorporationYear || '',
                            registeredOffice: companyData.registeredOffice || '',
                            branchOffice: companyData.branchOffice || '',
                            pan: companyData.pan || '',
                            cin: companyData.cin || ''
                          });
                        }
                      }}
                      className="text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <X size={13} /> Cancel
                    </button>
                  )}
                  <button 
                    onClick={fetchCompanyData}
                    disabled={loadingCompany}
                    className="text-xs font-bold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 p-1.5 rounded-lg flex items-center justify-center disabled:opacity-50 cursor-pointer"
                    title="Reload profile"
                  >
                    <RefreshCw size={14} className={loadingCompany ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {loadingCompany ? (
                <div className="py-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={24} className="animate-spin text-blue-500" />
                  <span>Loading company profile details...</span>
                </div>
              ) : companyData ? (
                <form onSubmit={handleCompanySave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Registered Entity Name</h4>
                      {editCompanyMode ? (
                        <input 
                          type="text" 
                          value={companyForm.companyName}
                          onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 mt-1 outline-none font-semibold text-gray-800"
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-900 mt-1">{companyData.companyName}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Industry Sector</h4>
                      {editCompanyMode ? (
                        <input 
                          type="text" 
                          value={companyForm.industry}
                          onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 mt-1 outline-none font-semibold text-gray-800"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-800 mt-1">{companyData.industry || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Corporate Identity Number (CIN)</h4>
                      {editCompanyMode ? (
                        <input 
                          type="text" 
                          value={companyForm.cin}
                          onChange={(e) => setCompanyForm({ ...companyForm, cin: e.target.value })}
                          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 mt-1 outline-none font-mono font-semibold text-gray-800"
                        />
                      ) : (
                        <p className="text-sm font-mono font-bold text-gray-800 mt-1">{companyData.cin || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">PAN Card Number</h4>
                      {editCompanyMode ? (
                        <input 
                          type="text" 
                          value={companyForm.pan}
                          onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value })}
                          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 mt-1 outline-none font-mono font-semibold text-gray-800"
                        />
                      ) : (
                        <p className="text-sm font-mono font-bold text-gray-800 mt-1">{companyData.pan || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Incorporation Year</h4>
                      {editCompanyMode ? (
                        <input 
                          type="text" 
                          value={companyForm.incorporationYear}
                          onChange={(e) => setCompanyForm({ ...companyForm, incorporationYear: e.target.value })}
                          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 mt-1 outline-none font-semibold text-gray-800"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-800 mt-1">{companyData.incorporationYear || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Corporate Website</h4>
                      {editCompanyMode ? (
                        <div className="flex items-center gap-1.5 mt-1 border border-gray-300 rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600">
                          <Globe size={13} className="text-gray-400" />
                          <input 
                            type="text" 
                            value={companyForm.website}
                            onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                            className="w-full py-1.5 text-xs outline-none bg-transparent font-semibold text-gray-800"
                            placeholder="e.g. www.vipin.com"
                          />
                        </div>
                      ) : (
                        <a href={companyData.website ? `http://${companyData.website}` : '#'} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline mt-1 block">
                          {companyData.website || 'Not set'}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 mb-2">Registered Office Address</h4>
                      {editCompanyMode ? (
                        <textarea 
                          rows={3}
                          value={companyForm.registeredOffice}
                          onChange={(e) => setCompanyForm({ ...companyForm, registeredOffice: e.target.value })}
                          className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-medium text-gray-700 leading-relaxed"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-3 leading-relaxed">
                          {companyData.registeredOffice || 'Address detail is empty.'}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-700 mb-2">Branch Office Address</h4>
                      {editCompanyMode ? (
                        <textarea 
                          rows={3}
                          value={companyForm.branchOffice}
                          onChange={(e) => setCompanyForm({ ...companyForm, branchOffice: e.target.value })}
                          className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-medium text-gray-700 leading-relaxed"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-3 leading-relaxed">
                          {companyData.branchOffice || 'No secondary branch office registered.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {editCompanyMode && (
                    <div className="pt-2 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={savingCompany}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {savingCompany ? <RefreshCw size={16} className="animate-spin" /> : <Save size={18} />} Save Corporate Identity Details
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="py-16 text-center text-gray-400 text-sm">
                  No company profile available. Please complete onboarding.
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB (Includes Logout & Password credentials) */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              {/* Account Security Credentials (Change Password) */}
              <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-6">
                <div>
                  <h3 className="text-md font-bold text-gray-900 flex items-center gap-1.5">
                    <Lock size={16} className="text-gray-500" /> Account Security Credentials
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Change your platform access password at any time to keep your account secure.</p>
                </div>
                
                <form onSubmit={handlePasswordSave} className="mt-5 space-y-4 border-t border-gray-200/60 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Current Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">New Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit" 
                      disabled={savingPassword}
                      className="bg-gray-950 hover:bg-gray-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {savingPassword && <RefreshCw size={12} className="animate-spin" />} Update Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Secure Session Card (Logout) */}
              <div>
                <h2 className="text-lg font-bold text-gray-950 border-b border-gray-100 pb-4 mb-6">Session Management</h2>
                <div className="bg-red-50/20 border border-red-100 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-red-950 flex items-center gap-2">
                      <KeyRound size={16} className="text-red-700" /> Authorized Access Session
                    </h3>
                    <p className="text-xs text-red-900/60 mt-1 leading-normal max-w-md">
                      You are authenticated as <strong>{user?.email}</strong>. Logging out clears local credentials, invalidates your JWT access token, and terminates your secure session.
                    </p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm shadow-red-500/10 cursor-pointer shrink-0"
                  >
                    <LogOut size={18} /> Secure Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationsSave} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-950 border-b border-gray-100 pb-4 mb-6">Alert Notifications Preferences</h2>
                <p className="text-xs text-gray-500 -mt-4 mb-6">Receive real-time notifications about matched lenders and document evaluations.</p>
              </div>
              
              <div className="space-y-5 bg-gray-50/40 border border-gray-200 rounded-xl p-6">
                
                {/* Switch 1 */}
                <div className="flex items-start justify-between py-3 border-b border-gray-100">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-gray-900">Email Audit Reports</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-normal">Receive a complete copy of AI Underwriter appraisal reports immediately upon document upload.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, emailAuditReports: !notifications.emailAuditReports })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      notifications.emailAuditReports ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.emailAuditReports ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 2 */}
                <div className="flex items-start justify-between py-3 border-b border-gray-100">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-gray-900">Dynamic Matching Alerts</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-normal">Get notified in real-time when a new lender mandate matches your company profile and debt requirements.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, dynamicMatchingAlerts: !notifications.dynamicMatchingAlerts })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      notifications.dynamicMatchingAlerts ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.dynamicMatchingAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 3 */}
                <div className="flex items-start justify-between py-3 border-b border-gray-100">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-gray-900">Webhook Status Subscriptions</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-normal">Post real-time JSON payloads to your configured webhook endpoint when deals transition through different kanban pipeline stages.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, webhookStatusSubscriptions: !notifications.webhookStatusSubscriptions })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      notifications.webhookStatusSubscriptions ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.webhookStatusSubscriptions ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Frequency Settings Radio Options */}
                <div className="pt-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Digest Delivery Frequency</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['instantly', 'daily', 'weekly'].map((freq) => (
                      <label 
                        key={freq}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                          notifications.digestFrequency === freq 
                            ? 'bg-blue-50/50 border-blue-600 text-blue-900' 
                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="digestFrequency" 
                          value={freq}
                          checked={notifications.digestFrequency === freq}
                          onChange={(e) => setNotifications({ ...notifications, digestFrequency: e.target.value })}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold capitalize">{freq}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit" 
                  disabled={savingNotifications}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {savingNotifications ? <RefreshCw size={16} className="animate-spin" /> : <Save size={18} />} Save Notification Preferences
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCompany } from '../app/features/companySlice';
import api from '../configs/api';
import ChatBox from '../components/chat/ChatBox';
import OnePagerView from '../components/company/OnePagerView';

export default function Dashboard() {
  const dispatch = useDispatch();

  // Fetch company data on load so it survives page refreshes!
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        // We hit the profile endpoint you built earlier
        const { data } = await api.get('/company/profile');
        if (data) {
          dispatch(setCompany(data));
        }
      } catch (error) {
        console.error("Failed to fetch company profile on load", error);
      }
    };

    fetchCompanyProfile();
  }, [dispatch]);

  return (
    <div className="flex h-full gap-6 max-h-[calc(100vh-4rem)]">
      <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-white">PROBE Agent</h2>
          <p className="text-sm text-gray-400">Intelligent Onboarding Assistant</p>
        </div>
        <ChatBox />
      </div>

      <div className="hidden lg:block w-1/2">
        <OnePagerView />
      </div>
    </div>
  );
}
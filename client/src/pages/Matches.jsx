import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../configs/api';
import { 
  ChevronRight, 
  ChevronDown, 
  Info, 
  Square, 
  CheckSquare, 
  Loader2, 
  TrendingUp,
  AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Matches() {
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/matches');
      setMatchData(data);
      
      // Auto-expand first product if available
      if (data && data.status === 'success' && data.matches.length > 0) {
        setExpandedProducts(new Set([data.matches[0].product]));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load lender matches');
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productName) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productName)) {
      newExpanded.delete(productName);
    } else {
      newExpanded.add(productName);
    }
    setExpandedProducts(newExpanded);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-gray-400">
        <Loader2 className="animate-spin text-purple-600 mr-2" size={24} />
        Analyzing requested capital amount and matching with lenders...
      </div>
    );
  }

  // 1. BLOCKED STATE (Insufficient profile data)
  if (matchData && matchData.status === 'blocked') {
    return (
      <div className="max-w-[700px] mx-auto my-12 bg-white rounded-2xl border border-amber-200 p-8 shadow-sm text-center">
        <AlertTriangle className="mx-auto mb-4 text-amber-500 animate-bounce" size={48} />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Matching Engine Suspended</h2>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          We require sufficient profile information before running the matching engine to ensure accurate rates and terms.
        </p>
        
        <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100 text-left mb-6 max-w-md mx-auto">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2.5">Sufficient Info Required:</h3>
          <ul className="list-disc pl-5 text-xs text-amber-900 space-y-2 font-medium">
            {matchData.essentialMissing.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all cursor-pointer shadow-md shadow-purple-500/20"
          >
            Chat with PROBE Agent
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all cursor-pointer"
          >
            Direct Edit One-Pager
          </button>
        </div>
      </div>
    );
  }

  const debtOptions = matchData?.matches || [];

  return (
    <div className="max-w-[1400px] mx-auto h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-600" />
            Lender Matches
          </h1>
          <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full border border-purple-100">
            Dynamic Matching Active
          </span>
        </div>
        <button 
          onClick={fetchMatches}
          disabled={loading}
          className="text-xs font-bold text-purple-600 hover:text-purple-800 disabled:opacity-50 cursor-pointer"
        >
          Refresh Matches
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div className="col-span-3 pl-8">Recommended Products</div>
        <div className="col-span-2">Probability <Info size={12} className="inline text-gray-400 ml-1" /></div>
        <div className="col-span-1">Amount</div>
        <div className="col-span-1">Tenure</div>
        <div className="col-span-1">ROI</div>
        <div className="col-span-3">Security</div>
        <div className="col-span-1 text-right">Status</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        {debtOptions.length > 0 ? (
          debtOptions.map((group) => {
            const isExpanded = expandedProducts.has(group.product);
            
            return (
              <div key={group.product} className="border-b border-gray-100">
                {/* Parent Row (The Product) */}
                <div 
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleProduct(group.product)}
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <button className="text-gray-400 hover:text-gray-700">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <Square size={16} className="text-purple-300 fill-purple-50" />
                    <span className="font-bold text-gray-900 text-sm">{group.product}</span>
                    <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 ml-1">
                      {group.matches} Match{group.matches > 1 ? 'es' : ''}
                    </span>
                  </div>
                  
                  {/* Parent Probability Bar */}
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-sm font-semibold text-purple-700">{group.avgProbability}%</span>
                    <div className="w-16 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${group.avgProbability}%` }}></div>
                    </div>
                  </div>

                  <div className="col-span-1 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded inline-block w-max">
                    {group.totalAmount}
                  </div>
                  <div className="col-span-1 text-sm font-semibold text-gray-700">{group.avgTenure}</div>
                  <div className="col-span-1 text-sm font-semibold text-gray-700">{group.avgRoi}</div>
                  <div className="col-span-3 text-xs text-gray-600 truncate">{group.securitySummary}</div>
                  <div className="col-span-1 text-right text-xs text-gray-400">--</div>
                </div>

                {/* Child Rows (The Lenders) */}
                {isExpanded && (
                  <div className="bg-gray-50/30">
                    {group.lenders.map((lender) => (
                      <div key={lender.id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center border-t border-gray-100 hover:bg-purple-50/20 transition-colors">
                        <div className="col-span-3 pl-12 flex items-center gap-3">
                          <CheckSquare size={16} className="text-purple-500" />
                          <span className="text-sm font-medium text-gray-700">{lender.lenderName}</span>
                          {lender.isTopPick && (
                            <span className="text-[9px] tracking-wider border border-purple-200 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-sm font-bold uppercase">Top Pick</span>
                          )}
                        </div>
                        
                        {/* Child Probability Bar */}
                        <div className="col-span-2 flex items-center gap-2">
                          <span className="text-sm font-medium text-purple-700">{lender.probability}%</span>
                          <div className="w-16 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${lender.probability}%` }}></div>
                          </div>
                        </div>

                        <div className="col-span-1 text-sm text-gray-600">{lender.amount}</div>
                        <div className="col-span-1 text-sm text-gray-600">{lender.tenure}</div>
                        <div className="col-span-1 text-sm text-gray-600">{lender.roi}</div>
                        <div className="col-span-3 text-xs text-gray-500 truncate">{lender.security}</div>
                        <div className="col-span-1 text-right">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${lender.statusColor}`}>
                            {lender.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-gray-500">
            No dynamic matching lenders found for your current profile.
          </div>
        )}
      </div>
    </div>
  );
}
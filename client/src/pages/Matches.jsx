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
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Matches() {
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [expandedLenders, setExpandedLenders] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [lenders, setLenders] = useState([]);

  const handleDragStart = (e, lenderId) => {
    e.dataTransfer.setData('text/plain', lenderId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const lenderId = e.dataTransfer.getData('text/plain');
    if (!lenderId) return;

    const targetLender = lenders.find(l => l.id === lenderId);
    if (!targetLender || targetLender.status === targetStatus) return;

    const originalLenders = [...lenders];

    const statusColorMap = {
      'Deal Shared': 'bg-purple-50 text-purple-600',
      'Interest Received': 'bg-emerald-50 text-emerald-600',
      'Diligence': 'bg-blue-50 text-blue-600',
      'Sanction / Close': 'bg-amber-50 text-amber-600',
      'Passed': 'bg-red-50 text-red-600'
    };

    // Optimistic UI state updates
    setLenders(prev => prev.map(l => 
      l.id === lenderId 
        ? { ...l, status: targetStatus, statusColor: statusColorMap[targetStatus] || 'bg-gray-50 text-gray-600' } 
        : l
    ));

    try {
      await api.put(`/matches/${lenderId}/status`, { pipelineStatus: targetStatus });
      toast.success(`Moved deal to ${targetStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update deal stage on server');
      setLenders(originalLenders);
    }
  };

  const toggleLender = (lenderId) => {
    const newExpanded = new Set(expandedLenders);
    if (newExpanded.has(lenderId)) {
      newExpanded.delete(lenderId);
    } else {
      newExpanded.add(lenderId);
    }
    setExpandedLenders(newExpanded);
  };

  const renderLeverageMeter = (value) => {
    const val = parseFloat(value) || 0;
    const percentage = Math.min(100, (val / 10) * 100);
    let zoneColor = 'bg-emerald-500';
    let zoneText = 'Safe';
    let textColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (val >= 2.5 && val <= 4.5) {
      zoneColor = 'bg-amber-500';
      zoneText = 'Moderate';
      textColor = 'text-amber-700 bg-amber-50 border-amber-100';
    } else if (val > 4.5) {
      zoneColor = 'bg-red-500';
      zoneText = 'High Risk';
      textColor = 'text-red-700 bg-red-50 border-red-100';
    }
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-semibold text-gray-500">
          <span>Leverage (Debt/EBITDA): <strong className="text-gray-800">{val}x</strong></span>
          <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${textColor}`}>{zoneText}</span>
        </div>
        <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-400" style={{ width: '25%' }}></div>
          <div className="h-full bg-amber-400" style={{ width: '20%' }}></div>
          <div className="h-full bg-red-400" style={{ width: '55%' }}></div>
          <div className={`absolute top-0 bottom-0 w-1.5 border border-white rounded-full ${zoneColor}`} style={{ left: `calc(${percentage}% - 3px)` }}></div>
        </div>
      </div>
    );
  };

  const renderDebtToEquityMeter = (value) => {
    const val = parseFloat(value) || 0;
    const percentage = Math.min(100, (val / 5) * 100);
    let zoneColor = 'bg-emerald-500';
    let zoneText = 'Safe Leverage';
    let textColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (val >= 1.5 && val <= 3.0) {
      zoneColor = 'bg-amber-500';
      zoneText = 'Elevated';
      textColor = 'text-amber-700 bg-amber-50 border-amber-100';
    } else if (val > 3.0) {
      zoneColor = 'bg-red-500';
      zoneText = 'Highly Leveraged';
      textColor = 'text-red-700 bg-red-50 border-red-100';
    }
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-semibold text-gray-500">
          <span>Debt-to-Equity (D/E): <strong className="text-gray-800">{val}x</strong></span>
          <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${textColor}`}>{zoneText}</span>
        </div>
        <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-400" style={{ width: '30%' }}></div>
          <div className="h-full bg-amber-400" style={{ width: '30%' }}></div>
          <div className="h-full bg-red-400" style={{ width: '40%' }}></div>
          <div className={`absolute top-0 bottom-0 w-1.5 border border-white rounded-full ${zoneColor}`} style={{ left: `calc(${percentage}% - 3px)` }}></div>
        </div>
      </div>
    );
  };

  const renderCurrentRatioMeter = (value) => {
    const val = parseFloat(value) || 0;
    const percentage = Math.min(100, (val / 3) * 100);
    let zoneColor = 'bg-emerald-500';
    let zoneText = 'Adequate';
    let textColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (val >= 1.0 && val <= 1.5) {
      zoneColor = 'bg-amber-500';
      zoneText = 'Tight';
      textColor = 'text-amber-700 bg-amber-50 border-amber-100';
    } else if (val < 1.0) {
      zoneColor = 'bg-red-500';
      zoneText = 'Illiquid';
      textColor = 'text-red-700 bg-red-50 border-red-100';
    }
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-semibold text-gray-500">
          <span>Current Ratio (Liquidity): <strong className="text-gray-800">{val}x</strong></span>
          <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${textColor}`}>{zoneText}</span>
        </div>
        <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-red-400" style={{ width: '33.3%' }}></div>
          <div className="h-full bg-amber-400" style={{ width: '16.7%' }}></div>
          <div className="h-full bg-emerald-400" style={{ width: '50%' }}></div>
          <div className={`absolute top-0 bottom-0 w-1.5 border border-white rounded-full ${zoneColor}`} style={{ left: `calc(${percentage}% - 3px)` }}></div>
        </div>
      </div>
    );
  };

  const renderDscrMeter = (value) => {
    const val = parseFloat(value) || 0;
    const percentage = Math.min(100, (val / 5) * 100);
    let zoneColor = 'bg-emerald-500';
    let zoneText = 'Strong';
    let textColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (val >= 1.2 && val <= 2.0) {
      zoneColor = 'bg-amber-500';
      zoneText = 'Moderate';
      textColor = 'text-amber-700 bg-amber-50 border-amber-100';
    } else if (val < 1.2) {
      zoneColor = 'bg-red-500';
      zoneText = 'Weak Coverage';
      textColor = 'text-red-700 bg-red-50 border-red-100';
    }
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-semibold text-gray-500">
          <span>Interest Coverage (DSCR): <strong className="text-gray-800">{val}x</strong></span>
          <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${textColor}`}>{zoneText}</span>
        </div>
        <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-red-400" style={{ width: '24%' }}></div>
          <div className="h-full bg-amber-400" style={{ width: '16%' }}></div>
          <div className="h-full bg-emerald-400" style={{ width: '60%' }}></div>
          <div className={`absolute top-0 bottom-0 w-1.5 border border-white rounded-full ${zoneColor}`} style={{ left: `calc(${percentage}% - 3px)` }}></div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async (force = false) => {
    try {
      setLoading(true);
      const url = force ? '/matches?force=true' : '/matches';
      const { data } = await api.get(url);
      setMatchData(data);
      
      if (data && data.status === 'success' && data.matches.length > 0) {
        // Auto-expand first product if available
        setExpandedProducts(new Set([data.matches[0].product]));
        
        // Flatten nested structure for Kanban list state
        const flatLenders = [];
        data.matches.forEach(group => {
          group.lenders.forEach(l => {
            flatLenders.push({ 
              ...l, 
              product: group.product,
              statusColor: l.statusColor || 'bg-purple-50 text-purple-600'
            });
          });
        });
        setLenders(flatLenders);
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

  const kanbanColumns = [
    { id: 'Deal Shared', title: 'Deal Shared', headerColor: 'border-t-purple-500 text-purple-700 bg-purple-50/50' },
    { id: 'Interest Received', title: 'Interest Received', headerColor: 'border-t-emerald-500 text-emerald-700 bg-emerald-50/50' },
    { id: 'Diligence', title: 'Diligence', headerColor: 'border-t-blue-500 text-blue-700 bg-blue-50/50' },
    { id: 'Sanction / Close', title: 'Sanctioned', headerColor: 'border-t-amber-500 text-amber-700 bg-amber-50/50' }
  ];

  return (
    <div className="max-w-[1400px] mx-auto h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-between justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-600" />
            Lender Matches
          </h1>
          <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full border border-purple-100">
            Dynamic Matching Active
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-white text-purple-700 shadow-sm border border-gray-100' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              List View
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban' 
                  ? 'bg-white text-purple-700 shadow-sm border border-gray-100' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Kanban Board
            </button>
          </div>

          <button 
            onClick={() => fetchMatches(true)}
            disabled={loading}
            className="text-xs font-bold text-purple-600 hover:text-purple-800 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100/50 px-3 py-1.5 rounded-lg border border-purple-100 transition-all active:scale-[0.98]"
            title="Force recompute embeddings and query AI credit rationales"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Re-run Matching Engine
          </button>
        </div>
      </div>

      {/* Table Header (List View Only) */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3 pl-8">Recommended Products</div>
          <div className="col-span-2">Probability <Info size={12} className="inline text-gray-400 ml-1" /></div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-1">Tenure</div>
          <div className="col-span-1">ROI</div>
          <div className="col-span-3">Security</div>
          <div className="col-span-1 text-right">Status</div>
        </div>
      )}

      {/* Table Body / Kanban Grid */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'list' ? (
          debtOptions.length > 0 ? (
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
                        <React.Fragment key={lender.id}>
                          <div 
                            className="grid grid-cols-12 gap-4 px-6 py-3 items-center border-t border-gray-100 hover:bg-purple-50/20 cursor-pointer transition-colors"
                            onClick={() => toggleLender(lender.id)}
                          >
                            <div className="col-span-3 pl-12 flex items-center gap-3">
                              <CheckSquare size={16} className="text-purple-500" />
                              <span className="text-sm font-medium text-gray-700">{lender.lenderName}</span>
                              {lender.underwriting?.creditRating && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                  {lender.underwriting.creditRating}
                                </span>
                              )}
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
                            <div className="col-span-1 text-right flex items-center justify-end gap-2">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${lender.statusColor}`}>
                                {lender.status}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold hover:text-purple-600">
                                {expandedLenders.has(lender.id) ? 'Hide' : 'Appraisal'}
                              </span>
                            </div>
                          </div>

                          {/* Expandable AI Underwriting appraisal Memo panel */}
                          {expandedLenders.has(lender.id) && (
                            <div className="px-6 pl-16 py-4 bg-purple-50/10 border-t border-purple-100/50 text-xs space-y-3">
                              <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-12 md:col-span-4 border-r border-gray-100 pr-4">
                                  <h4 className="font-bold text-gray-900 mb-3.5 uppercase tracking-wider text-[10px] text-purple-600">Calculated Credit Ratios</h4>
                                  <div className="space-y-3.5">
                                    {renderLeverageMeter(lender.underwriting?.calculatedRatios?.leverage)}
                                    {renderDebtToEquityMeter(lender.underwriting?.calculatedRatios?.debtToEquity)}
                                    {renderCurrentRatioMeter(lender.underwriting?.calculatedRatios?.currentRatio)}
                                    {renderDscrMeter(lender.underwriting?.calculatedRatios?.dscr)}
                                  </div>
                                </div>
                                <div className="col-span-12 md:col-span-8">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[10px] text-purple-600">AI Underwriting Appraisal Memo</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-600 text-white shadow-sm">
                                      Risk Grade: {lender.underwriting?.creditRating || 'BBB'}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 leading-relaxed bg-white border border-purple-100 rounded-lg p-3 shadow-sm font-normal">
                                    "{lender.underwriting?.riskRationale || 'Underwriting analysis is pending. Please verify financials are uploaded and re-run matching.'}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
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
          )
        ) : (
          /* Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-6 h-full bg-gray-50/50">
            {kanbanColumns.map(col => {
              const colLenders = lenders.filter(l => l.status === col.id);
              return (
                <div 
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="flex flex-col bg-gray-100/60 border border-gray-200/80 rounded-2xl p-4 space-y-4 h-[calc(100vh-14rem)] overflow-y-auto"
                >
                  <div className={`px-3 py-2 rounded-lg border-t-4 ${col.headerColor} flex justify-between items-center shadow-sm`}>
                    <span className="font-bold text-[10px] tracking-wider uppercase">{col.title}</span>
                    <span className="bg-white border border-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{colLenders.length}</span>
                  </div>

                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                    {colLenders.map(l => (
                      <div 
                        key={l.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, l.id)}
                        className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm hover:shadow transition-all cursor-grab active:cursor-grabbing space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h5 className="font-bold text-gray-950 text-xs tracking-tight">{l.lenderName}</h5>
                            <p className="text-[9px] text-gray-400 font-semibold uppercase">{l.institutionType}</p>
                          </div>
                          {l.isTopPick && (
                            <span className="text-[8px] tracking-wider border border-purple-200 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Top Pick</span>
                          )}
                        </div>

                        <div className="flex gap-1.5 flex-wrap">
                          <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded">{l.product}</span>
                          <span className="bg-purple-50 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded border border-purple-100">{l.amount}</span>
                        </div>

                        {l.underwriting?.creditRating && (
                          <div className="bg-purple-50/10 border border-purple-100/50 rounded-lg p-2.5 text-[9px] text-gray-500 space-y-1">
                            <div className="flex justify-between items-center font-bold text-purple-800">
                              <span>AI Risk Grade:</span>
                              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">{l.underwriting.creditRating}</span>
                            </div>
                            <p className="line-clamp-2 leading-normal">
                              "{l.underwriting.riskRationale}"
                            </p>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold text-gray-400">
                            <span>Approval Chance:</span>
                            <span className="text-purple-600">{l.probability}%</span>
                          </div>
                          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${l.probability}%` }}></div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex justify-end">
                          <button 
                            onClick={() => toggleLender(l.id)}
                            className="text-[9px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
                          >
                            {expandedLenders.has(l.id) ? 'Hide Appraisal' : 'View Appraisal'}
                          </button>
                        </div>

                        {expandedLenders.has(l.id) && (
                          <div className="pt-2 border-t border-purple-100/30 space-y-2 text-[9px]">
                            <div className="space-y-1.5 text-gray-500 font-medium">
                              <div className="flex justify-between">
                                <span>Leverage:</span>
                                <span className="text-gray-800 font-bold">{l.underwriting?.calculatedRatios?.leverage}x</span>
                              </div>
                              <div className="flex justify-between">
                                <span>D/E Ratio:</span>
                                <span className="text-gray-800 font-bold">{l.underwriting?.calculatedRatios?.debtToEquity}x</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Current Ratio:</span>
                                <span className="text-gray-800 font-bold">{l.underwriting?.calculatedRatios?.currentRatio}x</span>
                              </div>
                              <div className="flex justify-between">
                                <span>DSCR:</span>
                                <span className="text-gray-800 font-bold">{l.underwriting?.calculatedRatios?.dscr}x</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {colLenders.length === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl py-8 text-center text-gray-400 text-[10px] font-medium flex items-center justify-center h-24">
                        Drag cards here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
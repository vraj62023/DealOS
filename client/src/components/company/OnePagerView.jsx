import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCompany } from '../../app/features/companySlice';
import api from '../../configs/api';
import { Edit2, Save, X, Plus, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OnePagerView() {
  const dispatch = useDispatch();
  const { data: company } = useSelector((state) => state.company);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [finViewMode, setFinViewMode] = useState('table'); // 'table' or 'chart'

  // Initialize edited data state when entering edit mode or when company updates
  useEffect(() => {
    if (company) {
      setEditedData(JSON.parse(JSON.stringify(company)));
    }
  }, [company, isEditMode]);

  if (!company) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-white border border-dashed border-gray-300 rounded-xl p-8">
        <FileText size={48} className="mb-4 text-gray-300 animate-pulse" />
        <h3 className="text-xl font-medium text-gray-500">Company One-Pager</h3>
        <p className="text-sm mt-2 text-center max-w-sm">Start chatting with PROBE or upload documents to build your institutional-grade deal profile.</p>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parentField, childField, value) => {
    setEditedData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const handleArrayChange = (field, index, key, value) => {
    const updatedArray = [...editedData[field]];
    updatedArray[index] = {
      ...updatedArray[index],
      [key]: value
    };
    setEditedData(prev => ({
      ...prev,
      [field]: updatedArray
    }));
  };

  const handleAddRow = (field, defaultValue) => {
    setEditedData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), defaultValue]
    }));
  };

  const handleRemoveRow = (field, index) => {
    setEditedData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, idx) => idx !== index)
    }));
  };

  const handleSave = async () => {
    try {
      const { data } = await api.put('/company/update', editedData);
      dispatch(setCompany(data.company));
      setIsEditMode(false);
      toast.success('One-Pager updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save manual edits');
    }
  };

  // Helper formatting function
  const formatCr = (num) => {
    if (num === null || num === undefined || num === '') return '---';
    return `INR ${Number(num).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
  };

  const renderEditableCell = (value, onChange, placeholder = '---', type = 'text', className = '') => {
    if (isEditMode) {
      return (
        <input
          type={type}
          value={value === null || value === undefined ? '' : value}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          className={`w-full px-2 py-1 text-xs border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded bg-blue-50/50 ${className}`}
        />
      );
    }
    return <span className={className}>{value || '---'}</span>;
  };

  const renderEditableTextArea = (value, onChange, placeholder = '---') => {
    if (isEditMode) {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-2 py-1 text-xs border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded bg-blue-50/50"
        />
      );
    }
    return <span className="whitespace-pre-wrap">{value || '---'}</span>;
  };

  // Data mapping from active model (use editedData in editMode, company in viewMode)
  const d = isEditMode && editedData ? editedData : company;

  const directors = d.directors || [];
  const financials = d.financials || [];
  const existingDebts = d.existingDebts || [];
  const orderBook = d.orderBook || [];

  const renderFinancialsChart = () => {
    if (!financials || financials.length === 0) {
      return <div className="p-4 text-center text-gray-400 text-xs font-sans">No financial records to chart</div>;
    }

    // Sort financials chronologically by year (e.g. FY23, FY24)
    const sortedFin = [...financials].sort((a, b) => {
      const yrA = parseInt(a.year?.replace(/\D/g, '')) || 0;
      const yrB = parseInt(b.year?.replace(/\D/g, '')) || 0;
      return yrA - yrB;
    });

    const maxRev = Math.max(...sortedFin.map(f => parseFloat(f.revenue) || 0), 10);
    const maxEbitda = Math.max(...sortedFin.map(f => parseFloat(f.ebitda) || 0), 2);

    const svgWidth = 500;
    const svgHeight = 200;
    const paddingLeft = 45;
    const paddingRight = 45;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    const barWidth = Math.min(35, chartWidth / (sortedFin.length * 2));
    const stepX = sortedFin.length > 1 ? chartWidth / (sortedFin.length - 1) : chartWidth;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center text-xs">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-purple-700">
              <span className="w-3 h-3 bg-purple-500 rounded-sm"></span>
              Revenue (LHS)
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
              <span className="w-3.5 h-0.5 bg-emerald-500 inline-block"></span>
              EBITDA (RHS)
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold font-sans">INR Crores</span>
        </div>

        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible select-none">
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((tick, idx) => {
            const y = paddingTop + chartHeight * (1 - tick);
            return (
              <g key={idx} className="opacity-40">
                <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" strokeWidth="1" />
                {/* LHS axis ticks */}
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="fill-gray-400 font-sans text-[8px] font-semibold">
                  {Math.round(maxRev * tick)}
                </text>
                {/* RHS axis ticks */}
                <text x={svgWidth - paddingRight + 8} y={y + 3} textAnchor="start" className="fill-gray-400 font-sans text-[8px] font-semibold">
                  {Math.round(maxEbitda * tick)}
                </text>
              </g>
            );
          })}

          {/* Render Bars (Revenue) */}
          {sortedFin.map((f, idx) => {
            const rev = parseFloat(f.revenue) || 0;
            const x = paddingLeft + (idx * stepX);
            const revBarHeight = (rev / maxRev) * chartHeight;
            const revY = paddingTop + chartHeight - revBarHeight;

            return (
              <g key={idx}>
                <rect 
                  x={x - barWidth / 2} 
                  y={revY} 
                  width={barWidth} 
                  height={revBarHeight} 
                  className="fill-purple-500/80 hover:fill-purple-600 transition-colors" 
                  rx="2"
                />
                
                {/* Year Label */}
                <text x={x} y={svgHeight - 8} textAnchor="middle" className="fill-gray-600 font-bold font-sans text-[9px]">
                  {f.year}
                </text>
                
                {/* Values overlay */}
                <text x={x} y={revY - 5} textAnchor="middle" className="fill-purple-800 font-bold font-sans text-[8px]">
                  {rev ? `₹${rev}` : ''}
                </text>
              </g>
            );
          })}

          {/* EBITDA Line Path */}
          {sortedFin.length > 0 && (
            <path 
              d={sortedFin.map((f, idx) => {
                const eb = parseFloat(f.ebitda) || 0;
                const x = paddingLeft + (idx * stepX);
                const y = paddingTop + chartHeight - ((eb / maxEbitda) * chartHeight);
                return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* EBITDA Line Nodes */}
          {sortedFin.map((f, idx) => {
            const eb = parseFloat(f.ebitda) || 0;
            const x = paddingLeft + (idx * stepX);
            const y = paddingTop + chartHeight - ((eb / maxEbitda) * chartHeight);
            return (
              <g key={idx}>
                <circle cx={x} cy={y} r="3.5" className="fill-white stroke-emerald-500 stroke-2" />
                <text x={x + 6} y={y - 4} className="fill-emerald-800 font-sans font-bold text-[8px]">
                  {eb ? `₹${eb}` : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };
  const linesOfCredit = d.linesOfCredit || [];
  const globalNetwork = d.globalNetwork || [];
  const keyClients = d.keyClients || [];
  const missingFields = d.missingFields || [];

  return (
    <div className="w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      
      {/* Top Bar Actions */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex justify-between items-center z-10 shrink-0">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FileText size={16} className="text-purple-600" />
          Deal Memorandum &amp; One-Pager
        </h2>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <button 
                onClick={() => setIsEditMode(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-all"
              >
                <X size={14} /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all"
              >
                <Save size={14} /> Save Changes
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg shadow-sm transition-all"
            >
              <Edit2 size={14} /> Direct Edit
            </button>
          )}
        </div>
      </div>

      {/* Main Document Body */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white border-2 border-gray-800 p-8 shadow-md font-serif text-gray-900 leading-relaxed text-sm">

          {/* PRIVATE & CONFIDENTIAL */}
          <div className="flex justify-between items-center border-b-2 border-gray-800 pb-2 mb-6">
            <span className="text-xs uppercase font-sans tracking-widest text-gray-500 font-bold">Private &amp; Confidential</span>
            <span className="text-xs font-sans text-gray-500 font-bold">Page 2</span>
          </div>

          {/* TITLE HEADER */}
          <div className="text-center py-6 border-b-2 border-gray-800 mb-8">
            <h1 className="text-3xl italic font-bold tracking-wide uppercase">
              {isEditMode ? (
                <input
                  type="text"
                  value={d.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Enter Company Name"
                  className="w-full text-center py-1 text-2xl italic font-bold border border-blue-300 bg-blue-50/50 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                d.companyName || 'ARVENSIS ENERGY PRIVATE LIMITED'
              )}
            </h1>
            <p className="text-xs font-sans text-gray-500 mt-2 tracking-wider">CREDIT ASSESSMENT MEMORANDUM</p>
          </div>

          <div className="space-y-8">

            {/* SECTION 1: GENERAL DETAILS */}
            <div>
              <table className="w-full border-collapse border-t-2 border-b-2 border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={2} className="border-b border-gray-400 px-3 py-2 text-left font-sans text-xs uppercase tracking-wider font-bold">General Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold w-1/4">Company</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableCell(d.companyName, (v) => handleInputChange('companyName', v))}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">CIN</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableCell(d.cin, (v) => handleInputChange('cin', v), 'e.g. U45207AP2013PTC090083')}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">PAN</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableCell(d.pan, (v) => handleInputChange('pan', v), 'e.g. AAMCA0318A')}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">Incorporation</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableCell(d.incorporationYear, (v) => handleInputChange('incorporationYear', v), 'e.g. 2013')}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">Registered Office</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableTextArea(d.registeredOffice, (v) => handleInputChange('registeredOffice', v))}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">Branch Office</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableTextArea(d.branchOffice, (v) => handleInputChange('branchOffice', v))}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">Website</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableCell(d.website, (v) => handleInputChange('website', v), 'e.g. http://www.arvensis.in/')}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">Industry</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableCell(d.industry, (v) => handleInputChange('industry', v))}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">Company Profile</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableTextArea(d.companyProfile, (v) => handleInputChange('companyProfile', v))}</td>
                  </tr>
                  <tr>
                    <td className="border-gray-800 px-3 py-2 font-bold">Global Network &amp; Subsidiaries</td>
                    <td className="border-gray-800 px-3 py-2">
                      {isEditMode ? (
                        <div className="space-y-2">
                          {(d.globalNetwork || []).map((net, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text"
                                value={net}
                                onChange={(e) => {
                                  const updatedNet = [...d.globalNetwork];
                                  updatedNet[idx] = e.target.value;
                                  handleInputChange('globalNetwork', updatedNet);
                                }}
                                className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded bg-blue-50/50"
                              />
                              <button onClick={() => {
                                handleInputChange('globalNetwork', d.globalNetwork.filter((_, i) => i !== idx));
                              }} className="text-red-500 hover:text-red-700">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => handleInputChange('globalNetwork', [...(d.globalNetwork || []), ''])}
                            className="flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1"
                          >
                            <Plus size={12} /> Add Subsidiary
                          </button>
                        </div>
                      ) : (
                        <ul className="list-disc pl-5 space-y-1">
                          {(d.globalNetwork || []).map((net, idx) => (
                            <li key={idx}>{net}</li>
                          ))}
                          {(!d.globalNetwork || d.globalNetwork.length === 0) && <li>---</li>}
                        </ul>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 2: BUSINESS MODEL & OPERATIONS */}
            <div>
              <table className="w-full border-collapse border-t-2 border-b-2 border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={2} className="border-b border-gray-400 px-3 py-2 text-left font-sans text-xs uppercase tracking-wider font-bold">Business Model &amp; Capabilities</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold w-1/4">Business Model</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableTextArea(d.businessModel, (v) => handleInputChange('businessModel', v))}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">Key Milestones</td>
                    <td className="border-b border-gray-400 px-3 py-2">{renderEditableTextArea(d.keyMilestones, (v) => handleInputChange('keyMilestones', v))}</td>
                  </tr>
                  <tr>
                    <td className="border-gray-800 px-3 py-2 font-bold">Key Clients</td>
                    <td className="border-gray-800 px-3 py-2">
                      {isEditMode ? (
                        <div className="space-y-2">
                          {(d.keyClients || []).map((client, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text"
                                value={client}
                                onChange={(e) => {
                                  const updatedClients = [...d.keyClients];
                                  updatedClients[idx] = e.target.value;
                                  handleInputChange('keyClients', updatedClients);
                                }}
                                className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded bg-blue-50/50"
                              />
                              <button onClick={() => {
                                handleInputChange('keyClients', d.keyClients.filter((_, i) => i !== idx));
                              }} className="text-red-500 hover:text-red-700">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => handleInputChange('keyClients', [...(d.keyClients || []), ''])}
                            className="flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1"
                          >
                            <Plus size={12} /> Add Client
                          </button>
                        </div>
                      ) : (
                        <span>{(d.keyClients || []).join(', ') || '---'}</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 3: SHAREHOLDING PATTERN */}
            <div>
              <table className="w-full border-collapse border-t-2 border-b-2 border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={3} className="border-b border-gray-400 px-3 py-2 text-left font-sans text-xs uppercase tracking-wider font-bold">Shareholding Pattern</th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-300 text-xs">
                    <th className="px-3 py-1.5 text-left w-12">S.No</th>
                    <th className="px-3 py-1.5 text-left">Name of Shareholder</th>
                    <th className="px-3 py-1.5 text-right w-40">% of Shareholding</th>
                  </tr>
                </thead>
                <tbody>
                  {(d.shareholding || []).map((s, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="px-3 py-1.5 text-xs">{idx + 1}</td>
                      <td className="px-3 py-1.5 text-xs">
                        {renderEditableCell(s.name, (v) => handleArrayChange('shareholding', idx, 'name', v))}
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs">
                        {isEditMode ? (
                          <div className="flex items-center justify-end gap-1">
                            <input 
                              type="number"
                              value={s.percentage || ''}
                              onChange={(e) => handleArrayChange('shareholding', idx, 'percentage', Number(e.target.value))}
                              className="w-16 px-1 py-0.5 border border-blue-300 bg-blue-50/50 rounded text-right"
                            />%
                            <button onClick={() => handleRemoveRow('shareholding', idx)} className="text-red-500 hover:text-red-700 ml-2">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          `${s.percentage}%`
                        )}
                      </td>
                    </tr>
                  ))}
                  {isEditMode && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2">
                        <button 
                          onClick={() => handleAddRow('shareholding', { name: '', percentage: 0 })}
                          className="flex items-center gap-1 text-xs text-blue-600 font-semibold"
                        >
                          <Plus size={12} /> Add Shareholder
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="font-bold bg-gray-50">
                    <td colSpan={2} className="px-3 py-2 text-right">Total</td>
                    <td className="px-3 py-2 text-right">
                      {Math.round((d.shareholding || []).reduce((sum, s) => sum + (Number(s.percentage) || 0), 0))}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 4: DETAILS OF DIRECTORS & PROFILES */}
            <div>
              <table className="w-full border-collapse border-t-2 border-b-2 border-gray-800 mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={4} className="border-b border-gray-400 px-3 py-2 text-left font-sans text-xs uppercase tracking-wider font-bold">Details of Directors</th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-300 text-xs">
                    <th className="px-3 py-1.5 text-left w-12">S.No</th>
                    <th className="px-3 py-1.5 text-left">Name</th>
                    <th className="px-3 py-1.5 text-left">Designation</th>
                    {isEditMode && <th className="px-3 py-1.5 text-right w-12">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {directors.map((dir, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="px-3 py-1.5 text-xs">{idx + 1}</td>
                      <td className="px-3 py-1.5 text-xs">
                        {renderEditableCell(dir.name, (v) => handleArrayChange('directors', idx, 'name', v))}
                      </td>
                      <td className="px-3 py-1.5 text-xs">
                        {renderEditableCell(dir.designation, (v) => handleArrayChange('directors', idx, 'designation', v))}
                      </td>
                      {isEditMode && (
                        <td className="px-3 py-1.5 text-right">
                          <button onClick={() => handleRemoveRow('directors', idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {isEditMode && (
                    <tr>
                      <td colSpan={4} className="px-3 py-2">
                        <button 
                          onClick={() => handleAddRow('directors', { name: '', designation: '', profile: '' })}
                          className="flex items-center gap-1 text-xs text-blue-600 font-semibold"
                        >
                          <Plus size={12} /> Add Director
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Director Profiles / Bio Details */}
              <div className="space-y-4">
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1">Directors' Bios</h3>
                {directors.map((dir, idx) => (
                  <div key={idx} className="bg-gray-50/50 p-3 border border-gray-200 rounded">
                    <p className="font-bold text-xs font-sans text-gray-700">{dir.name || `Director ${idx + 1}`} - <span className="font-normal italic">{dir.designation || 'Director'}</span></p>
                    <div className="mt-1.5 text-xs">
                      {renderEditableTextArea(dir.profile, (v) => handleArrayChange('directors', idx, 'profile', v), 'Enter bio/profile details...')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: FINANCIAL SUMMARY */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-600">Financial Summary (INR Crores)</h3>
                
                {/* View switcher tabs */}
                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                  <button 
                    type="button"
                    onClick={() => setFinViewMode('table')}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      finViewMode === 'table' 
                        ? 'bg-white text-purple-700 shadow-sm border border-gray-100' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Table
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFinViewMode('chart')}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      finViewMode === 'chart' 
                        ? 'bg-white text-purple-700 shadow-sm border border-gray-100' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Trend Chart
                  </button>
                </div>
              </div>
              
              {finViewMode === 'chart' ? (
                renderFinancialsChart()
              ) : (
                <div className="space-y-6">
                  {/* Financial columns structure */}
                  <table className="w-full border-collapse border-t-2 border-b-2 border-gray-800">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-400">
                        <th className="px-3 py-2 text-left font-sans text-xs uppercase tracking-wider font-bold">Balance Sheet Metrics</th>
                        {financials.map((f, idx) => (
                          <th key={idx} className="px-3 py-2 text-right font-sans text-xs uppercase tracking-wider font-bold">
                            {isEditMode ? (
                              <input 
                                type="text" 
                                value={f.year || ''} 
                                onChange={(e) => handleArrayChange('financials', idx, 'year', e.target.value)}
                                className="w-16 px-1 py-0.5 text-xs text-right border border-blue-300 bg-blue-50/50 rounded"
                              />
                            ) : (
                              f.year
                            )}
                          </th>
                        ))}
                        {isEditMode && (
                          <th className="px-3 py-2 text-right w-12">
                            <button 
                              type="button"
                              onClick={() => handleAddRow('financials', { year: `FY${25 - financials.length}` })}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Plus size={14} />
                            </button>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Share Capital', key: 'shareCapital' },
                        { label: 'Reserves & Surplus', key: 'reservesSurplus' },
                        { label: 'Net Worth', key: 'netWorth', isBold: true },
                        { label: 'Long-Term Loans - TL', key: 'longTermLoansTL' },
                        { label: 'Long-Term Loans - Vehicle', key: 'longTermLoansVehicle' },
                        { label: 'Short-Term Loans - Bank', key: 'shortTermLoansBank' },
                        { label: 'Unsecured from Directors', key: 'unsecuredFromDirectors' },
                        { label: 'Trade Payables', key: 'tradePayables' },
                        { label: 'Other Current Liabilities', key: 'otherCurrentLiabilities' },
                        { label: 'Short-Term Provisions', key: 'shortTermProvisions' },
                        { label: 'Fixed Assets', key: 'fixedAssets' },
                        { label: 'Inventories', key: 'inventories' },
                        { label: 'Trade Receivables', key: 'tradeReceivables' },
                        { label: 'Cash & Bank Balances', key: 'cashBankBalances' },
                        { label: 'Other Current Assets', key: 'otherCurrentAssets' }
                      ].map((row) => (
                        <tr key={row.key} className={`border-b border-gray-200 ${row.isBold ? 'font-bold bg-gray-50' : ''}`}>
                          <td className="px-3 py-1.5 text-xs">{row.label}</td>
                          {financials.map((f, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-right text-xs">
                              {renderEditableCell(f[row.key], (v) => handleArrayChange('financials', idx, row.key, v), '0.00', 'number')}
                            </td>
                          ))}
                          {isEditMode && <td className="px-3 py-1.5 text-right">
                            <button type="button" onClick={() => handleRemoveRow('financials', idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={12} />
                            </button>
                          </td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Profit & Loss Table */}
                  <table className="w-full border-collapse border-t-2 border-b-2 border-gray-800">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-400">
                        <th className="px-3 py-2 text-left font-sans text-xs uppercase tracking-wider font-bold">Profit &amp; Loss Statements</th>
                        {financials.map((f, idx) => (
                          <th key={idx} className="px-3 py-2 text-right font-sans text-xs uppercase tracking-wider font-bold">{f.year}</th>
                        ))}
                        {isEditMode && <th className="w-12"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Revenue', key: 'revenue' },
                        { label: 'Other Income', key: 'otherIncome' },
                        { label: 'Total Revenue', key: 'totalRevenue', isBold: true },
                        { label: 'COGS', key: 'cogs' },
                        { label: 'EBITDA', key: 'ebitda', isBold: true },
                        { label: 'Finance Cost', key: 'financeCost' },
                        { label: 'Depreciation & Amortisation', key: 'depreciationAmortisation' },
                        { label: 'Profit Before Tax', key: 'profitBeforeTax' },
                        { label: 'Profit After Tax (PAT)', key: 'profitAfterTax', isBold: true },
                        { label: 'Cash Profits', key: 'cashProfits' }
                      ].map((row) => (
                        <tr key={row.key} className={`border-b border-gray-200 ${row.isBold ? 'font-bold bg-gray-50' : ''}`}>
                          <td className="px-3 py-1.5 text-xs">{row.label}</td>
                          {financials.map((f, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-right text-xs">
                              {renderEditableCell(f[row.key], (v) => handleArrayChange('financials', idx, row.key, v), '0.00', 'number')}
                            </td>
                          ))}
                          {isEditMode && <td></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 6: DEBT SCHEDULE */}
            <div>
              <table className="w-full border-collapse border-t-2 border-b-2 border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={5} className="border-b border-gray-400 px-3 py-2 text-left font-sans text-xs uppercase tracking-wider font-bold">Existing Debt Schedule (INR Crores)</th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-300 text-xs">
                    <th className="px-3 py-1.5 text-left">Bank / Lender</th>
                    <th className="px-3 py-1.5 text-left">Type of Facility</th>
                    <th className="px-3 py-1.5 text-right">Limit</th>
                    <th className="px-3 py-1.5 text-right">Utilised</th>
                    <th className="px-3 py-1.5 text-left">Collateral</th>
                  </tr>
                </thead>
                <tbody>
                  {existingDebts.map((debt, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="px-3 py-1.5 text-xs">
                        {renderEditableCell(debt.lenderName, (v) => handleArrayChange('existingDebts', idx, 'lenderName', v))}
                      </td>
                      <td className="px-3 py-1.5 text-xs">
                        {renderEditableCell(debt.facilityType, (v) => handleArrayChange('existingDebts', idx, 'facilityType', v))}
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs">
                        {renderEditableCell(debt.sanctionedAmount, (v) => handleArrayChange('existingDebts', idx, 'sanctionedAmount', v), '0.00', 'number')}
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs">
                        {renderEditableCell(debt.outstandingAmount, (v) => handleArrayChange('existingDebts', idx, 'outstandingAmount', v), '0.00', 'number')}
                      </td>
                      <td className="px-3 py-1.5 text-xs flex justify-between items-center">
                        {renderEditableCell(debt.collateral, (v) => handleArrayChange('existingDebts', idx, 'collateral', v), 'Charge summary')}
                        {isEditMode && (
                          <button onClick={() => handleRemoveRow('existingDebts', idx)} className="text-red-500 hover:text-red-700 ml-2">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {isEditMode && (
                    <tr>
                      <td colSpan={5} className="px-3 py-2">
                        <button 
                          onClick={() => handleAddRow('existingDebts', { lenderName: '', facilityType: '', sanctionedAmount: 0, outstandingAmount: 0, collateral: '' })}
                          className="flex items-center gap-1 text-xs text-blue-600 font-semibold"
                        >
                          <Plus size={12} /> Add Debt Record
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="font-bold bg-gray-50 text-xs">
                    <td colSpan={2} className="px-3 py-2 text-right">Total Existing Debt</td>
                    <td className="px-3 py-2 text-right">
                      {existingDebts.reduce((sum, d) => sum + (Number(d.sanctionedAmount) || 0), 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-rose-700">
                      {existingDebts.reduce((sum, d) => sum + (Number(d.outstandingAmount) || 0), 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 7: LINE OF CREDIT */}
            <div>
              <table className="w-full border-collapse border-t-2 border-b-2 border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={8} className="border-b border-gray-400 px-3 py-2 text-left font-sans text-xs uppercase tracking-wider font-bold">Line of Credit (Letter of Credit Details)</th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-300 text-xs">
                    <th className="px-2 py-1.5 text-left w-10">Sr.</th>
                    <th className="px-2 py-1.5 text-left">Currency</th>
                    <th className="px-2 py-1.5 text-right">LC Value (M)</th>
                    <th className="px-2 py-1.5 text-right">Value (INR Cr)</th>
                    <th className="px-2 py-1.5 text-left">Issue Date</th>
                    <th className="px-2 py-1.5 text-left">Tenor</th>
                    <th className="px-2 py-1.5 text-left">Issuing Bank</th>
                    <th className="px-2 py-1.5 text-left">Advising Bank</th>
                  </tr>
                </thead>
                <tbody>
                  {linesOfCredit.map((lc, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="px-2 py-1.5 text-xs">{idx + 1}</td>
                      <td className="px-2 py-1.5 text-xs">
                        {renderEditableCell(lc.currency, (v) => handleArrayChange('linesOfCredit', idx, 'currency', v), 'e.g. USD')}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs">
                        {renderEditableCell(lc.lcValueMillions, (v) => handleArrayChange('linesOfCredit', idx, 'lcValueMillions', v), '0.00', 'number')}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs">
                        {renderEditableCell(lc.valueInrCrore, (v) => handleArrayChange('linesOfCredit', idx, 'valueInrCrore', v), '0.00', 'number')}
                      </td>
                      <td className="px-2 py-1.5 text-xs">
                        {renderEditableCell(lc.issueDate, (v) => handleArrayChange('linesOfCredit', idx, 'issueDate', v))}
                      </td>
                      <td className="px-2 py-1.5 text-xs">
                        {renderEditableCell(lc.periodTenor, (v) => handleArrayChange('linesOfCredit', idx, 'periodTenor', v))}
                      </td>
                      <td className="px-2 py-1.5 text-xs">
                        {renderEditableCell(lc.issuingBank, (v) => handleArrayChange('linesOfCredit', idx, 'issuingBank', v))}
                      </td>
                      <td className="px-2 py-1.5 text-xs flex justify-between items-center">
                        {renderEditableCell(lc.advisingBank, (v) => handleArrayChange('linesOfCredit', idx, 'advisingBank', v))}
                        {isEditMode && (
                          <button onClick={() => handleRemoveRow('linesOfCredit', idx)} className="text-red-500 hover:text-red-700 ml-2">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {isEditMode && (
                    <tr>
                      <td colSpan={8} className="px-3 py-2">
                        <button 
                          onClick={() => handleAddRow('linesOfCredit', { currency: 'USD', lcValueMillions: 0, valueInrCrore: 0, issueDate: '', periodTenor: '', issuingBank: '', advisingBank: '' })}
                          className="flex items-center gap-1 text-xs text-blue-600 font-semibold"
                        >
                          <Plus size={12} /> Add LC Entry
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="font-bold bg-gray-50 text-xs">
                    <td colSpan={3} className="px-2 py-2 text-right">Total LC Value (INR)</td>
                    <td className="px-2 py-2 text-right text-purple-700">
                      {linesOfCredit.reduce((sum, l) => sum + (Number(l.valueInrCrore) || 0), 0).toFixed(2)} Cr
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 8: ORDER BOOK */}
            <div>
              <table className="w-full border-collapse border-t-2 border-b-2 border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={4} className="border-b border-gray-400 px-3 py-2 text-left font-sans text-xs uppercase tracking-wider font-bold">Order Book (Confirmed Business)</th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-300 text-xs">
                    <th className="px-3 py-1.5 text-left w-36">Sector</th>
                    <th className="px-3 py-1.5 text-left w-48">Client</th>
                    <th className="px-3 py-1.5 text-left">Project Scope &amp; Deliverables</th>
                  </tr>
                </thead>
                <tbody>
                  {orderBook.map((ob, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="px-3 py-1.5 text-xs font-bold">
                        {renderEditableCell(ob.sector, (v) => handleArrayChange('orderBook', idx, 'sector', v), 'e.g. Power T&D')}
                      </td>
                      <td className="px-3 py-1.5 text-xs font-medium">
                        {renderEditableCell(ob.client, (v) => handleArrayChange('orderBook', idx, 'client', v))}
                      </td>
                      <td className="px-3 py-1.5 text-xs flex justify-between items-center">
                        {renderEditableTextArea(ob.projectScope, (v) => handleArrayChange('orderBook', idx, 'projectScope', v))}
                        {isEditMode && (
                          <button onClick={() => handleRemoveRow('orderBook', idx)} className="text-red-500 hover:text-red-700 ml-2">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {isEditMode && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2">
                        <button 
                          onClick={() => handleAddRow('orderBook', { sector: '', client: '', projectScope: '' })}
                          className="flex items-center gap-1 text-xs text-blue-600 font-semibold"
                        >
                          <Plus size={12} /> Add Order Item
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* SECTION 9: FUNDING REQUIREMENT DETAILS */}
            <div>
              <table className="w-full border-collapse border-t-2 border-b-2 border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={2} className="border-b border-gray-400 px-3 py-2 text-left font-sans text-xs uppercase tracking-wider font-bold">Funding Requirement &amp; Proposal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold w-1/4">Fund Required</td>
                    <td className="border-b border-gray-400 px-3 py-2">
                      {isEditMode ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            value={d.fundingRequirement?.amountRequired || ''}
                            onChange={(e) => handleNestedChange('fundingRequirement', 'amountRequired', Number(e.target.value))}
                            className="w-32 px-2 py-1 text-xs border border-blue-300 bg-blue-50/50 rounded"
                          /> Cr
                        </div>
                      ) : (
                        formatCr(d.fundingRequirement?.amountRequired)
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">Purpose</td>
                    <td className="border-b border-gray-400 px-3 py-2">
                      {renderEditableCell(d.fundingRequirement?.purpose, (v) => handleNestedChange('fundingRequirement', 'purpose', v))}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold">Facility Type</td>
                    <td className="border-b border-gray-400 px-3 py-2">
                      {renderEditableCell(d.fundingRequirement?.facilityType, (v) => handleNestedChange('fundingRequirement', 'facilityType', v), 'e.g. Working Capital, Term Loan')}
                    </td>
                  </tr>
                  
                  {/* Facility 1 Details */}
                  <tr className="bg-gray-50/50">
                    <td colSpan={2} className="border-b border-gray-400 px-3 py-1 text-xs font-bold tracking-wider text-gray-500 uppercase">Facility-1 (Working Capital / Limit)</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold pl-6">Limit</td>
                    <td className="border-b border-gray-400 px-3 py-2">
                      {isEditMode ? (
                        <input 
                          type="number"
                          value={d.fundingRequirement?.facility1?.limit || ''}
                          onChange={(e) => handleNestedChange('fundingRequirement', 'facility1', { ...d.fundingRequirement?.facility1, limit: Number(e.target.value) })}
                          className="w-32 px-2 py-1 text-xs border border-blue-300 bg-blue-50/50 rounded"
                        />
                      ) : (
                        d.fundingRequirement?.facility1?.limit ? `INR ${d.fundingRequirement.facility1.limit} Cr` : '---'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold pl-6">Sub-limits</td>
                    <td className="border-b border-gray-400 px-3 py-2">
                      {renderEditableCell(d.fundingRequirement?.facility1?.subLimits, (v) => handleNestedChange('fundingRequirement', 'facility1', { ...d.fundingRequirement?.facility1, subLimits: v }))}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold pl-6">ROI Interest</td>
                    <td className="border-b border-gray-400 px-3 py-2">
                      {renderEditableCell(d.fundingRequirement?.facility1?.roi, (v) => handleNestedChange('fundingRequirement', 'facility1', { ...d.fundingRequirement?.facility1, roi: v }))}
                    </td>
                  </tr>

                  {/* Facility 2 Details */}
                  <tr className="bg-gray-50/50">
                    <td colSpan={2} className="border-b border-gray-400 px-3 py-1 text-xs font-bold tracking-wider text-gray-500 uppercase">Facility-2 (Term Loan / LAP)</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold pl-6">Limit</td>
                    <td className="border-b border-gray-400 px-3 py-2">
                      {isEditMode ? (
                        <input 
                          type="number"
                          value={d.fundingRequirement?.facility2?.limit || ''}
                          onChange={(e) => handleNestedChange('fundingRequirement', 'facility2', { ...d.fundingRequirement?.facility2, limit: Number(e.target.value) })}
                          className="w-32 px-2 py-1 text-xs border border-blue-300 bg-blue-50/50 rounded"
                        />
                      ) : (
                        d.fundingRequirement?.facility2?.limit ? `INR ${d.fundingRequirement.facility2.limit} Cr` : '---'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold pl-6">Security</td>
                    <td className="border-b border-gray-400 px-3 py-2">
                      {renderEditableTextArea(d.fundingRequirement?.facility2?.security, (v) => handleNestedChange('fundingRequirement', 'facility2', { ...d.fundingRequirement?.facility2, security: v }))}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-400 px-3 py-2 font-bold pl-6">Collateral</td>
                    <td className="border-b border-gray-400 px-3 py-2">
                      {renderEditableTextArea(d.fundingRequirement?.facility2?.collateral, (v) => handleNestedChange('fundingRequirement', 'facility2', { ...d.fundingRequirement?.facility2, collateral: v }))}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-gray-800 px-3 py-2 font-bold pl-6">Guarantee</td>
                    <td className="border-gray-800 px-3 py-2">
                      {renderEditableCell(d.fundingRequirement?.facility2?.guarantee, (v) => handleNestedChange('fundingRequirement', 'facility2', { ...d.fundingRequirement?.facility2, guarantee: v }))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PENDING INFORMATION TRACKER */}
            {missingFields.length > 0 && (
              <div className="border border-amber-300 bg-amber-50/80 p-4 rounded mt-4">
                <span className="text-xs uppercase font-sans font-bold text-amber-800 tracking-wider">Pending Information Tracker</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {missingFields.map((field, idx) => (
                    <span key={idx} className="bg-white border border-amber-200 text-amber-800 text-[10px] font-sans px-2.5 py-1 font-semibold rounded shadow-sm">
                      {field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* FOOTER STRIP */}
          <div className="flex justify-between items-center border-t-2 border-gray-800 pt-3 mt-10">
            <span className="text-xs text-gray-500 font-sans font-medium">DealOS · BankersKlub Style Teaser</span>
            <span className="text-xs text-gray-500 font-sans font-medium">Confidential</span>
          </div>

        </div>
      </div>
    </div>
  );
}

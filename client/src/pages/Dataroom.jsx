import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setCompany } from '../app/features/companySlice';
import api from '../configs/api';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  UploadCloud, 
  X, 
  Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dataroom() {
  const dispatch = useDispatch();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  
  // Upload modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('Audited Financials');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    'KYC', 
    'MIS & Provisional Financials', 
    'Audited Financials', 
    'Bank Statements', 
    'Debt Schedule and Sanction Letters', 
    'Ageing Details',
    'Company Profile',
    'Additional Documents'
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get('/dataroom');
      setDocuments(data || []);
      
      // Auto-expand all folders on initial load
      const cats = new Set((data || []).map(d => d.category || 'Uncategorized'));
      setExpandedFolders(cats);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (category) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }
      const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.doc'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error('Invalid file type. Please upload PDF, PNG, JPG, or Word files.');
        return;
      }
      setSelectedFile(file);
      toast.success(`Selected file: ${file.name}`);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', uploadCategory);

    try {
      // 1. Upload file to Cloudinary
      toast.loading('Uploading document to secure vault...', { id: 'upload' });
      const uploadRes = await api.post('/dataroom/upload', formData);
      const secureFileUrl = uploadRes.data.document.fileUrl;

      // 2. Trigger AI extraction on the uploaded file
      toast.loading('Extracting data lines via PROBE OCR...', { id: 'upload' });
      const aiRes = await api.post('/ai/extract-document', { 
        fileUrl: secureFileUrl, 
        category: uploadCategory 
      });

      // 3. Update Redux store (this makes the One-Pager refresh instantly!)
      if (aiRes.data.company) {
        dispatch(setCompany(aiRes.data.company));
      }

      toast.success('File uploaded and AI analysis complete!', { id: 'upload' });
      setIsModalOpen(false);
      setSelectedFile(null);
      fetchDocuments(); // Refresh dataroom list
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to complete upload and extraction';
      toast.error(msg, { id: 'upload' });
    } finally {
      setIsUploading(false);
    }
  };

  // Group documents by category
  const filteredDocs = documents.filter(doc => doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()));
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const cat = doc.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  return (
    <div className="max-w-[1400px] mx-auto h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Dataroom</h1>
          <div className="flex gap-2">
            <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1 rounded border border-purple-100">
              Active {documents.length}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 w-64 focus:outline-none"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 border border-transparent px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors shadow-sm cursor-pointer"
          >
            <UploadCloud size={16} /> Upload Data
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div className="col-span-6 pl-8">Data</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-4 text-right">Last Updated</div>
      </div>

      {/* Table Body - Grouped Folders */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-purple-600" size={18} />
            Loading secure vault...
          </div>
        ) : Object.keys(groupedDocs).length > 0 ? (
          Object.entries(groupedDocs)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, docs]) => {
              const isExpanded = expandedFolders.has(category);
              
              return (
                <div key={category} className="border-b border-gray-100">
                  {/* Folder Row */}
                  <div 
                    className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleFolder(category)}
                  >
                    <div className="col-span-6 flex items-center gap-2">
                      <button className="text-gray-400 hover:text-gray-700">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      {isExpanded ? <FolderOpen size={18} className="text-purple-500 fill-purple-50" /> : <Folder size={18} className="text-purple-500 fill-purple-50" />}
                      <span className="font-semibold text-gray-800 text-sm">{category}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full">New</span>
                    </div>
                    <div className="col-span-4 text-right text-xs text-gray-400">--</div>
                  </div>

                  {/* Document Rows inside Folder */}
                  {isExpanded && (
                    <div className="bg-white">
                      {docs.map((doc) => (
                        <div key={doc._id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center border-t border-gray-50 hover:bg-gray-50/50 transition-colors group">
                          <div className="col-span-6 pl-12 flex items-center gap-3">
                            <FileText size={16} className="text-gray-500" />
                            <a 
                              href={doc.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-gray-700 font-medium hover:text-purple-700 hover:underline cursor-pointer truncate max-w-md"
                            >
                              {doc.fileName}
                            </a>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">Processed</span>
                          </div>
                          <div className="col-span-4 text-right text-xs text-gray-500">
                            {new Date(doc.createdAt).toLocaleString('en-IN', {
                              hour: '2-digit', minute: '2-digit', hour12: true, 
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
          })
        ) : (
          <div className="p-12 text-center">
            <UploadCloud size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-900 font-medium mb-1">No documents found</p>
            <p className="text-sm text-gray-500">Upload files directly or via the PROBE agent to see them grouped here.</p>
          </div>
        )}
      </div>

      {/* UPLOAD MODAL POPUP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-transform scale-100">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <UploadCloud className="text-purple-600" size={18} />
                Upload New Document
              </h2>
              <button 
                onClick={() => {
                  if (!isUploading) {
                    setIsModalOpen(false);
                    setSelectedFile(null);
                  }
                }}
                disabled={isUploading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Document Category</label>
                <select 
                  value={uploadCategory} 
                  onChange={(e) => setUploadCategory(e.target.value)}
                  disabled={isUploading}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Select File</label>
                <div 
                  onClick={() => !isUploading && fileInputRef.current.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? 'border-purple-600 bg-purple-100/50 scale-102 shadow-md shadow-purple-100' 
                      : selectedFile 
                        ? 'border-purple-400 bg-purple-50/10' 
                        : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                    disabled={isUploading}
                  />
                  <UploadCloud className="mx-auto mb-2 text-gray-400" size={32} />
                  <p className="text-xs text-gray-600 font-medium">
                    {selectedFile ? selectedFile.name : 'Click to select or drag and drop file'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">PDF, PNG, JPG, or Word files up to 10MB</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedFile(null);
                  }}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      Upload &amp; Analyze
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCompany } from '../../app/features/companySlice';
import api from '../../configs/api';
import { Send, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatBox() {
  const dispatch = useDispatch(); 
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I am PROBE. Let us build your deal profile. What is the name of your company and how much debt capital are you looking for?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // NEW: Ref to trigger the hidden file input
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => scrollToBottom(), [messages]);

  // Load chat history on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const { data } = await api.get('/ai/chat-history');
        if (data && data.length > 0) {
          // Map to standard message fields (role & text)
          setMessages(data.map(m => ({ role: m.role, text: m.text })));
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    };
    fetchChatHistory();
  }, []);

  // Helper to save client-generated messages to the DB
  const saveMsg = async (role, text) => {
    try {
      await api.post('/ai/chat-message', { role, text });
    } catch (e) {
      console.error("Failed to save chat message:", e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/ai/probe-search', { message: userMessage });
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
      if (data.company) dispatch(setCompany(data.company));
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I had trouble processing that. Could you try again?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Handle File Upload & AI Extraction
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const userText = `Uploaded document: ${file.name}`;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    await saveMsg('user', userText);
    
    setIsLoading(true);

    try {
      // 1. Upload to local disk storage via your dataroom endpoint
      const formData = new FormData();
      formData.append('file', file);
      // Let's assume it's financials for now. You can make this dynamic later.
      formData.append('category', 'Audited Financials'); 

      const uploadRes = await api.post('/dataroom/upload', formData);

      const secureFileUrl = uploadRes.data.document.fileUrl;

      // 2. Send the URL to the AI Extraction endpoint
      const botText1 = 'Analyzing document and extracting financials...';
      setMessages(prev => [...prev, { role: 'bot', text: botText1 }]);
      await saveMsg('bot', botText1);
      
      const aiRes = await api.post('/ai/extract-document', { 
        fileUrl: secureFileUrl, 
        category: 'Audited Financials' 
      });

      // 3. Update Redux and Chat
      if (aiRes.data.company) dispatch(setCompany(aiRes.data.company));
      
      const botText2 = 'Document successfully analyzed! I have updated the One-Pager with the extracted data.';
      setMessages(prev => [...prev, { role: 'bot', text: botText2 }]);
      await saveMsg('bot', botText2);
      
      toast.success('Document data extracted!');

    } catch (error) {
      console.error(error);
      toast.error('Failed to process document');
      const botTextErr = 'I encountered an error while analyzing that document.';
      setMessages(prev => [...prev, { role: 'bot', text: botTextErr }]);
      await saveMsg('bot', botTextErr);
    } finally {
      setIsLoading(false);
      e.target.value = null; // Reset input
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-tl-none px-5 py-3 text-sm shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          {/* NEW: Hidden file input and click trigger */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current.click()}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Upload Document"
          >
            <Paperclip size={20} />
          </button>
          
          <input
            type="text"
            className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full px-4 py-2 text-sm transition-all"
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
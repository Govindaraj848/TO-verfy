
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SessionStats } from '../types';

interface HeaderProps {
  stats: SessionStats;
  references: string[];
  users: { name: string, group: string }[];
  selectedUser: string;
  onUserChange: (val: string) => void;
  onSync: () => void;
  onReferenceChange: (val: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  stats, 
  references, 
  users, 
  selectedUser, 
  onUserChange, 
  onSync, 
  onReferenceChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredReferences = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return references.filter(ref => ref.toLowerCase().includes(term));
  }, [references, searchTerm]);

  const handleSelect = (ref: string) => {
    onReferenceChange(ref);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  // Calculate progress percentage based on Scanned vs TO Qty
  const progressPercent = Math.min((stats.scannedQty / (stats.totalQty || 1)) * 100, 100);

  return (
    <div className="p-2 bg-gray-200 border-b-[2px] border-black">
      {/* Top Bar: User & Sync */}
      <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
        <div className={`flex items-center gap-1.5 p-1 neo-border neo-shadow transition-all ${!selectedUser ? 'bg-red-500' : 'bg-[#FFCC4D]'}`}>
          <div className="bg-black text-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter flex items-center gap-1.5">
            <i className="fas fa-user-circle"></i>
            OPERATOR
          </div>
          <select 
            value={selectedUser}
            onChange={(e) => onUserChange(e.target.value)}
            className="bg-transparent border-none font-black text-[10px] uppercase outline-none cursor-pointer text-black pr-2 min-w-[110px]"
          >
            <option value="">-- SELECT --</option>
            {users.map((u, i) => (
              <option key={i} value={u.name}>{u.name}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={onSync}
          className="bg-[#26C6DA] px-3 py-1 neo-border neo-shadow font-black text-black text-[9px] flex items-center gap-1.5 hover:brightness-105 active:translate-y-1 active:shadow-none transition-all"
        >
          <i className="fas fa-sync-alt text-black"></i> REFRESH
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* Reference Selection */}
        <div className="lg:col-span-4 flex flex-col relative z-50" ref={dropdownRef}>
           <div className="bg-[#4CAF50] neo-border border-b-0 p-0.5 flex flex-col items-center justify-center">
              <span className="font-black text-[8px] uppercase tracking-widest text-black mb-0.5">SEARCH REF</span>
              <div className="w-full bg-white neo-border px-1.5 py-1 flex items-center gap-1.5 mb-0.5">
                 <i className="fas fa-search text-gray-400 text-[10px]"></i>
                 <input 
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-black text-[10px] uppercase text-black placeholder:text-gray-300"
                    placeholder="ENTER REF..."
                    value={searchTerm}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
           {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full bg-white neo-border neo-shadow max-h-[200px] overflow-y-auto z-50">
                 {filteredReferences.length > 0 ? (
                    filteredReferences.map((ref) => (
                       <button
                          key={ref}
                          onClick={() => handleSelect(ref)}
                          className={`w-full text-left p-2 font-black text-[10px] uppercase border-b border-black last:border-0 transition-colors flex justify-between items-center group
                            ${stats.referenceNumber === ref ? 'bg-[#FFCC4D]' : 'hover:bg-gray-100'}`}
                       >
                          <span className="truncate mr-2">{ref}</span>
                          {stats.referenceNumber === ref && <i className="fas fa-check-circle text-black"></i>}
                       </button>
                    ))
                 ) : (
                    <div className="p-2 text-center font-black text-[8px] uppercase opacity-40 italic">No matches</div>
                 )}
              </div>
           )}
           {!isDropdownOpen && (
              <div onClick={() => setIsDropdownOpen(true)} className="bg-[#FFCC4D] neo-border p-1.5 cursor-pointer hover:brightness-105 transition-all flex justify-between items-center min-h-[30px]">
                 <span className="font-black text-[10px] uppercase truncate italic">{stats.referenceNumber || "SELECT SHIPMENT"}</span>
                 <i className="fas fa-chevron-down text-[7px] opacity-40"></i>
              </div>
           )}
        </div>

        {/* Outlet Name */}
        <div className="lg:col-span-3 bg-black p-0.5 neo-border neo-shadow flex flex-col">
          <div className="bg-[#FFA726] flex-1 flex flex-col p-1.5">
            <div className="flex justify-between items-start mb-0.5">
              <span className="bg-black text-white px-1 py-0.5 text-[7px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0">
                 <i className="fas fa-store text-[7px]"></i> OUTLET
              </span>
            </div>
            <div className="flex-1 flex items-center overflow-hidden">
              <h2 className="text-sm font-black tracking-tighter text-black uppercase truncate leading-tight italic">
                {stats.storeName}
              </h2>
            </div>
          </div>
        </div>

        {/* TO QTY Progress Bar Pill - Renamed from CR QTY as requested */}
        <div className="lg:col-span-5 flex items-center h-full min-h-[58px]">
          <div className="w-full h-full neo-border rounded-xl overflow-hidden neo-shadow bg-[#14532D] relative flex shadow-inner group">
            {/* Background Fill (Light Green Progress) */}
            <div 
              className="absolute top-0 left-0 h-full bg-[#22C55E] transition-all duration-500 ease-out border-r-[2px] border-black/40 shadow-[4px_0_10px_rgba(0,0,0,0.2)]" 
              style={{ width: `${progressPercent}%` }}
            ></div>
            
            {/* Content Overlay */}
            <div className="relative z-10 w-full flex items-center px-5 h-full">
               {/* Label Side */}
               <div className="flex items-center">
                  <span className="text-white font-black text-2xl tracking-tighter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] italic uppercase">
                    TO QTY
                  </span>
               </div>
               
               {/* Numbers Side */}
               <div className="ml-auto flex items-baseline text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                 <span className="text-5xl font-black italic tracking-tighter transition-all">
                   {stats.scannedQty}
                 </span>
                 <span className="text-2xl font-black opacity-60 ml-3 italic">
                   / {stats.totalQty}
                 </span>
               </div>
            </div>

            {/* Subtle gloss effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;


import React from 'react';
import { ScanItem } from '../types';

interface LogProps {
  logs: ScanItem[];
  onClear: () => void;
  onEnd: () => void;
}

const Log: React.FC<LogProps> = ({ logs, onClear, onEnd }) => {
  const lastLog = logs[0];
  const isError = lastLog?.status === 'ERROR';
  const hasInstruction = !!lastLog?.systemMessage && lastLog.systemMessage.trim() !== "";
  
  const alertBg = isError ? '#D32F2F' : (hasInstruction ? '#2E7D32' : '#F5F5F5');

  return (
    <div className="flex flex-col h-full neo-border bg-white overflow-hidden shadow-md">
      {/* Header - Compact */}
      <div className="bg-black text-white p-1.5 px-3 flex justify-between items-center border-b-2 border-black">
        <div className="flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest">
           <i className="fas fa-bolt text-yellow-400"></i> LIVE FEED
        </div>
        <button 
          onClick={onClear}
          className="bg-[#FFCC4D] text-black px-2 py-0.5 neo-border text-[7px] font-black uppercase hover:brightness-110 active:scale-95 transition-all"
        >
          CLEAR
        </button>
      </div>

      {/* Main Alert Area - Compacted */}
      <div className="flex-1 overflow-auto bg-[#F5F5F5] flex flex-col relative min-h-0">
         {logs.length > 0 ? (
           <div 
             style={{ backgroundColor: alertBg }}
             className="flex-1 flex flex-col items-center justify-center p-4 text-center text-white transition-colors duration-300"
           >
              {hasInstruction || isError ? (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-white text-black px-1.5 py-0.5 neo-border font-black text-[7px] uppercase tracking-widest mb-3 inline-block">
                    {isError ? 'ERROR' : 'INSTRUCTION'}
                  </div>
                  <div className="mb-4">
                    <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-white shadow-md mx-auto">
                       <i className={`fas ${isError ? 'fa-times text-red-600' : 'fa-check text-green-600'} text-lg`}></i>
                    </div>
                  </div>
                  <h2 className="font-black text-lg uppercase tracking-tighter leading-tight drop-shadow-md max-w-[200px] mx-auto">
                    {lastLog.systemMessage || 'COMPLETE'}
                  </h2>
                  <div className="mt-3 text-[8px] font-black opacity-70 font-mono tracking-widest bg-black/10 px-3 py-1 rounded-full inline-block">
                    {lastLog.barcode}
                  </div>
                </div>
              ) : (
                <div className="opacity-10 flex flex-col items-center">
                   <i className="fas fa-check-circle text-6xl mb-2"></i>
                   <p className="font-black text-[8px] uppercase tracking-widest">STANDBY</p>
                </div>
              )}
           </div>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center opacity-10">
              <i className="fas fa-barcode text-4xl mb-2"></i>
              <p className="font-black uppercase text-[8px] tracking-widest italic">Inventory Standby</p>
           </div>
         )}
         
         {/* Metadata Footer - Smaller fonts */}
         <div className="bg-white border-t-2 border-black p-2 space-y-1">
            <div className="flex justify-between items-center">
               <span className="text-[7px] font-black uppercase opacity-40">ITEM:</span>
               <span className="text-[8px] font-black uppercase truncate max-w-[140px] text-right">{lastLog?.productName || '---'}</span>
            </div>
            <div className="flex justify-between items-center">
               <span className="text-[7px] font-black uppercase opacity-40">TIME:</span>
               <span className="text-[7px] font-black uppercase opacity-40">{lastLog?.timestamp || '--:--:--'}</span>
            </div>
         </div>
      </div>

      {/* Final Summary Bar - Compact */}
      <div className="bg-black text-white p-1.5 px-3 flex justify-between items-center text-[7px] font-black uppercase border-t-2 border-black">
         <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
            HDW: OK
         </div>
         <div className="opacity-50">{new Date().toLocaleDateString('en-GB')}</div>
      </div>

      <button 
        onClick={onEnd}
        className="w-full bg-[#81C784] hover:bg-[#66BB6A] text-black font-black uppercase py-2.5 text-[10px] tracking-widest flex items-center justify-center gap-2 border-t-2 border-black active:translate-y-1 transition-all"
      >
        <i className="fas fa-check-circle text-sm"></i> SUMMARY
      </button>
    </div>
  );
};

export default Log;
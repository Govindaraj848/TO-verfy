
import React, { useState } from 'react';

interface ScannerProps {
  onScan: (barcode: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onScan(value.trim());
      setValue('');
    }
  };

  return (
    <div className="w-full neo-border mb-2 overflow-hidden">
      <div className="bg-[#455A64] text-white p-1 px-3 font-black uppercase flex items-center gap-2 border-b-2 border-black text-[9px] tracking-widest leading-tight">
        <i className="fas fa-expand"></i> READY TO SCAN
      </div>
      <form onSubmit={handleSubmit} className="relative bg-white group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]"></div>
        </div>
        <input 
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="INPUT BARCODE OR SCAN..."
          className="w-full p-2.5 pl-8 text-lg font-black placeholder:text-gray-300 placeholder:italic focus:outline-none uppercase tracking-tighter text-black"
          autoFocus
        />
      </form>
    </div>
  );
};

export default Scanner;
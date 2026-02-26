
import React from 'react';

interface ReportProps {
  data: any[];
  loading: boolean;
}

const Report: React.FC<ReportProps> = ({ data, loading }) => {
  // Enhanced helper to find value by name variants OR by column index
  const getVal = (row: any, targetKeys: string[], colIndex?: number) => {
    if (!row) return '';
    const keys = Object.keys(row);
    
    // 1. Try matching by name
    const foundKey = keys.find(k => 
      targetKeys.some(tk => k.trim().toLowerCase() === tk.trim().toLowerCase())
    );
    
    if (foundKey) return (row[foundKey] || '').toString().trim();
    
    // 2. Fallback to index if provided and name search failed
    if (colIndex !== undefined && keys[colIndex]) {
      return (row[keys[colIndex]] || '').toString().trim();
    }
    
    return '';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-black">
        <div className="w-10 h-10 border-[6px] border-black border-t-[#FFCC4D] rounded-full animate-spin"></div>
        <p className="font-black uppercase italic tracking-tighter text-xs">Loading Live Data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 bg-red-100 neo-border neo-shadow text-black text-center">
        <h2 className="font-black text-xl mb-1">NO DATA DETECTED</h2>
        <p className="font-bold text-xs">Ensure your Google Sheet is published to web as CSV.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center bg-[#FFCC4D] p-4 neo-border neo-shadow">
        <div>
          <h1 className="text-xl font-black text-black uppercase tracking-tighter leading-none">Uploaded Data Master</h1>
          <p className="text-black font-bold text-[10px] opacity-70">Source: Live Inventory Sheet</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-black text-white px-3 py-1 neo-border text-[9px] font-black uppercase flex items-center">
             {data.length} RECORDS
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white neo-border neo-shadow relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-black text-[#FFCC4D]">
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Design No</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Style</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Color</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Polish</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Size</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Brand</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Dummy 7</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Dummy 8</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Outlet Name</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Reference No</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Date</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Branch Name</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Item Name</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Combination ID</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap text-center">TOUT Qty</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Price</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">MRP</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap bg-[#FFCC4D] text-black">Barcode (Col 18)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b-[1px] border-black hover:bg-gray-50 transition-colors">
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['DESIGNNO', 'Design No'], 0)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['STYLE'], 1)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['COLOR'], 2)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['POLISH'], 3)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['SIZE'], 4)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['BRAND'], 5)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['DUMMY7'], 6)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['DUMMY8'], 7)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase truncate max-w-[120px]">{getVal(row, ['OUTLET NAME (Sent From)', 'Outlet Name'], 8)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['Transaction Reference Number', 'Reference No', 'REF'], 9)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['TRANSOUT DATE', 'Date'], 10)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['Branch Name (Received To)', 'Branch Name'], 11)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['Item Name', 'Name'], 12)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{getVal(row, ['Combination ID', 'Comb ID'], 13)}</td>
                <td className="p-2 border-r border-black font-black text-black text-xs text-center">{getVal(row, ['TOUT Qty', 'Qty'], 14)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px]">₹{getVal(row, ['Pur Price', 'Price'], 15)}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px]">₹{getVal(row, ['MRP'], 16)}</td>
                <td className="p-2 border-r border-black font-black text-black text-[10px] bg-yellow-50 font-mono">
                  {/* Specifically check Barcode variants or fallback to column 18 (index 17) */}
                  {getVal(row, ['Barcode Value', 'Barcode', 'Item Barcode', 'BARCODE'], 17)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Report;


import React, { useMemo } from 'react';
import { ScanItem, SessionStats } from '../types';

interface VerificationSummaryProps {
  logs: ScanItem[];
  stats: SessionStats;
  operator: string;
  uploadedData: any[]; // Added to calculate expected quantities
  onConfirm: () => void;
  onBack: () => void;
}

const VerificationSummary: React.FC<VerificationSummaryProps> = ({ logs, stats, operator, uploadedData, onConfirm, onBack }) => {
  // 1. Calculate Expected Quantities for this reference
  const auditData = useMemo(() => {
    const expectedMap: Record<string, { name: string; expected: number; scanned: number }> = {};

    // Filter master data for this specific reference
    uploadedData
      .filter(row => row['Transaction Reference Number'] === stats.referenceNumber)
      .forEach(row => {
        const barcode = (row['Barcode Value'] || '').toString().trim();
        const qty = parseInt(row['TOUT Qty'], 10) || 0;
        const name = (row['Item Name'] || 'Unknown Item').toString().trim();

        if (!expectedMap[barcode]) {
          expectedMap[barcode] = { name, expected: 0, scanned: 0 };
        }
        expectedMap[barcode].expected += qty;
      });

    // Count actual scans from logs
    logs.filter(l => l.status === 'SUCCESS').forEach(log => {
      const barcode = log.barcode.trim();
      if (!expectedMap[barcode]) {
        // This is a barcode that wasn't even in the expected list (Pure Excess)
        expectedMap[barcode] = { name: log.productName || 'Unknown', expected: 0, scanned: 0 };
      }
      expectedMap[barcode].scanned += 1;
    });

    return Object.entries(expectedMap).map(([barcode, data]) => ({
      barcode,
      ...data,
      variance: data.scanned - data.expected
    }));
  }, [logs, uploadedData, stats.referenceNumber]);

  // Totals for top cards
  const totalExpected = auditData.reduce((sum, item) => sum + item.expected, 0);
  const totalScanned = auditData.reduce((sum, item) => sum + item.scanned, 0);
  const shortItems = auditData.filter(item => item.variance < 0).length;
  const excessItems = auditData.filter(item => item.variance > 0).length;
  const matchedItems = auditData.filter(item => item.variance === 0 && item.expected > 0).length;

  return (
    <div className="flex flex-col h-full gap-4 text-black animate-in fade-in zoom-in-95 duration-300">
      {/* Top Header */}
      <div className="bg-black text-white p-4 lg:p-6 neo-border neo-shadow flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter leading-none italic">Verification Audit</h1>
          <p className="text-[10px] font-black uppercase opacity-60 mt-1 tracking-[0.2em]">Operator: {operator} | Ref: {stats.referenceNumber}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="bg-white text-black px-4 py-2 neo-border font-black text-xs uppercase hover:bg-gray-200 transition-all">
            <i className="fas fa-arrow-left mr-2"></i> Resume Scanning
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Left Column: Summary Stats */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <div className="bg-[#FFCC4D] p-5 neo-border neo-shadow text-center">
             <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Session Progress</span>
             <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-5xl font-black italic">{totalScanned}</span>
                <span className="text-xl font-bold opacity-40">/ {totalExpected}</span>
             </div>
             <div className="w-full bg-black/10 h-2 mt-3 neo-border overflow-hidden">
                <div 
                  className="bg-black h-full transition-all duration-500" 
                  style={{ width: `${Math.min((totalScanned/totalExpected)*100, 100)}%` }}
                ></div>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 neo-border neo-shadow flex flex-col">
               <span className="text-[8px] font-black uppercase opacity-40">Matched</span>
               <span className="text-xl font-black text-green-600">{matchedItems}</span>
            </div>
            <div className="bg-white p-3 neo-border neo-shadow flex flex-col">
               <span className="text-[8px] font-black uppercase opacity-40">Mismatch</span>
               <span className="text-xl font-black text-red-600">{shortItems + excessItems}</span>
            </div>
          </div>

          <div className="bg-[#81C784] p-3 neo-border neo-shadow flex justify-between items-center">
             <span className="text-[9px] font-black uppercase">Shortage (Missing)</span>
             <span className="text-lg font-black">{shortItems} Items</span>
          </div>

          <div className="bg-[#4FC3F7] p-3 neo-border neo-shadow flex justify-between items-center">
             <span className="text-[9px] font-black uppercase">Excess (Extra)</span>
             <span className="text-lg font-black">{excessItems} Items</span>
          </div>

          <div className="mt-auto bg-black text-white p-5 neo-border neo-shadow flex flex-col gap-3">
             <h4 className="font-black uppercase text-xs border-b border-white/20 pb-2">Final Action</h4>
             <p className="text-[8px] font-bold uppercase opacity-50 italic">Pushing to Master will update the central inventory with these verified quantities.</p>
             <button 
                onClick={onConfirm}
                className="w-full bg-[#FFCC4D] text-black py-3 neo-border font-black uppercase text-xs tracking-widest hover:brightness-110 active:translate-y-1 transition-all"
             >
                CONFIRM & PUSH
             </button>
          </div>
        </div>

        {/* Right Column: Detailed Audit Table */}
        <div className="lg:col-span-3 bg-white neo-border neo-shadow flex flex-col min-h-0">
          <div className="bg-gray-100 p-3 border-b-2 border-black font-black uppercase text-[10px] tracking-widest flex justify-between items-center">
             <span>Audit Breakdown</span>
             <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> <span className="text-[8px]">MATCH</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> <span className="text-[8px]">SHORT</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> <span className="text-[8px]">EXCESS</span></div>
             </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b-2 border-black">
                <tr className="text-[9px] font-black uppercase bg-gray-50">
                  <th className="p-3 border-r border-black/5">Item / Barcode</th>
                  <th className="p-3 border-r border-black/5 text-center">Expected</th>
                  <th className="p-3 border-r border-black/5 text-center">Actual</th>
                  <th className="p-3 border-r border-black/5 text-center">Diff</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {auditData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center opacity-20 font-black uppercase italic">No session data found</td>
                  </tr>
                ) : (
                  auditData.map((item, i) => {
                    const isShort = item.variance < 0;
                    const isExcess = item.variance > 0;
                    const isMatch = item.variance === 0;

                    let statusText = "MATCHED";
                    let rowColor = "bg-white";
                    let badgeColor = "bg-green-500";

                    if (isShort) {
                      statusText = "SHORT";
                      rowColor = "bg-red-50";
                      badgeColor = "bg-red-500";
                    } else if (isExcess) {
                      statusText = "EXCESS";
                      rowColor = "bg-blue-50";
                      badgeColor = "bg-blue-500";
                    }

                    return (
                      <tr key={i} className={`border-b border-black/5 hover:bg-gray-100 transition-colors ${rowColor}`}>
                        <td className="p-3 border-r border-black/5">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase truncate max-w-[200px]">{item.name}</span>
                              <span className="text-[8px] font-bold opacity-40 font-mono tracking-tighter">{item.barcode}</span>
                           </div>
                        </td>
                        <td className="p-3 border-r border-black/5 text-center font-black text-xs opacity-40">{item.expected}</td>
                        <td className="p-3 border-r border-black/5 text-center font-black text-sm">{item.scanned}</td>
                        <td className={`p-3 border-r border-black/5 text-center font-black text-xs ${item.variance !== 0 ? 'underline decoration-2' : ''}`}>
                          {item.variance > 0 ? `+${item.variance}` : item.variance}
                        </td>
                        <td className="p-3 text-right">
                           <span className={`${badgeColor} text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest`}>
                              {statusText}
                           </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationSummary;

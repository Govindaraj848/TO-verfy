
import React, { useState, useEffect, useRef } from 'react';
import { ScanItem, SessionStats } from '../types';

const DiscountFlower = ({ color, size = 64 }: { color: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg">
    <circle cx="50" cy="25" r="20" fill={color} />
    <circle cx="75" cy="37.5" r="20" fill={color} />
    <circle cx="75" cy="62.5" r="20" fill={color} />
    <circle cx="50" cy="75" r="20" fill={color} />
    <circle cx="25" cy="62.5" r="20" fill={color} />
    <circle cx="25" cy="37.5" r="20" fill={color} />
    <circle cx="50" cy="50" r="15" fill="white" />
  </svg>
);

const getDiscountColor = (discount: number, type?: string) => {
  const isSilver = type?.toLowerCase() === 'silver';
  if (isSilver && discount === 30) return '#0000FF'; // Blue
  if (discount === 30) return '#2E7D32'; // Green
  if (discount === 20) return '#FDD835'; // Yellow
  if (discount === 40) return '#FF5722'; // Orange
  return '#8E24AA'; // Default purple
};

import Scanner from './Scanner';
import Log from './Log';

interface DashboardProps {
  logs: ScanItem[];
  stats: SessionStats;
  onScan: (barcode: string) => void;
  onClearLogs: () => void;
  onEndScan: () => void;
  onUpdateCondition: (logId: string, condition: string) => void;
  uploadedData: any[];
  sessionCounts: Record<string, number>;
  isSaving: boolean;
  selectedUser: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  logs, 
  stats, 
  onScan, 
  onClearLogs, 
  onEndScan, 
  onUpdateCondition,
  uploadedData,
  selectedUser
}) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [viewingDesignImage, setViewingDesignImage] = useState(false);
  const [conditionInput, setConditionInput] = useState("");
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [showMrpPopup, setShowMrpPopup] = useState(false);
  
  // Zoom logic states
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-trigger popups when top log changes
  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[0];
      setSelectedImageId(latestLog.id);
      
      // Check for MRP Mismatch FIRST (Higher priority)
      if (latestLog.isMrpMismatch) {
        setShowMrpPopup(true);
        setShowDiscountPopup(false); // Close other if both exist (unlikely)
      } 
      // Then check for Discount/Slab
      else if (latestLog.isDiscount) {
        setShowDiscountPopup(true);
        setShowMrpPopup(false);
        const timer = setTimeout(() => setShowDiscountPopup(false), 3000);
        return () => clearTimeout(timer);
      } else {
        setShowMrpPopup(false);
        setShowDiscountPopup(false);
      }
    }
  }, [logs[0]?.id]);

  const getFlexibleValue = (obj: any, targetKeys: string[], colIndex?: number) => {
    if (!obj) return '';
    const keys = Object.keys(obj);
    const foundKey = keys.find(k => 
      targetKeys.some(tk => k.trim().toLowerCase() === tk.trim().toLowerCase())
    );
    if (foundKey) return (obj[foundKey] || '').toString().trim();
    if (colIndex !== undefined && keys[colIndex]) return (obj[keys[colIndex]] || '').toString().trim();
    return '';
  };

  const getProductData = (logItem: ScanItem | undefined) => {
    if (!logItem || (logItem.status === 'ERROR' && !logItem.isMrpMismatch)) return null;
    return uploadedData.find(row => {
      const barcode = getFlexibleValue(row, ['Barcode Value', 'Barcode'], 17);
      const ref = getFlexibleValue(row, ['Transaction Reference Number', 'Reference No', 'REF'], 9);
      return barcode === logItem.barcode && ref === stats.referenceNumber;
    });
  };

  const getImages = (data: any) => {
    if (!data) return { design: null, comb: null };
    const designNo = getFlexibleValue(data, ['DESIGNNO', 'Design No'], 0);
    const combId = getFlexibleValue(data, ['Combination ID', 'Comb ID'], 13);
    return {
      design: designNo ? `https://kushalshq.gofrugal.com/RayMedi_HQ/images/images_for_goFrugal/${designNo}.jpg` : null,
      comb: combId ? `https://kushals-hq-prod.s3.ap-south-1.amazonaws.com/images/${combId}.jpg` : null
    };
  };

  const activeLog = logs.find(l => l.id === selectedImageId) || logs[0];
  const activeProduct = getProductData(activeLog);
  const activeImages = getImages(activeProduct);
  const displayUrl = viewingDesignImage ? activeImages.design : activeImages.comb;

  // Extract relevant pricing for MRP popup
  const currentSystemMrp = activeProduct ? getFlexibleValue(activeProduct, ['MRP'], 16) : '---';
  const designNo = activeProduct ? getFlexibleValue(activeProduct, ['DESIGNNO', 'Design No'], 0) : '';
  const actualMasterMrp = activeLog?.apiData?.currentMrp != null ? activeLog.apiData.currentMrp.toString() : '---';

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !displayUrl) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;

    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${displayUrl})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '300%',
      backgroundRepeat: 'no-repeat',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 10,
      pointerEvents: 'none',
      border: '1px solid black'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  const handleConditionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeLog && activeLog.status !== 'ERROR' && conditionInput.trim()) {
      onUpdateCondition(activeLog.id, conditionInput.trim());
      setConditionInput("");
    }
  };

  const openImageInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayUrl) window.open(displayUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative text-black overflow-hidden">
      
      {/* MRP Mismatch Popup Modal */}
      {showMrpPopup && activeLog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setShowMrpPopup(false)}>
           <div className="bg-red-600 neo-border neo-shadow p-8 max-w-lg w-full text-center text-white transform animate-in zoom-in-95 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute inset-0 opacity-10 pointer-events-none rotate-45 scale-150">
                <div className="w-full h-8 bg-black mb-4"></div>
                <div className="w-full h-8 bg-black mb-4"></div>
                <div className="w-full h-8 bg-black mb-4"></div>
              </div>

              <div className="relative z-10">
                <div className="bg-black text-[#FFCC4D] inline-block px-6 py-2 neo-border font-black uppercase text-sm mb-6 tracking-widest italic">
                  PRICE DISCREPANCY DETECTED
                </div>
                
                <div className="mb-6">
                  <i className="fas fa-exclamation-triangle text-7xl text-white mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"></i>
                </div>

                <h2 className="text-4xl font-black italic tracking-tighter mb-4 leading-none uppercase">
                  MRP not changed pls Hand Over to Store Support team
                </h2>

                <div className="w-full h-[3px] bg-white neo-border my-6"></div>
                
                <div className="flex flex-col gap-2 mb-8">
                  {/* Added Actual MRP Comparison Rows */}
                  <div className={`grid ${activeLog.apiData ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                    <div className="bg-black/40 p-3 neo-border flex flex-col items-start">
                       <span className="text-[7px] font-black uppercase opacity-60">UPLOADED MRP:</span>
                       <span className="text-xl font-black italic line-through opacity-50">₹{currentSystemMrp}</span>
                    </div>
                    <div className="bg-white p-3 neo-border flex flex-col items-start text-black">
                       <span className="text-[7px] font-black uppercase opacity-60">MASTER MRP:</span>
                       <span className="text-2xl font-black italic text-red-600">₹{actualMasterMrp}</span>
                    </div>
                    {activeLog.apiData && (
                      <div className="bg-[#FFCC4D] p-3 neo-border flex flex-col items-start text-black">
                         <span className="text-[7px] font-black uppercase opacity-60">API MRP:</span>
                         <span className="text-2xl font-black italic text-black">₹{activeLog.apiData.currentMrp}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center bg-black/20 p-3 neo-border">
                    <span className="font-black text-[10px] uppercase opacity-60">DESIGN NO:</span>
                    <span className="font-black text-lg italic">{designNo}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/20 p-3 neo-border">
                    <span className="font-black text-[10px] uppercase opacity-60">BARCODE:</span>
                    <span className="font-mono text-sm tracking-widest">{activeLog.barcode}</span>
                  </div>

                  {activeLog.isDiscount && activeLog.apiData && (
                    <div className="flex justify-between items-center bg-[#8E24AA] p-3 neo-border text-white mt-2 relative overflow-hidden">
                      <div className="flex flex-col items-start z-10">
                        <span className="font-black text-[10px] uppercase opacity-80">DISCOUNT DETECTED:</span>
                        <span className="font-black text-xl italic">
                          {activeLog.apiData.type?.toLowerCase() === 'silver' ? `${activeLog.apiData.discount} SILVER` : `${activeLog.apiData.discount}%`}
                        </span>
                      </div>
                      <div className="z-10">
                        <DiscountFlower 
                          color={getDiscountColor(activeLog.apiData.discount, activeLog.apiData.type)} 
                          size={40} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setShowMrpPopup(false)}
                  className="w-full bg-black text-[#FFCC4D] py-4 neo-border font-black uppercase text-sm hover:brightness-110 transition-all active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                >
                  ACKNOWLEDGE & REMOVE ITEM
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Discount/Slab Popup Modal */}
      {showDiscountPopup && activeLog && !showMrpPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowDiscountPopup(false)}>
           <div className="bg-[#8E24AA] neo-border neo-shadow p-8 max-w-md w-full text-center text-white transform animate-in zoom-in-95 duration-300 flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <div className="mb-6">
                <DiscountFlower 
                  color={getDiscountColor(activeLog.apiData.discount, activeLog.apiData.type)} 
                  size={120} 
                />
              </div>
              <div className="bg-[#FFCC4D] text-black inline-block px-4 py-1 neo-border font-black uppercase text-xs mb-4 tracking-widest">
                DISCOUNT DETECTED
              </div>
              <h2 className="text-5xl font-black italic tracking-tighter mb-2 leading-none">
                {activeLog.systemMessage?.split('|')[0].replace('DISCOUNT ITEM:', '').trim() || (activeLog.apiData?.type?.toLowerCase() === 'silver' ? `${activeLog.apiData.discount} SILVER` : 'SLAB ITEM')}
              </h2>
              <div className="w-full h-[1px] bg-white/20 my-4"></div>
              <p className="font-bold text-sm uppercase opacity-90 mb-4">{activeLog.productName}</p>
              <p className="font-mono text-xs opacity-60 tracking-widest mb-6">{activeLog.barcode}</p>
              <button 
                onClick={() => setShowDiscountPopup(false)}
                className="w-full bg-white text-black py-3 neo-border font-black uppercase text-xs hover:bg-gray-100 transition-all active:translate-y-1"
              >
                CONTINUE SCANNING
              </button>
           </div>
        </div>
      )}

      {!selectedUser && (
        <div className="absolute inset-0 z-[60] bg-gray-200/90 backdrop-blur-md flex items-center justify-center p-4 text-center">
          <div className="bg-white p-6 neo-border neo-shadow max-w-sm animate-bounce">
             <i className="fas fa-user-lock text-4xl text-red-600 mb-4"></i>
             <h2 className="text-xl font-black uppercase tracking-tighter mb-1">USER REQUIRED</h2>
             <p className="font-bold text-[9px] uppercase opacity-60 tracking-widest">Select Operator in Header</p>
          </div>
        </div>
      )}

      <Scanner onScan={onScan} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 flex-1 min-h-0">
        
        {/* COLUMN 1: IMAGE VIEW */}
        <div className="lg:col-span-4 flex flex-col neo-border bg-white overflow-hidden h-full shadow-inner">
           <div className="flex flex-1 min-h-0 overflow-hidden">
              
              {/* Sidebar Thumbnails */}
              <div className="w-12 border-r-[1.5px] border-black bg-[#F8FAFC] flex flex-col items-center py-2 gap-2 overflow-y-auto shrink-0">
                 <div className="text-[5px] font-black uppercase mb-1 opacity-40 text-center leading-none tracking-tighter">COMBO IMAGE</div>
                 
                 <button 
                   onClick={() => setViewingDesignImage(true)}
                   className={`w-9 h-9 rounded-lg border-2 overflow-hidden transition-all ${viewingDesignImage ? 'border-blue-600 ring-1 ring-blue-600' : 'border-black/10 hover:border-black/30'}`}
                 >
                   {activeImages.design && <img src={activeImages.design} className="w-full h-full object-cover" alt="Design" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                   {!activeImages.design && <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[5px] font-black">NA</div>}
                 </button>

                 <button 
                   onClick={() => setViewingDesignImage(false)}
                   className={`w-9 h-9 rounded-lg border-2 overflow-hidden transition-all ${!viewingDesignImage ? 'border-blue-600 ring-1 ring-blue-600' : 'border-black/10 hover:border-black/30'}`}
                 >
                   {activeImages.comb && <img src={activeImages.comb} className="w-full h-full object-cover" alt="Combo" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                   {!activeImages.comb && <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[5px] font-black">NA</div>}
                 </button>

                 <div className="w-9 h-9 rounded-lg bg-gray-100 border border-black/5 opacity-40 shrink-0"></div>
                 <div className="w-9 h-9 rounded-lg bg-gray-100 border border-black/5 opacity-40 shrink-0"></div>
              </div>

              {/* Main Image View */}
              <div className="flex-1 flex flex-col relative bg-white">
                 <div className="flex justify-end p-1 absolute top-0 right-0 z-20 pointer-events-none">
                   <div className="bg-[#5C6BC0]/20 text-[#3F51B5] text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full border border-[#3F51B5]/20 backdrop-blur-sm tracking-widest">
                     ULTRA DETAIL VIEW
                   </div>
                 </div>

                 <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-hidden">
                    <div 
                      ref={containerRef}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      onClick={openImageInNewTab}
                      className="w-full h-full relative bg-white flex items-center justify-center overflow-hidden cursor-crosshair group"
                    >
                       {displayUrl ? (
                         <>
                          <img src={displayUrl} className="max-w-full max-h-full object-contain" alt="Preview" />
                          <div style={zoomStyle} className="shadow-2xl"></div>
                         </>
                       ) : (
                         <i className="fas fa-image text-3xl opacity-10"></i>
                       )}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-black text-white p-2 text-center text-[9px] font-black uppercase italic tracking-[0.1em] flex items-center justify-center gap-1.5 shrink-0">
              DESIGN: {designNo || '------'}
              <i className="fas fa-fingerprint text-[8px] opacity-40"></i>
           </div>
        </div>

        {/* COLUMN 2: ITEM DETAILS */}
        <div className="lg:col-span-5 flex flex-col neo-border bg-white overflow-hidden h-full shadow-md">
           <div className="p-1.5 border-b-2 border-black bg-[#F8FAFC] text-center font-black text-xs tracking-[0.2em] uppercase">
              {activeLog ? activeLog.barcode : '----------'}
           </div>

           <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                 <tbody>
                    {[
                      { l: 'ITEM NAME', v: getFlexibleValue(activeProduct, ['Item Name'], 12) },
                      { l: 'DESIGNNO', v: designNo },
                      { l: 'COMBINATION ID', v: getFlexibleValue(activeProduct, ['Combination ID'], 13) },
                      { l: 'STYLE', v: getFlexibleValue(activeProduct, ['STYLE'], 1) },
                      { l: 'COLOR', v: getFlexibleValue(activeProduct, ['COLOR'], 2) },
                      { l: 'POLISH', v: getFlexibleValue(activeProduct, ['POLISH'], 3) },
                      { l: 'SIZE', v: getFlexibleValue(activeProduct, ['SIZE'], 4) },
                      { l: 'BRAND', v: getFlexibleValue(activeProduct, ['BRAND'], 5) },
                      { l: 'UPLOADED MRP', v: `₹${currentSystemMrp}` },
                      { l: 'API MRP', v: activeLog?.apiData?.currentMrp != null ? `₹${activeLog.apiData.currentMrp}` : '---' },
                      { l: 'API DISCOUNT', v: activeLog?.apiData?.discount != null ? (activeLog.apiData.type?.toLowerCase() === 'silver' ? `${activeLog.apiData.discount} SILVER` : `${activeLog.apiData.discount}%`) : '---' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b-[1px] border-black">
                         <td className="p-1.5 px-3 border-r-2 border-black bg-gray-50 font-black text-[8px] uppercase tracking-wider w-[40%]">{row.l}</td>
                         <td className="p-1.5 px-3 font-black text-[10px] uppercase tracking-tight truncate flex items-center justify-between gap-2">
                           <span>{row.v || 'NA'}</span>
                           {row.l === 'API DISCOUNT' && activeLog?.apiData?.discount != null && activeLog.apiData.discount > 0 && (
                             <DiscountFlower 
                               color={getDiscountColor(activeLog.apiData.discount, activeLog.apiData.type)} 
                               size={16} 
                             />
                           )}
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="p-2.5 bg-gray-50 border-t-2 border-black">
              <div className="text-[7px] font-black uppercase mb-1 opacity-60 tracking-wider">UPDATE STATUS</div>
              <form onSubmit={handleConditionSubmit}>
                <div className="relative flex items-center bg-white neo-border p-2 focus-within:ring-1 ring-black">
                   <input 
                      type="text"
                      className="w-full font-black text-[9px] uppercase placeholder:text-gray-200 outline-none"
                      placeholder="SCAN STATUS..."
                      value={conditionInput}
                      onChange={(e) => setConditionInput(e.target.value)}
                   />
                </div>
              </form>
              <div className="flex justify-between items-center mt-1.5">
                 <div className="bg-black text-white px-2 py-0.5 text-[8px] font-black uppercase neo-border">
                   {activeLog?.condition || 'STANDARD (OK)'}
                 </div>
                 <div className="text-green-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-[7px] font-black uppercase">READY</span>
                 </div>
              </div>
           </div>
        </div>

        {/* COLUMN 3: LIVE FEED */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0">
          <Log logs={logs} onClear={onClearLogs} onEnd={onEndScan} />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

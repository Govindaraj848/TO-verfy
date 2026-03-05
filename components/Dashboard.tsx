import React, { useState, useEffect, useRef } from 'react';
import { ScanItem, SessionStats } from '../types';

const DiscountFlower = ({ color, size = 64 }: { color: string, size?: number }) => {
  const shadowClass = color === '#FFFFFF' ? '' : 'drop-shadow-lg';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={shadowClass}>
      <circle cx="50" cy="25" r="20" fill={color} />
      <circle cx="75" cy="37.5" r="20" fill={color} />
      <circle cx="75" cy="62.5" r="20" fill={color} />
      <circle cx="50" cy="75" r="20" fill={color} />
      <circle cx="25" cy="62.5" r="20" fill={color} />
      <circle cx="25" cy="37.5" r="20" fill={color} />
      <circle cx="50" cy="50" r="15" fill="white" />
    </svg>
  );
};

const getDiscountColor = (discount: number, type?: string): string => {
  const isSilver = type?.toLowerCase() === 'silver';
  if (isSilver && discount === 30) return '#0000FF';
  if (discount === 30) return '#2E7D32';
  if (discount === 20) return '#FDD835';
  if (discount === 40) return '#FF5722';
  return '#FFFFFF';
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
  const [conditionInput, setConditionInput] = useState('');
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [showMrpPopup, setShowMrpPopup] = useState(false);

  const zoomStyleRef = useRef<React.CSSProperties>({ display: 'none' });
  const [, forceZoomRender] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Reliable popup trigger: watch both id AND log length ──────────────
  const latestLogId = logs[0]?.id;
  const latestLogLen = logs.length;

  useEffect(() => {
    if (!latestLogId) return;

    const latestLog = logs[0];

    setSelectedImageId(latestLog.id);
    // Reset both first to ensure re-trigger even for same type back-to-back
    setShowMrpPopup(false);
    setShowDiscountPopup(false);

    // Small defer so state resets flush before showing new popup
    const t = setTimeout(() => {
      if (latestLog.isMrpMismatch) {
        setShowMrpPopup(true);
      } else if (latestLog.isDiscount && latestLog.apiData?.discount != null) {
        setShowDiscountPopup(true);
        const autoClose = setTimeout(() => setShowDiscountPopup(false), 3000);
        return () => clearTimeout(autoClose);
      }
    }, 50);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestLogId, latestLogLen]);

  const getFlexibleValue = (obj: any, targetKeys: string[], colIndex?: number): string => {
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
      comb: combId ? `https://kushals-hq-prod.s3.ap-south-1.amazonaws.com/images/${combId}.jpg` : null,
    };
  };

  const activeLog = logs.find(l => l.id === selectedImageId) || logs[0];
  const activeProduct = getProductData(activeLog);
  const activeImages = getImages(activeProduct);
  const displayUrl = viewingDesignImage ? activeImages.design : activeImages.comb;

  const currentSystemMrp = activeProduct ? getFlexibleValue(activeProduct, ['MRP'], 16) : '---';
  const designNo = activeProduct ? getFlexibleValue(activeProduct, ['DESIGNNO', 'Design No'], 0) : '';
  const actualMasterMrp = activeLog?.apiData?.currentMrp != null ? activeLog.apiData.currentMrp.toString() : '---';

  // Safe apiData helpers — prevents "cannot read property of undefined" crashes
  const apiDiscount = activeLog?.apiData?.discount ?? null;
  const apiType = activeLog?.apiData?.type ?? '';
  const apiCurrentMrp = activeLog?.apiData?.currentMrp ?? null;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !displayUrl) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    zoomStyleRef.current = {
      display: 'block',
      backgroundImage: `url(${displayUrl})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '300%',
      backgroundRepeat: 'no-repeat',
      position: 'absolute',
      top: 0, left: 0,
      width: '100%', height: '100%',
      zIndex: 10,
      pointerEvents: 'none',
      border: '1px solid black',
    };
    forceZoomRender(n => n + 1);
  };

  const handleMouseLeave = () => {
    zoomStyleRef.current = { display: 'none' };
    forceZoomRender(n => n + 1);
  };

  const handleConditionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeLog && activeLog.status !== 'ERROR' && conditionInput.trim()) {
      onUpdateCondition(activeLog.id, conditionInput.trim());
      setConditionInput('');
    }
  };

  const openImageInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayUrl) window.open(displayUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative text-gray-900 overflow-hidden bg-gray-50">

      {/* ── MRP Mismatch Popup ── */}
      {showMrpPopup && activeLog && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowMrpPopup(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full transform animate-in zoom-in-95 duration-300 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-6">
              <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Price Discrepancy Detected</h2>
            <p className="text-sm text-gray-600 mb-6">The scanned item's MRP doesn't match our system. Please hand over to Store Support team.</p>

            <div className="space-y-3 mb-8">
              <div className={`grid ${activeLog.apiData ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">MRP</div>
                  <div className="text-lg font-bold text-gray-900 line-through opacity-50">₹{currentSystemMrp}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="text-xs font-semibold text-red-600 uppercase mb-2 tracking-wider">Master MRP</div>
                  <div className="text-lg font-bold text-red-600">₹{actualMasterMrp}</div>
                </div>
                {activeLog.apiData && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-xs font-semibold text-blue-600 uppercase mb-2 tracking-wider">API MRP</div>
                    <div className="text-lg font-bold text-blue-600">₹{apiCurrentMrp}</div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Design No:</span>
                <span className="text-sm font-bold text-gray-900">{designNo}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Barcode:</span>
                <span className="font-mono text-xs tracking-widest text-gray-900">{activeLog.barcode}</span>
              </div>

              {/* Discount section inside MRP popup — only if discount also present */}
              {activeLog.isDiscount && apiDiscount != null && apiDiscount > 0 && (
                <div className="flex items-center gap-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 mt-4">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-purple-600 uppercase mb-1 tracking-wider">Discount Detected:</div>
                    <div className="text-lg font-bold text-purple-700">
                      {apiType.toLowerCase() === 'silver' ? `${apiDiscount} SILVER` : `${apiDiscount}%`}
                    </div>
                  </div>
                  <DiscountFlower color={getDiscountColor(apiDiscount, apiType)} size={40} />
                </div>
              )}
            </div>

            <button
              onClick={() => setShowMrpPopup(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
            >
              Acknowledge & Remove Item
            </button>
          </div>
        </div>
      )}

      {/* ── Discount / Slab Popup ── */}
      {showDiscountPopup && activeLog && !showMrpPopup && apiDiscount != null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowDiscountPopup(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform animate-in zoom-in-95 duration-300 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

            <div className="mb-6">
              <DiscountFlower color={getDiscountColor(apiDiscount, apiType)} size={100} />
            </div>

            <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold uppercase mb-4 tracking-wider">
              Discount Detected
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {activeLog.systemMessage?.split('|')[0].replace('DISCOUNT ITEM:', '').trim() ||
                (apiType.toLowerCase() === 'silver' ? `${apiDiscount} SILVER` : 'Slab Item')}
            </h2>

            <div className="w-full h-px bg-gray-200 my-4" />

            <p className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-2">{activeLog.productName}</p>
            <p className="font-mono text-xs text-gray-500 tracking-widest mb-6">{activeLog.barcode}</p>

            {/* Show discount % prominently */}
            <div className="bg-purple-50 rounded-xl py-4 mb-6 border border-purple-200">
              <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1">Discount</p>
              <p className="text-4xl font-black text-purple-700">
                {apiType.toLowerCase() === 'silver' ? `${apiDiscount} SILVER` : `${apiDiscount}%`}
              </p>
            </div>

            <button
              onClick={() => setShowDiscountPopup(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
            >
              Continue Scanning
            </button>
          </div>
        </div>
      )}

      {/* ── No user selected overlay ── */}
      {!selectedUser && (
        <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <i className="fas fa-user-lock text-3xl text-red-600"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase">User Required</h2>
            <p className="text-sm text-gray-600 uppercase tracking-wide">Select an operator in the header to begin</p>
          </div>
        </div>
      )}

      <Scanner onScan={onScan} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 px-4 pb-4">

        {/* COLUMN 1: IMAGE VIEW */}
        <div className="lg:col-span-4 flex flex-col rounded-xl bg-white overflow-hidden h-full shadow-md border border-gray-200">
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* Sidebar Thumbnails */}
            <div className="w-12 border-r border-gray-200 bg-gray-50 flex flex-col items-center py-2 gap-2 overflow-y-auto shrink-0">
              <div className="text-[5px] font-black uppercase mb-1 opacity-40 text-center leading-none tracking-tighter">COMBO IMAGE</div>

              <button
                onClick={() => setViewingDesignImage(true)}
                className={`w-9 h-9 rounded-lg border-2 overflow-hidden transition-all ${viewingDesignImage ? 'border-blue-600 ring-1 ring-blue-600' : 'border-black/10 hover:border-black/30'}`}
              >
                {activeImages.design
                  ? <img src={activeImages.design} className="w-full h-full object-cover" alt="Design" onError={e => (e.currentTarget.style.display = 'none')} />
                  : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[5px] font-black">NA</div>
                }
              </button>

              <button
                onClick={() => setViewingDesignImage(false)}
                className={`w-9 h-9 rounded-lg border-2 overflow-hidden transition-all ${!viewingDesignImage ? 'border-blue-600 ring-1 ring-blue-600' : 'border-black/10 hover:border-black/30'}`}
              >
                {activeImages.comb
                  ? <img src={activeImages.comb} className="w-full h-full object-cover" alt="Combo" onError={e => (e.currentTarget.style.display = 'none')} />
                  : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[5px] font-black">NA</div>
                }
              </button>

              <div className="w-9 h-9 rounded-lg bg-gray-100 border border-black/5 opacity-40 shrink-0" />
              <div className="w-9 h-9 rounded-lg bg-gray-100 border border-black/5 opacity-40 shrink-0" />
            </div>

            {/* Main Image View */}
            <div className="flex-1 flex flex-col relative bg-white">
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
                      <div style={zoomStyleRef.current} className="shadow-2xl" />
                    </>
                  ) : (
                    <i className="fas fa-image text-3xl opacity-10" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black text-white p-2 text-center text-[9px] font-black uppercase italic tracking-[0.1em] flex items-center justify-center gap-1.5 shrink-0">
            DESIGN: {designNo || '------'}
            <i className="fas fa-fingerprint text-[8px] opacity-40" />
          </div>
        </div>

        {/* COLUMN 2: ITEM DETAILS */}
        <div className="lg:col-span-5 flex flex-col rounded-xl bg-white overflow-hidden h-full shadow-md border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-blue-50 font-semibold text-sm text-blue-900">
            {activeLog ? activeLog.barcode : '——————————'}
          </div>

          <div className="flex-1 overflow-auto">
            <div className="flex h-full">
              {/* Left details (70%) */}
              <div className="flex-[4] divide-y divide-gray-200">
                {[
                  { l: 'Item Name', v: getFlexibleValue(activeProduct, ['Item Name'], 12) },
                  { l: 'Design No', v: designNo },
                  { l: 'Combination ID', v: getFlexibleValue(activeProduct, ['Combination ID'], 13) },
                  { l: 'Style', v: getFlexibleValue(activeProduct, ['STYLE'], 1) },
                  { l: 'Color', v: getFlexibleValue(activeProduct, ['COLOR'], 2) },
                  { l: 'Polish', v: getFlexibleValue(activeProduct, ['POLISH'], 3) },
                  { l: 'Size', v: getFlexibleValue(activeProduct, ['SIZE'], 4) },
                  { l: 'Brand', v: getFlexibleValue(activeProduct, ['BRAND'], 5) },
                  { l: 'MRP', v: `₹${currentSystemMrp}` },
                ].map((row, i) => (
                  <div key={i} className="px-7 py-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{row.l}</span>
                    <span className="text-lg lg:text-2xl font-bold text-gray-900 truncate ml-6">{row.v}</span>
                  </div>
                ))}
              </div>

              {/* Right column (30%) */}
              <div className="flex-[3] flex flex-col border-l border-gray-200 divide-y divide-gray-200">
                {/* Updated MRP */}
                <div className="flex-[3] flex flex-col items-center justify-center p-2">
                  <span className="text-[15px] font-semibold text-gray-700 uppercase tracking-wide">Updated MRP</span>
                  <span className="text-[30px] font-bold text-gray-900">
                    {apiCurrentMrp != null ? `₹${apiCurrentMrp}` : '—'}
                  </span>
                </div>

                {/* Discount Slab */}
                {apiDiscount != null && apiDiscount > 0 && (
                  <div className="flex-[7] flex flex-col items-center justify-center p-4">
                    <span className="text-[15px] font-semibold text-gray-700 uppercase tracking-wide">Discount Slab</span>
                    <span className="text-2xl font-bold text-gray-900 mb-2">
                      {apiType.toLowerCase() === 'silver' ? `${apiDiscount} SILVER` : `${apiDiscount}%`}
                    </span>
                    <DiscountFlower color={getDiscountColor(apiDiscount, apiType)} size={100} />
                  </div>
                )}
              </div>
            </div>
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
                  onChange={e => setConditionInput(e.target.value)}
                />
              </div>
            </form>
            <div className="flex justify-between items-center mt-1.5">
              <div className="bg-black text-white px-2 py-0.5 text-[8px] font-black uppercase neo-border">
                {activeLog?.condition || 'STANDARD (OK)'}
              </div>
              <div className="text-green-600 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
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
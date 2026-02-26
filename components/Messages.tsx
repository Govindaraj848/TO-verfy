
import React, { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';

const MESSAGES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRUKh6DcV6iB4B0LWtLbnGUHSyUwwGLOToZUZOCtEqwWtqpU87S6u7XvPVdBRAUM7LldE7dbs0DxE0h/pub?output=csv';

const Messages: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string>('');

  const getFlexibleValue = (obj: any, targetKeys: string[]) => {
    const foundKey = Object.keys(obj).find(k => 
      targetKeys.some(tk => k.trim().toLowerCase() === tk.trim().toLowerCase())
    );
    return foundKey ? (obj[foundKey] || '').toString().trim() : '';
  };

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    
    try {
      const fetchUrl = isManual ? `${MESSAGES_CSV_URL}&t=${Date.now()}` : MESSAGES_CSV_URL;
      const response = await fetch(fetchUrl);
      const csvString = await response.text();
      
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          setLoading(false);
          setIsSyncing(false);
          setLastSynced(new Date().toLocaleTimeString());
        },
        error: (err: any) => {
          setError(err.message);
          setLoading(false);
          setIsSyncing(false);
        }
      });
    } catch (err) {
      setError("Failed to fetch messages.");
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
      fetchData();
    }, 60000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-black">
        <div className="w-10 h-10 border-[6px] border-black border-t-[#FFCC4D] rounded-full animate-spin"></div>
        <p className="font-black uppercase italic tracking-tighter text-xs">Loading Messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-100 neo-border neo-shadow text-black">
        <h2 className="font-black text-xl mb-1 uppercase text-black">System Error</h2>
        <p className="font-bold text-xs text-black">{error}</p>
        <button 
          onClick={() => fetchData(true)}
          className="mt-4 bg-black text-white px-4 py-2 neo-border font-black uppercase text-[10px]"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 text-black">
      <div className="flex flex-wrap justify-between items-center bg-[#FFCC4D] p-4 neo-border neo-shadow gap-4">
        <div>
          <h1 className="text-xl font-black text-black uppercase tracking-tighter leading-none">Scanning Instructions</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-black font-bold text-[10px] opacity-70">Rules for partial matching (e.g. "Bangle" matches "Bangles Antique")</p>
            {lastSynced && (
              <span className="text-[9px] font-black bg-black/10 px-2 py-0.5 neo-border">
                LAST SYNC: {lastSynced}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden md:flex bg-white px-3 py-1 neo-border items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-[8px] font-black uppercase">
              {isSyncing ? 'Syncing...' : 'Autosync: ON'}
            </span>
          </div>
          
          <button 
            onClick={() => fetchData(true)}
            disabled={isSyncing}
            className={`bg-black text-[#FFCC4D] px-4 py-2 neo-border font-black uppercase text-[10px] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-95 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>}
            Force Sync
          </button>

          <a 
            href="https://docs.google.com/spreadsheets/d/1ONe0yTqTxxureMQpgXfdSmRSAEBe4sr0TOYsKz2iwN8/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-black px-4 py-2 neo-border font-black uppercase text-[10px] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            Edit Sheet <i className="fas fa-external-link-alt ml-1.5"></i>
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white neo-border neo-shadow relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-black text-[#FFCC4D]">
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Short Name (Partial)</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Size Filter</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Style Filter</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap">Log Color</th>
              <th className="p-3 border border-white font-black uppercase text-[9px] whitespace-nowrap w-full">Display Message</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const shortName = getFlexibleValue(row, ['Short name', 'ShortName']);
              const size = getFlexibleValue(row, ['Size']);
              const style = getFlexibleValue(row, ['STYLE', 'Style']);
              const message = getFlexibleValue(row, ['Message']);
              const color = getFlexibleValue(row, ['Color', 'Log Color']) || '#2E7D32';

              if (!shortName && !size && !style && !message) return null;

              return (
                <tr key={idx} className="border-b-[1px] border-black hover:bg-gray-50 transition-colors">
                  <td className="p-3 border-r border-black font-black text-black text-[10px] uppercase whitespace-nowrap">
                    <span className="bg-[#FFCC4D]/30 px-2 py-0.5 neo-border">{shortName || '---'}</span>
                  </td>
                  <td className="p-3 border-r border-black font-bold text-black text-[10px] uppercase whitespace-nowrap">{size || '-'}</td>
                  <td className="p-3 border-r border-black font-bold text-black text-[10px] uppercase whitespace-nowrap">{style || '-'}</td>
                  <td className="p-3 border-r border-black text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 neo-border shadow-sm" style={{ backgroundColor: color }}></div>
                      <span className="text-[8px] font-bold opacity-40 uppercase">{color}</span>
                    </div>
                  </td>
                  <td className="p-3 border-r border-black font-black text-black text-xs italic">{message}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-2 bg-gray-100 neo-border text-[9px] font-bold uppercase italic text-black/60">
        <span>* Matching Logic: Scanned Product Name must contain the "Short Name". Size/Style are optional exact filters.</span>
      </div>
    </div>
  );
};

export default Messages;

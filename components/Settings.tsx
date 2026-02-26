
import React, { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';

const SETTINGS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSczCcch_DjjOV5pdmHesVmBhZltCOeSC27gYxgBYpE59DrLUQ9SVJJupVXqOdb4aCosMWZdFnlOzDg/pub?output=csv';

const Settings: React.FC = () => {
  const [userData, setUserData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    try {
      // Use cache busting to ensure we get fresh data from Google Sheets
      const fetchUrl = `${SETTINGS_CSV_URL}${SETTINGS_CSV_URL.includes('?') ? '&' : '?'}t=${Date.now()}`;
      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvString = await response.text();
      
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (results) => {
          console.log("Settings Parsing Results:", results);
          
          // Process rows with fallback logic
          const processed = results.data.map((row: any) => {
            // 1. Try named headers (normalized to lowercase)
            // 2. Try common variants
            // 3. Fallback to column index if headers aren't found/matched
            const keys = Object.keys(row);
            
            const name = (
              row['user name'] || 
              row['name'] || 
              row['username'] || 
              row[keys[0]] || // Fallback to 1st column
              ''
            ).toString().trim();

            const group = (
              row['group'] || 
              row['user group'] || 
              row[keys[1]] || // Fallback to 2nd column
              'STAFF'
            ).toString().trim();

            return { name, group };
          }).filter(user => user.name.length > 0); // Remove empty rows

          setUserData(processed);
          setLoading(false);
          setIsSyncing(false);
        },
        error: (err) => {
          console.error("PapaParse Settings Error:", err);
          setLoading(false);
          setIsSyncing(false);
        }
      });
    } catch (err) {
      console.error("Failed to fetch settings data", err);
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-black">
        <div className="w-10 h-10 border-[6px] border-black border-t-[#2962FF] rounded-full animate-spin"></div>
        <p className="font-black uppercase italic tracking-tighter text-xs">Accessing User Database...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 text-black animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-[#2962FF] p-4 neo-border neo-shadow text-white">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter leading-none">System Settings</h1>
          <p className="text-white font-bold text-[10px] opacity-80">User Roles & Authorization</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchData(true)}
            disabled={isSyncing}
            className="bg-white text-black px-4 py-2 neo-border font-black uppercase text-[10px] hover:bg-gray-100 transition-all flex items-center gap-2 active:translate-y-0.5 disabled:opacity-50"
          >
            {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
            Refresh List
          </button>
          <a 
            href="https://docs.google.com/spreadsheets/d/131WAuESBlXDaqLLIEd5oTYOEOGBYXjiE0WK--xwIi04/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black text-[#FFCC4D] px-4 py-2 neo-border font-black uppercase text-[10px] hover:brightness-110 transition-all shadow-[2px_2px_0px_0px_rgba(255,204,77,0.3)] flex items-center gap-2"
          >
            <i className="fas fa-external-link-alt"></i> Edit Master Sheet
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* User List Panel */}
        <div className="bg-white neo-border neo-shadow flex flex-col min-h-[400px]">
          <div className="bg-black text-white p-3 font-black uppercase text-xs border-b-[3px] border-black flex justify-between items-center">
            <div className="flex items-center gap-2">
              <i className="fas fa-users text-[#FFCC4D]"></i> 
              <span>Authorized User Directory</span>
            </div>
            <span className="bg-[#FFCC4D] text-black px-2 py-0.5 rounded text-[8px] font-black">{userData.length} ACTIVE</span>
          </div>
          <div className="flex-1 overflow-auto">
            {userData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center gap-4">
                <i className="fas fa-user-slash text-black opacity-10 text-4xl"></i>
                <p className="font-black uppercase text-xs italic opacity-30">No User Records Detected</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-100 z-10 border-b-2 border-black">
                  <tr>
                    <th className="p-3 font-black uppercase text-[10px] border-r border-black/10">User name</th>
                    <th className="p-3 font-black uppercase text-[10px]">Group</th>
                  </tr>
                </thead>
                <tbody>
                  {userData.map((user, idx) => (
                    <tr key={idx} className="border-b border-black/5 hover:bg-blue-50 transition-colors group">
                      <td className="p-3 border-r border-black/10">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-gray-100 neo-border flex items-center justify-center group-hover:bg-black group-hover:text-[#FFCC4D] transition-colors shrink-0">
                            <i className="fas fa-user text-[10px]"></i>
                          </div>
                          <span className="font-black text-xs uppercase italic tracking-tight">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-block bg-black text-[#FFCC4D] text-[9px] font-black px-3 py-1 neo-border uppercase tracking-widest min-w-[60px] text-center">
                          {user.group}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* System Info Panel */}
        <div className="flex flex-col gap-4">
          <div className="bg-white neo-border neo-shadow p-6 flex-1">
            <h3 className="font-black uppercase text-sm border-b-2 border-black pb-2 mb-4 flex items-center gap-2">
              <i className="fas fa-server text-[#2962FF]"></i> Data Connectivity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 neo-border">
                <span className="text-[10px] font-black uppercase opacity-60">Database Source</span>
                <span className="text-[10px] font-black text-[#2962FF]">GOOGLE_SHEETS_V4</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 neo-border">
                <span className="text-[10px] font-black uppercase opacity-60">Last Successful Fetch</span>
                <span className="text-[10px] font-black">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 neo-border">
                <span className="text-[10px] font-black uppercase opacity-60">Sync Frequency</span>
                <span className="text-[10px] font-black">ON_DEMAND</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 neo-border border-dashed border-[#2962FF]">
               <h4 className="font-black text-[10px] uppercase mb-1 text-[#2962FF]">Developer Note:</h4>
               <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase">
                 If names aren't appearing correctly, ensure the "Publish to Web" settings in Google Sheets are set to "Entire Document" and "CSV". 
                 The system is currently mapping column 1 to Name and column 2 to Group.
               </p>
            </div>
          </div>

          <div className="bg-black text-white p-6 neo-border neo-shadow">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#FFCC4D] text-black flex items-center justify-center neo-border">
                   <i className="fas fa-lock text-xl"></i>
                </div>
                <div>
                  <h4 className="font-black uppercase text-xs tracking-tighter">Access Control</h4>
                  <p className="text-[9px] font-bold opacity-60 uppercase">Authorized Devices Only</p>
                </div>
             </div>
             <div className="bg-white/10 p-3 rounded font-mono text-[9px] break-all border border-white/20 italic text-blue-300">
                ACTIVE_LICENSE: KSH-STABLE-2024-PRO
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

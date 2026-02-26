
import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';

const SCAN_DATA_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRRzeitEiSK3kjtkAtrMGgusvXm5qicS0j4Q4Mr2oe0smMgI0ANSTBS2Edk8vouQ0LghEOVMW7d0BA3/pub?output=csv';

const ScanReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Date states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Calendar navigation state
  const [viewDate, setViewDate] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SCAN_DATA_CSV_URL}&t=${Date.now()}`);
      const csvString = await response.text();
      
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          setLoading(false);
        }
      });
    } catch (err) {
      console.error("Failed to fetch scan report", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parseRowDate = (row: any) => {
    const dateStr = row['date'] || row['DATE'];
    if (!dateStr) return null;
    // Assuming format like DD/MM/YYYY or YYYY-MM-DD
    const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
    if (parts.length !== 3) return null;
    
    // Attempt robust parse
    if (parts[0].length === 4) return new Date(parts[0], parseInt(parts[1]) - 1, parts[2]); // YYYY-MM-DD
    return new Date(parts[2], parseInt(parts[1]) - 1, parts[0]); // DD/MM/YYYY
  };

  const filteredData = useMemo(() => {
    if (!startDate && !endDate) return data;
    
    return data.filter(row => {
      const rowDate = parseRowDate(row);
      if (!rowDate) return false;
      
      if (startDate && rowDate < startDate) return false;
      if (endDate) {
        const adjustedEnd = new Date(endDate);
        adjustedEnd.setHours(23, 59, 59, 999);
        if (rowDate > adjustedEnd) return false;
      }
      return true;
    });
  }, [data, startDate, endDate]);

  const downloadFile = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFull = () => {
    const processedData = filteredData.map(row => ({
      ...row,
      'Barcode Value': `'${row['Barcode Value'] || ''}`
    }));
    const csv = Papa.unparse(processedData);
    downloadFile(csv, `full_scan_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportBarcodeQtyOnly = () => {
    const processedData = filteredData.map(row => ({
      'Barcode': `'${row['Barcode Value'] || ''}`,
      'Qty': row['TOUT Qty'] || '0'
    }));
    const csv = Papa.unparse(processedData);
    downloadFile(csv, `barcode_qty_only_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const renderCalendar = (monthOffset: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth() + monthOffset, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    
    const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
    const firstDay = new Date(year, date.getMonth(), 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, date.getMonth(), i));

    return (
      <div className="flex-1 min-w-[280px]">
        <div className="text-center font-black text-lg mb-4 text-black">{monthName} {year}</div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-[10px] font-black opacity-50 uppercase py-2">{d}</div>
          ))}
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            
            const isSelected = (startDate && day.getTime() === startDate.getTime()) || 
                             (endDate && day.getTime() === endDate.getTime());
            const isInRange = startDate && endDate && day > startDate && day < endDate;
            
            return (
              <button
                key={idx}
                onClick={() => {
                  if (!startDate || (startDate && endDate)) {
                    setStartDate(day);
                    setEndDate(null);
                  } else if (day < startDate) {
                    setStartDate(day);
                  } else {
                    setEndDate(day);
                  }
                }}
                className={`py-2 text-xs font-bold rounded-md transition-colors 
                  ${isSelected ? 'bg-[#2962FF] text-white' : ''}
                  ${isInRange ? 'bg-blue-100 text-blue-800' : ''}
                  ${!isSelected && !isInRange ? 'hover:bg-gray-100 text-black' : ''}`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-black">
        <div className="w-10 h-10 border-[6px] border-black border-t-[#2962FF] rounded-full animate-spin"></div>
        <p className="font-black uppercase italic tracking-tighter text-xs">Syncing Live Report...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 text-black relative">
      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white neo-border neo-shadow w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex p-8 gap-8 border-b border-gray-100 relative">
               <button 
                 onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                 className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full"
               >
                 <i className="fas fa-chevron-left text-gray-400"></i>
               </button>
               
               {renderCalendar(0)}
               <div className="w-[1px] bg-gray-200 self-stretch"></div>
               {renderCalendar(1)}

               <button 
                 onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                 className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full"
               >
                 <i className="fas fa-chevron-right text-gray-400"></i>
               </button>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end items-center gap-4">
               <button 
                 onClick={() => {
                   setStartDate(null);
                   setEndDate(null);
                   setShowDatePicker(false);
                 }}
                 className="text-gray-500 font-bold text-sm hover:text-black"
               >
                 Cancel
               </button>
               <button 
                 onClick={() => setShowDatePicker(false)}
                 className="bg-[#2962FF] text-white px-8 py-2 rounded-md font-bold text-sm neo-border neo-shadow-sm active:translate-y-0.5 active:shadow-none transition-all"
               >
                 Apply
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center bg-[#2962FF] p-4 neo-border neo-shadow text-white gap-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter leading-none text-white">Live Scan Inventory</h1>
          <p className="text-white font-bold text-[10px] opacity-80">
            {startDate ? `${startDate.toLocaleDateString()} - ${endDate ? endDate.toLocaleDateString() : '...'}` : 'Real-time status tracking from Google Sheets'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button 
             onClick={() => setShowDatePicker(true)}
             className="bg-white text-black px-4 py-2 neo-border font-black uppercase text-[10px] hover:bg-gray-100 transition-all flex items-center gap-2"
           >
             <i className="fas fa-calendar-alt"></i> 
             {startDate ? 'Edit Filter' : 'Filter by Date'}
           </button>
           
           {/* Barcode & Qty Only Export */}
           <button 
             onClick={handleExportBarcodeQtyOnly}
             className="bg-[#FFCC4D] text-black px-4 py-2 neo-border font-black uppercase text-[10px] hover:brightness-110 transition-all flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
           >
             <i className="fas fa-barcode"></i> Barcode & Qty
           </button>

           {/* Full Export */}
           <button 
             onClick={handleExportFull}
             className="bg-black text-[#FFCC4D] px-4 py-2 neo-border font-black uppercase text-[10px] hover:brightness-110 transition-all flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(255,204,77,0.3)]"
           >
             <i className="fas fa-file-download"></i> Full Report
           </button>

           <button 
             onClick={fetchData}
             className="bg-white text-black px-4 py-2 neo-border font-black uppercase text-[10px] hover:bg-gray-100 transition-all"
           >
             <i className="fas fa-sync-alt"></i>
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white neo-border neo-shadow relative">
        <table className="w-full text-left border-collapse min-w-[1500px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-black text-[#FFCC4D]">
              <th className="p-3 border border-white font-black uppercase text-[9px]">DESIGNNO</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">STYLE</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">COLOR</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">POLISH</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">SIZE</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">BRAND</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">DUMMY7</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">DUMMY8</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">OUTLET NAME</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">REF NO</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">ITEM NAME</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">COMB ID</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">QTY</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">BARCODE</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">DATE</th>
              <th className="p-3 border border-white font-black uppercase text-[9px]">TIME</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.slice().reverse().map((row, idx) => (
              <tr key={idx} className="border-b-[1px] border-black hover:bg-gray-50 transition-colors">
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{row['DESIGNNO']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{row['STYLE']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{row['COLOR']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{row['POLISH']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{row['SIZE']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{row['BRAND']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{row['DUMMY7']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{row['DUMMY8']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase truncate max-w-[120px]">{row['OUTLET NAME (Sent From)']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase font-mono">{row['Transaction Reference Number']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase truncate max-w-[150px]">{row['Item Name']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] uppercase">{row['Combination ID']}</td>
                <td className="p-2 border-r border-black font-black text-black text-xs text-center">{row['TOUT Qty']}</td>
                <td className="p-2 border-r border-black font-black text-black text-[10px] bg-gray-50">{row['Barcode Value']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] whitespace-nowrap">{row['date'] || row['DATE']}</td>
                <td className="p-2 border-r border-black font-bold text-black text-[10px] whitespace-nowrap">{row['Time'] || row['TIME']}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="p-12 text-center">
            <i className="fas fa-search text-4xl opacity-10 mb-4"></i>
            <p className="font-black uppercase italic opacity-30">No results for this date range.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanReport;

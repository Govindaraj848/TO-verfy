
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Report from './components/Report';
import ScanReport from './components/ScanReport';
import Messages from './components/Messages';
import Settings from './components/Settings';
import Slab from './components/Slab';
import NewMrp from './components/NewMrp';
import VerificationSummary from './components/VerificationSummary';
import { View, ScanItem, SessionStats } from './types';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-BYlw7iqdpRBBsQJlrpiXTwPZlRKML75A1WUlySjQemegKXZlFh7mPs0-isZMP1Aj1g/exec';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTV5Xz5moO83Bjfz1CkuhZlRxRcbKwMzsfHWsbL-Jx_0BtB8YZdOiohredKcYqLIlvwxjr3ZtgFE9LH/pub?output=csv';
const MESSAGES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRUKh6DcV6iB4B0LWtLbnGUHSyUwwGLOToZUZOCtEqwWtqpU87S6u7XvPVdBRAUM7LldE7dbs0DxE0h/pub?output=csv';
const SETTINGS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSczCcch_DjjOV5pdmHesVmBhZltCOeSC27gYxgBYpE59DrLUQ9SVJJupVXqOdb4aCosMWZdFnlOzDg/pub?output=csv';
const SLAB_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQPLbTy-mQfO-3bsLuOLG12uAdoDpYAml9_JCu_OuyoUNWr5EWewRWaEJpJh7jfXh8YE2L03bRN6RHT/pub?output=csv';
const NEW_MRP_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3XFPHlheyoOAIUvlFEefe0Ld97ZQ8SpL9zEsu4OURHH2EGyT_TAxiTVlj9MYlvZfktrrvrd0ehDMo/pub?output=csv';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [messagesData, setMessagesData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<{name: string, group: string}[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [logs, setLogs] = useState<ScanItem[]>([]);
  
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [sessionId, setSessionId] = useState<string>(Math.random().toString(36).substring(7));
  
  const [selectedReference, setSelectedReference] = useState<string>('');
  const [scannedCount, setScannedCount] = useState(0);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, msgRes, userRes] = await Promise.all([
          fetch(CSV_URL),
          fetch(MESSAGES_CSV_URL),
          fetch(SETTINGS_CSV_URL)
        ]);
        
        const invCsv = await invRes.text();
        const msgCsv = await msgRes.text();
        const userCsv = await userRes.text();

        Papa.parse(userCsv, {
          header: true,
          transformHeader: (h) => h.trim().toLowerCase(),
          complete: (results) => {
            const filtered = results.data.map((row: any) => {
              const keys = Object.keys(row);
              const name = (row['user name'] || row['name'] || row[keys[0]] || '').toString().trim();
              const group = (row['group'] || row[keys[1]] || '').toString().trim().toUpperCase();
              return { name, group };
            }).filter(u => u.name && u.group === 'TO');
            setUsersData(filtered);
          }
        });

        Papa.parse(invCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (invResults) => {
            setUploadedData(invResults.data);
            if (invResults.data.length > 0) {
              const firstRef = getFlexibleValue(invResults.data[0], ['Transaction Reference Number', 'Reference No', 'REF'], 9);
              setSelectedReference(firstRef || '');
            }
          },
        });

        Papa.parse(msgCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (msgResults) => {
            setMessagesData(msgResults.data);
          },
        });

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const referenceNumbers = useMemo(() => {
    const refs = uploadedData.map(row => getFlexibleValue(row, ['Transaction Reference Number', 'Reference No', 'REF'], 9)).filter(Boolean);
    return Array.from(new Set(refs));
  }, [uploadedData]);

  const currentStats = useMemo(() => {
    const matchingRows = uploadedData.filter(row => getFlexibleValue(row, ['Transaction Reference Number', 'Reference No', 'REF'], 9) === selectedReference);
    const storeName = matchingRows.length > 0 ? getFlexibleValue(matchingRows[0], ['OUTLET NAME (Sent From)', 'Outlet Name'], 8) : 'N/A';
    const totalQty = matchingRows.reduce((sum, row) => sum + (parseInt(getFlexibleValue(row, ['TOUT Qty', 'Qty'], 14), 10) || 0), 0);

    return {
      scannedQty: scannedCount,
      totalQty: totalQty,
      referenceNumber: selectedReference,
      storeName: storeName
    };
  }, [uploadedData, selectedReference, scannedCount]);

  const handleScan = useCallback(async (barcode: string) => {
    if (!selectedUser) {
      alert("PLEASE SELECT A USER FIRST");
      return;
    }

    let product = uploadedData.find(row => 
      getFlexibleValue(row, ['Barcode Value', 'Barcode', 'Item Barcode', 'BARCODE'], 17) === barcode && 
      getFlexibleValue(row, ['Transaction Reference Number', 'Reference No', 'REF'], 9) === selectedReference
    );

    let matchedMessage = "";
    let status: 'SUCCESS' | 'ERROR' = 'SUCCESS';
    let customColor = "";
    let isDiscount = false;
    let isMrpMismatch = false;
    let finalProduct = product;
    let apiData: any = undefined;

    // Extract Design Number from barcode or product
    let pDesignNo = "";
    if (product) {
      pDesignNo = getFlexibleValue(product, ['DESIGNNO', 'Design No'], 0);
    } else {
      // Simple extraction: take alphanumeric prefix or whole barcode
      const match = barcode.match(/^([a-zA-Z0-9]+)/);
      pDesignNo = match ? match[1] : barcode;
    }

    // Call External API for Design MRP Detail via local proxy to avoid CORS
    if (pDesignNo) {
      try {
        const apiRes = await fetch(`/api/proxy/design-mrp?designNumber=${pDesignNo}`);
        if (apiRes.ok) {
          const data = await apiRes.json();
          apiData = {
            oldMrp: data.oldMrp,
            discount: data.discount,
            currentMrp: data.currentMrp,
            type: data.type
          };
        }
      } catch (err) {
        console.error("Design MRP Proxy API Error:", err);
      }
    }

    if (!product) {
      const anyMatch = uploadedData.find(row => getFlexibleValue(row, ['Barcode Value', 'Barcode'], 17) === barcode);
      if (anyMatch) {
        status = 'ERROR';
        const otherRef = getFlexibleValue(anyMatch, ['Transaction Reference Number', 'Reference No', 'REF'], 9);
        matchedMessage = `REF NO. MISMATCH (EXPECTED: ${selectedReference}, GOT: ${otherRef})`;
      } else {
        status = 'ERROR';
        matchedMessage = "BARCODE NOT FOUND IN SYSTEM";
      }
    } else {
      const pName = getFlexibleValue(product, ['Item Name', 'Name'], 12).toUpperCase();
      const pSize = getFlexibleValue(product, ['SIZE'], 4).toUpperCase();
      const pStyle = getFlexibleValue(product, ['STYLE'], 1).toUpperCase();
      const pMrp = getFlexibleValue(product, ['MRP'], 16);

      // 1. MRP Validation Check (Using API Data)
      if (apiData && apiData.currentMrp !== undefined && apiData.currentMrp !== null) {
        const targetMrp = apiData.currentMrp.toString();
        if (targetMrp !== pMrp) {
          isMrpMismatch = true;
          status = 'ERROR'; 
          matchedMessage = "MRP not changed pls Hand Over to Store Support team";
        }
      }

      // 2. Check Standard Instructions
      if (!isMrpMismatch) {
        const messageMatch = messagesData.find(m => {
          const mShortName = getFlexibleValue(m, ['Short name', 'ShortName', 'Short Name']).toUpperCase().trim();
          const mSize = getFlexibleValue(m, ['Size']).toUpperCase().trim();
          const mStyle = getFlexibleValue(m, ['STYLE', 'Style']).toUpperCase().trim();
          if (!mShortName && !mSize && !mStyle) return false;
          const nameMatches = !mShortName || pName.includes(mShortName);
          const sizeMatches = !mSize || pSize === mSize;
          const styleMatches = !mStyle || pStyle === mStyle;
          return nameMatches && sizeMatches && styleMatches;
        });

        if (messageMatch) {
          matchedMessage = getFlexibleValue(messageMatch, ['Message']);
          customColor = getFlexibleValue(messageMatch, ['Color', 'Log Color']);
        }
      }

      // 3. Check Slab Master (Using API Data - Discount > 0)
      if (!isMrpMismatch && apiData && apiData.discount > 0) {
        const isSilver = apiData.type?.toLowerCase() === 'silver';
        const slabValue = isSilver ? `${apiData.discount} SILVER` : `${apiData.discount}%`;
        matchedMessage = matchedMessage 
          ? `DISCOUNT ITEM: ${slabValue} | ${matchedMessage}` 
          : `DISCOUNT ITEM: ${slabValue}`;
        customColor = "#8E24AA"; 
        isDiscount = true;
      }

      if (status === 'SUCCESS' && !isMrpMismatch) {
        saveToGoogleSheet(product);
      }
    }

    const newItem: ScanItem = {
      id: Math.random().toString(36).substr(2, 9),
      barcode,
      timestamp: new Date().toLocaleTimeString(),
      status: status,
      condition: "Standard (OK)",
      productName: finalProduct ? getFlexibleValue(finalProduct, ['Item Name', 'Name'], 12) : `Unknown Item`,
      systemMessage: matchedMessage,
      logColor: customColor,
      isDiscount: isDiscount,
      isMrpMismatch: isMrpMismatch,
      apiData: apiData
    };

    setLogs(prev => [newItem, ...prev].slice(0, 50)); 
    if (status === 'SUCCESS') {
      setScannedCount(prev => prev + 1);
      setSessionCounts(prev => ({
        ...prev,
        [barcode]: (prev[barcode] || 0) + 1
      }));
    }
  }, [uploadedData, messagesData, selectedReference, sessionId, selectedUser]);


  const saveToGoogleSheet = async (product: any, condition: string = "Standard (OK)") => {
    try {
      setIsSaving(true);
      const barcodeValue = getFlexibleValue(product, ['Barcode Value', 'Barcode'], 17);
      const barcodeToSave = barcodeValue.startsWith("'") ? barcodeValue : "'" + barcodeValue;
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          DESIGNNO: getFlexibleValue(product, ['DESIGNNO', 'Design No'], 0),
          STYLE: getFlexibleValue(product, ['STYLE'], 1),
          COLOR: getFlexibleValue(product, ['COLOR'], 2),
          POLISH: getFlexibleValue(product, ['POLISH'], 3),
          SIZE: getFlexibleValue(product, ['SIZE'], 4),
          BRAND: getFlexibleValue(product, ['BRAND'], 5),
          DUMMY7: getFlexibleValue(product, ['DUMMY7'], 6),
          DUMMY8: getFlexibleValue(product, ['DUMMY8'], 7),
          OUTLET: getFlexibleValue(product, ['OUTLET NAME (Sent From)', 'Outlet Name'], 8),
          REF: getFlexibleValue(product, ['Transaction Reference Number', 'Reference No', 'REF'], 9),
          NAME: getFlexibleValue(product, ['Item Name', 'Name'], 12),
          COMB: getFlexibleValue(product, ['Combination ID', 'Comb ID'], 13),
          CONDITION: condition,
          QTY: 1, 
          BARCODE: barcodeToSave,
          SESSION_ID: sessionId,
          OPERATOR: selectedUser
        })
      });
    } catch (e) {
      console.error("Error saving to sheet:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const onEndScan = useCallback(() => {
    if (logs.length === 0) return;
    setCurrentView(View.SUMMARY);
  }, [logs]);

  const finalizeSession = useCallback(async () => {
    if (isFinalizing) return;
    try {
      setIsFinalizing(true);
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          SESSION_ID: sessionId,
          OPERATOR: selectedUser
        })
      });
      await new Promise(resolve => setTimeout(resolve, 800));
      resetSession();
      setCurrentView(View.HOME);
    } catch (e) {
      console.error("Error finalizing session:", e);
    } finally {
      setIsFinalizing(false);
    }
  }, [sessionId, selectedUser, isFinalizing]);

  const resetSession = useCallback(() => {
    setLogs([]);
    setScannedCount(0);
    setSessionCounts({});
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  const handleUpdateCondition = useCallback(async (logId: string, newCondition: string) => {
    setLogs(prev => prev.map(item => 
      item.id === logId ? { ...item, condition: newCondition } : item
    ));
    const itemToUpdate = logs.find(l => l.id === logId);
    if (itemToUpdate && itemToUpdate.status === 'SUCCESS') {
      const product = uploadedData.find(row => 
        getFlexibleValue(row, ['Barcode Value', 'Barcode'], 17) === itemToUpdate.barcode &&
        getFlexibleValue(row, ['Transaction Reference Number', 'Reference No', 'REF'], 9) === selectedReference
      );
      if (product) {
        await saveToGoogleSheet(product, newCondition);
      }
    }
  }, [logs, uploadedData, sessionId, selectedUser, selectedReference]);

  const renderView = () => {
    switch(currentView) {
      case View.UPLOADED_DATA:
        return <Report data={uploadedData} loading={loading} />;
      case View.SCAN_REPORT:
        return <ScanReport />;
      case View.MESSAGES:
        return <Messages />;
      case View.SETTINGS:
        return <Settings />;
      case View.SLAB:
        return <Slab />;
      case View.NEW_MRP:
        return <NewMrp />;
      case View.SUMMARY:
        return (
          <VerificationSummary 
            logs={logs} 
            stats={currentStats} 
            operator={selectedUser} 
            uploadedData={uploadedData} 
            onConfirm={finalizeSession}
            onBack={() => setCurrentView(View.HOME)}
          />
        );
      case View.HOME:
      default:
        return (
          <Dashboard 
            logs={logs} 
            stats={currentStats} 
            onScan={handleScan} 
            onClearLogs={() => setLogs([])}
            onUpdateCondition={handleUpdateCondition}
            uploadedData={uploadedData}
            sessionCounts={sessionCounts}
            isSaving={isSaving || isFinalizing}
            onEndScan={onEndScan}
            selectedUser={selectedUser}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-200 overflow-hidden text-black relative">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 flex flex-col min-w-0">
        {currentView === View.HOME && (
          <Header 
            stats={currentStats} 
            references={referenceNumbers}
            users={usersData}
            selectedUser={selectedUser}
            onUserChange={setSelectedUser}
            onSync={() => window.location.reload()} 
            onReferenceChange={(val) => {
              setSelectedReference(val);
              resetSession();
            }}
          />
        )}
        <div className="flex-1 overflow-auto p-4">
          {renderView()}
        </div>
      </main>
      {(isSaving || isFinalizing) && (
        <div className="fixed bottom-4 right-4 bg-black text-[#FFCC4D] neo-border neo-shadow px-3 py-1.5 font-black text-[10px] uppercase flex items-center gap-2 animate-pulse z-[100]">
          <i className="fas fa-cloud-upload-alt"></i> {isFinalizing ? 'Updating Status...' : 'Saving Scan...'}
        </div>
      )}
    </div>
  );
};

export default App;

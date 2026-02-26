
import React, { useState } from 'react';

const Slab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/proxy/design-mrp?designNumber=${searchTerm.trim()}`);
      if (!response.ok) throw new Error("Design not found or API error");
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 text-black animate-in fade-in duration-300">
      <div className="flex flex-wrap justify-between items-center bg-[#8E24AA] p-4 neo-border neo-shadow text-white gap-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Slab / Discount Lookup</h1>
          <p className="font-bold text-[10px] opacity-70">Live API Data Verification</p>
        </div>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-center">
          <div className="bg-white neo-border p-1.5 flex items-center gap-2 w-[300px]">
            <i className="fas fa-search text-[10px] opacity-40 ml-1 text-black"></i>
            <input 
              type="text"
              placeholder="ENTER DESIGN NO..."
              className="bg-transparent border-none outline-none font-black text-[10px] uppercase w-full text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="bg-black text-[#FFCC4D] px-4 py-2 neo-border font-black uppercase text-[10px] hover:brightness-110 active:translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>}
            Lookup
          </button>
        </form>
      </div>

      <div className="flex-1 flex items-center justify-center bg-white neo-border neo-shadow relative p-8">
        {loading && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-[6px] border-black border-t-[#8E24AA] rounded-full animate-spin"></div>
            <p className="font-black uppercase italic text-xs">Querying Technoboost API...</p>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="text-center opacity-20">
            <i className="fas fa-search text-8xl mb-4"></i>
            <p className="font-black uppercase italic text-xl">Enter a Design Number to begin</p>
          </div>
        )}

        {error && (
          <div className="text-center text-red-600">
            <i className="fas fa-exclamation-circle text-6xl mb-4"></i>
            <p className="font-black uppercase italic text-xl">{error}</p>
          </div>
        )}

        {result && (
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-black text-white p-4 neo-border mb-4 flex justify-between items-center">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">{result.designNumber}</h2>
              <div className="bg-[#8E24AA] px-3 py-1 neo-border text-xs font-black uppercase">LIVE API DATA</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-6 neo-border flex flex-col items-center justify-center gap-2">
                <span className="text-[10px] font-black uppercase opacity-40">DISCOUNT PERCENTAGE</span>
                <span className="text-6xl font-black italic text-[#8E24AA]">{result.discount}%</span>
              </div>
              <div className="bg-gray-50 p-6 neo-border flex flex-col items-center justify-center gap-2">
                <span className="text-[10px] font-black uppercase opacity-40">ITEM TYPE</span>
                <span className="text-2xl font-black italic uppercase">{result.type || 'STANDARD'}</span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-[#8E24AA]/10 neo-border border-[#8E24AA] text-[#8E24AA] font-bold text-center uppercase text-xs">
              {result.discount > 0 ? 'THIS ITEM IS FLAGGED AS A DISCOUNTED SLAB ITEM' : 'THIS IS A FULL PRICE ITEM'}
            </div>
          </div>
        )}
      </div>

      <div className="p-2 bg-gray-100 neo-border text-[9px] font-bold uppercase italic text-black/60">
        <span>* Data fetched in real-time from Technoboost WMS API. This replaces the legacy Google Sheets Slab Master.</span>
      </div>
    </div>
  );
};

export default Slab;

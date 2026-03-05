import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SessionStats } from '../types';

// ============================================================
//  LAST SCAN INTERVAL BOX — CONFIGURATION
//  Adjust these values to control the box size and position.
// ============================================================
const INTERVAL_BOX_CONFIG = {
  // ── SIZE ──────────────────────────────────────────────────
  width:  240,          // px  — box width
  height: 100,          // px  — box height
  borderRadius: 8,     // px  — corner roundness (16 = rounded-2xl)

  // ── POSITION (relative to top-right area, same as the clock) ──
  top:   30,             // px  — vertical position from top of header
  right: 160,           // px  — distance from RIGHT edge of header

  // ── GAP between clock circle and this box ─────────────────
  gapFromClock: 16,     // px  — horizontal space between clock and box

  // ── FONT SIZES ────────────────────────────────────────────
  labelFontSize:  11,   // px  — "LAST SCAN" label
  subLabelFontSize: 10, // px  — "Interval" sub-label
  valueFontSize:  40,   // px  — main number (e.g. "12s")
  badgeFontSize:   9,   // px  — speed badge text (Fast / Normal / Slow)

  // ── SPEED THRESHOLDS (seconds) ────────────────────────────
  fastThreshold:   20,   // <= this  → green  🚀 Fast
  normalThreshold: 30,  // <= this  → yellow ⚡ Normal
                        // > normalThreshold → red 🐢 Slow
};
// ============================================================

interface HeaderProps {
  stats: SessionStats;
  references: string[];
  users: { name: string, group: string }[];
  selectedUser: string;
  onUserChange: (val: string) => void;
  onSync: () => void;
  onReferenceChange: (val: string) => void;
}

// ── Speed style type ──────────────────────────────────────
interface SpeedStyle {
  color: string;   // text colour for the value
  bg:    string;   // badge background colour
  text:  string;   // badge text colour
  label: string;   // badge label
}

const Header: React.FC<HeaderProps> = ({
  stats,
  references,
  users,
  selectedUser,
  onUserChange,
  onSync,
  onReferenceChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Last scan interval tracking
  const lastScanTimestampRef = useRef<number | null>(null);
  const [lastScanInterval, setLastScanInterval] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute scan interval on every scannedQty change
  useEffect(() => {
    if (stats.scannedQty > 0) {
      const now = Date.now();
      if (lastScanTimestampRef.current !== null) {
        const diffSeconds = Math.round((now - lastScanTimestampRef.current) / 1000);
        setLastScanInterval(diffSeconds);
      }
      lastScanTimestampRef.current = now;
    } else {
      lastScanTimestampRef.current = null;
      setLastScanInterval(null);
    }
  }, [stats.scannedQty]);

  // Timer logic
  useEffect(() => {
    if (stats.scannedQty > 0 && stats.scannedQty < stats.totalQty && !isComplete) {
      setIsTimerActive(true);
    } else if (stats.scannedQty === stats.totalQty && stats.totalQty > 0) {
      setIsTimerActive(false);
      setIsComplete(true);
    } else if (stats.scannedQty === 0) {
      setIsTimerActive(false);
      setIsComplete(false);
      setElapsedTime(0);
    }
  }, [stats.scannedQty, stats.totalQty, isComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive) {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const filteredReferences = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return references.filter(ref => ref.toLowerCase().includes(term));
  }, [references, searchTerm]);

  const handleSelect = (ref: string) => {
    onReferenceChange(ref);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const progressPercent = Math.min((stats.scannedQty / (stats.totalQty || 1)) * 100, 100);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatInterval = (seconds: number) => {
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${String(s).padStart(2, '0')}s`;
    }
    return `${seconds}s`;
  };

  // ── Returns all style properties needed by the badge + value ──
  const getSpeedStyle = (secs: number): SpeedStyle => {
    const { fastThreshold, normalThreshold } = INTERVAL_BOX_CONFIG;
    if (secs <= fastThreshold) return {
      color: '#0a8236',
      bg:    '#dcfce7',   // green-100
      text:  '#14532d',   // green-900
      label: '🚀 Fast',
    };
    if (secs <= normalThreshold) return {
      color: '#d97706',   // amber
      bg:    '#fef9c3',   // yellow-100
      text:  '#713f12',   // yellow-900
      label: '⚡ Normal',
    };
    return {
      color: '#dc2626',   // red-600
      bg:    '#fee2e2',   // red-100
      text:  '#7f1d1d',   // red-900
      label: '🐢 Slow',
    };
  };

  const cfg = INTERVAL_BOX_CONFIG;

  return (
    <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 shadow-sm">

      {/* Top Bar: User & Sync */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${!selectedUser ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="bg-blue-600 text-white px-2 py-1 text-xs font-semibold rounded flex items-center gap-2">
            <i className="fas fa-user-circle"></i>
            Operator
          </div>
          <select
            value={selectedUser}
            onChange={(e) => onUserChange(e.target.value)}
            className="bg-transparent border-none font-medium text-sm outline-none cursor-pointer text-gray-700 pr-2 min-w-[140px]"
          >
            <option value="">-- Select --</option>
            {users.map((u, i) => (
              <option key={i} value={u.name}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onSync}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold text-white text-sm flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Reference Selection */}
        <div className="lg:col-span-3 flex flex-col relative z-50" ref={dropdownRef}>
          <label className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
            Trandfer Out Reff No
          </label>
          {!isDropdownOpen && (
            <button
              onClick={() => setIsDropdownOpen(true)}
              className="bg-white border border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all flex justify-between items-center min-h-[44px] font-medium text-sm text-gray-700"
            >
              <span className="truncate">{stats.referenceNumber || 'Select shipment...'}</span>
              <i className="fas fa-chevron-down text-xs opacity-50"></i>
            </button>
          )}

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[250px] overflow-y-auto z-50">
              <div className="w-full flex items-center gap-2 p-3">
                <i className="fas fa-search text-gray-400 text-sm"></i>
                <input
                  type="text"
                  className="w-full bg-transparent border-none outline-none font-medium text-sm text-gray-700 placeholder:text-gray-300"
                  placeholder="Search reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {filteredReferences.length > 0 ? (
                filteredReferences.map((ref) => (
                  <button
                    key={ref}
                    onClick={() => handleSelect(ref)}
                    className={`w-full text-left px-4 py-2 font-medium text-sm border-b border-gray-100 last:border-0 transition-colors flex justify-between items-center group
                      ${stats.referenceNumber === ref ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  >
                    <span className="truncate mr-2">{ref}</span>
                    {stats.referenceNumber === ref && <i className="fas fa-check-circle text-blue-600"></i>}
                  </button>
                ))
              ) : (
                <div className="p-3 text-center font-medium text-xs opacity-50">No matches found</div>
              )}
            </div>
          )}
        </div>

        {/* Outlet Name */}
        <div className="lg:col-span-2">
          <label className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider block">Outlet</label>
          <div className="bg-gradient-to-br from-blue-50 to-blue-25 border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 truncate">{stats.storeName}</h2>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="lg:col-span-4 flex flex-col justify-center">
          <label className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
            Scanning Progress
          </label>
          <div className="h-12 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm relative">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
            <div className="relative z-10 w-full flex items-center px-5 h-full">
              <span className="text-white font-black text-2xl tracking-tighter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] italic uppercase">
                TO QTY
              </span>
              <div className="ml-auto flex items-baseline drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                <span className="text-5xl font-black italic tracking-tighter text-white">{stats.scannedQty}</span>
                <span className="text-2xl font-black text-black ml-3 italic">/ {stats.totalQty}</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20" />
          </div>
        </div>

        {/* ── Clock Timer ── */}
        <div className="absolute top-[5px] right-[440px]">
          <div className="relative w-[150px] h-[150px] rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center">
            <div className="w-full h-full rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center">
                {isComplete ? (
                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-600 font-mono leading-none">
                      {formatTime(elapsedTime)}
                    </span>
                    <span className="text-xs font-semibold text-green-600 block mt-1">Total Time Taken</span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-black font-mono leading-none">
                    {elapsedTime > 0 ? formatTime(elapsedTime).split(':').slice(1).join(':') : '00:00:00'}
                  </span>
                )}
              </div>
              {isTimerActive && (
                <div
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"
                  style={{ animationDuration: '2s' }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Last Scan Interval Box ── */}
        <div
          style={{
            position:     'absolute',
            top:          cfg.top,
            right:        cfg.right,
            width:        cfg.width,
            height:       cfg.height,
            borderRadius: cfg.borderRadius,
          }}
          className="bg-white border border-gray-300 shadow-lg flex flex-col items-center justify-center px-3 py-3 flex-shrink-0"
        >
          <div className="flex items-center gap-1 mb-1">
            <span
              className="font-semibold text-gray-900 uppercase tracking-wider"
              style={{ fontSize: cfg.labelFontSize }}
            >
              Previous Product Time Taken
            </span>
          </div>

          {lastScanInterval !== null ? (() => {
            const speed = getSpeedStyle(lastScanInterval);
            return (
              <div className="flex flex-col items-center">
                <span
                  className="font-black font-mono leading-none"
                  style={{ fontSize: cfg.valueFontSize, color: speed.color }}
                >
                  {formatInterval(lastScanInterval)}
                </span>
                <span
                  className="font-bold rounded-full px-2 py-0.5 mt-2"
                  style={{
                    fontSize:        cfg.badgeFontSize,
                    backgroundColor: speed.bg,
                    color:           speed.text,
                  }}
                >
                  {speed.label}
                </span>
              </div>
            );
          })() : (
            <span className="font-black text-gray-300 font-mono" style={{ fontSize: cfg.valueFontSize }}>
              --
            </span>
          )}
        </div>
        {/* ── End Last Scan Interval Box ── */}

      </div>
    </div>
  );
};

export default Header;
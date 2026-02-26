
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const NavItem = ({ view, icon, label }: { view: View; icon: string; label: string }) => (
    <button
      onClick={() => setView(view)}
      className={`flex items-center w-full p-4 transition-all border-b-2 border-black font-black uppercase tracking-tight text-black text-xs relative overflow-hidden group/item
        ${currentView === view 
          ? 'bg-[#FFCC4D]' 
          : 'hover:bg-gray-100'}`}
    >
      <div className="flex items-center min-w-[32px] justify-center">
        <i className={`fas ${icon} text-lg text-black w-6 text-center`}></i>
      </div>
      <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
        {label}
      </span>
      
      {/* Active indicator dot for mini mode */}
      {currentView === view && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-black group-hover:hidden"></div>
      )}
    </button>
  );

  return (
    <aside 
      className="h-screen bg-white border-r-[3px] border-black flex flex-col shrink-0 z-30 transition-all duration-300 ease-in-out w-[64px] hover:w-[240px] group"
    >
      {/* Brand Logo Area */}
      <div className="p-3 border-b-[3px] border-black flex items-center h-[73px] overflow-hidden">
        <div className="min-w-[40px] h-10 bg-black text-white flex items-center justify-center font-black text-xl neo-border shrink-0">
          K
        </div>
        <span className="ml-4 font-black text-xl tracking-tighter italic text-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          KUSHALS
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        <NavItem view={View.HOME} icon="fa-home" label="Dashboard" />
        <NavItem view={View.UPLOADED_DATA} icon="fa-database" label="Master Data" />
        <NavItem view={View.SCAN_REPORT} icon="fa-file-invoice" label="Reports" />
        <NavItem view={View.SLAB} icon="fa-layer-group" label="Slab Master" />
        <NavItem view={View.NEW_MRP} icon="fa-tags" label="New MRP" />
        <NavItem view={View.MESSAGES} icon="fa-comment-alt" label="Instructions" />
      </nav>

      {/* Bottom Actions */}
      <div className="border-t-[3px] border-black bg-gray-50">
        <button 
          onClick={() => setView(View.SETTINGS)}
          className="flex items-center w-full p-4 font-black uppercase tracking-tight hover:bg-gray-200 text-black text-xs transition-colors overflow-hidden"
        >
          <div className="flex items-center min-w-[32px] justify-center">
            <i className="fas fa-cog text-black w-6 text-center"></i>
          </div>
          <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Settings
          </span>
        </button>
        <button 
          className="flex items-center w-full p-4 font-black uppercase tracking-tight text-black hover:bg-red-500 hover:text-white transition-colors border-t-2 border-black overflow-hidden"
          onClick={() => alert("Logout initiated")}
        >
          <div className="flex items-center min-w-[32px] justify-center">
            <i className="fas fa-sign-out-alt w-6 text-center"></i>
          </div>
          <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Logout
          </span>
        </button>
      </div>

      {/* Tooltip hint for users */}
      <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-12 bg-black flex items-center justify-center rounded-r-lg group-hover:hidden border-2 border-l-0 border-black cursor-pointer shadow-sm">
        <i className="fas fa-chevron-right text-white text-[10px]"></i>
      </div>
    </aside>
  );
};

export default Sidebar;

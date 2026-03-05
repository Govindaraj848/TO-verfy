
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
      className={`flex items-center w-full px-3 py-3 mx-2 rounded-lg transition-all duration-200 relative group/item
        ${currentView === view 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-600 hover:bg-gray-50'}`}
    >
      <div className="flex items-center min-w-[24px] justify-center">
        <i className={`fas ${icon} text-base w-6 text-center ${currentView === view ? 'text-blue-600' : 'text-gray-400'}`}></i>
      </div>
      <span className="ml-3 font-medium text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
        {label}
      </span>
      
      {/* Active indicator for mini mode */}
      {currentView === view && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-blue-600 rounded-r-full group-hover:hidden"></div>
      )}
    </button>
  );

  return (
    <aside 
      className="h-screen bg-white flex flex-col shrink-0 z-30 transition-all duration-300 ease-in-out w-16 hover:w-64 group shadow-sm border-r border-gray-200"
    >
      {/* Brand Logo Area */}
      <div className="px-3 py-5 flex items-center h-20 overflow-hidden">
        <div className="min-w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-bold text-lg rounded-lg shrink-0 shadow-md">
          K
        </div>
        <span className="ml-3 font-bold text-lg text-gray-900 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Kushals
        </span>
      </div>

      {/* Divider */}
      <div className="px-3 mb-2">
        <div className="h-px bg-gray-200"></div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-1">
        <div className="space-y-1">
          <NavItem view={View.HOME} icon="fa-home" label="Dashboard" />
          <NavItem view={View.UPLOADED_DATA} icon="fa-database" label="Master Data" />
          <NavItem view={View.SCAN_REPORT} icon="fa-file-invoice" label="Reports" />
          <NavItem view={View.SLAB} icon="fa-layer-group" label="Slab Master" />
          <NavItem view={View.NEW_MRP} icon="fa-tags" label="New MRP" />
          <NavItem view={View.MESSAGES} icon="fa-comment-alt" label="Instructions" />
        </div>
      </nav>

      {/* Divider */}
      <div className="px-3 mb-2">
        <div className="h-px bg-gray-200"></div>
      </div>

      {/* Bottom Actions */}
      <div className="px-1 pb-3 space-y-1">
        <button 
          onClick={() => setView(View.SETTINGS)}
          className="flex items-center w-full px-3 py-3 mx-0.5 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200 overflow-hidden"
        >
          <div className="flex items-center min-w-[24px] justify-center">
            <i className="fas fa-cog text-gray-400 w-6 text-center"></i>
          </div>
          <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Settings
          </span>
        </button>
        <button 
          className="flex items-center w-full px-3 py-3 mx-0.5 rounded-lg font-medium text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 overflow-hidden"
          onClick={() => alert("Logout initiated")}
        >
          <div className="flex items-center min-w-[24px] justify-center">
            <i className="fas fa-sign-out-alt text-gray-400 w-6 text-center group-hover:text-red-600"></i>
          </div>
          <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Logout
          </span>
        </button>
      </div>

      {/* Expand hint for users */}
      <div className="hidden group-hover:hidden absolute right-0 top-1/2 -translate-y-1/2 -translate-x-12 w-4 h-8 flex items-center justify-center text-gray-400 pointer-events-none group-hover:pointer-events-auto">
        <i className="fas fa-chevron-right text-xs"></i>
      </div>
    </aside>
  );
};

export default Sidebar;
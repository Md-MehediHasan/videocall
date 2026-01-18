
import React from 'react';
import { Video, Bell, Settings, User as UserIcon } from 'lucide-react';
import { User } from './types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser }) => {
  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="sticky top-0 w-full p-4 sm:p-6 flex justify-between items-center z-[100] glass border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            <Video className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight leading-none text-white">GeminiStream</span>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Vercel Powered</span>
          </div>
        </div>
        
        {currentUser ? (
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Network Ready</span>
            </div>
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-gray-500 mt-1">Free Tier</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                <UserIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Documentation</button>
            <button className="px-5 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-all">Sign In</button>
          </div>
        )}
      </header>

      <main className="flex-grow flex flex-col">
        {children}
      </main>

      <footer className="p-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Powered by Google Gemini 3</span>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em]">
          &copy; 2025 Stream Infrastructure Inc.
        </p>
      </footer>
    </div>
  );
};

export default Layout;

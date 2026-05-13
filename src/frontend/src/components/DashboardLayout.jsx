import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children, headerContent }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div id="app-layout" className="min-h-screen bg-[var(--app-bg)] flex">
            {/* Navigation */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
                <Header
                    onMenuClick={() => setIsSidebarOpen(true)}
                    extraContent={headerContent}
                />
                {/* MAIN CONTENT */}
                <main className="flex-1 min-w-0 transition-all duration-300 ease-in-out overflow-x-hidden w-full max-w-[100vw]">
                    <div className="p-4 pt-8 md:p-8 md:pt-8 max-w-[1600px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

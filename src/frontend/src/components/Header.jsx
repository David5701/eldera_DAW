import React, { useState } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// removed unused logo

export default function Header({ onMenuClick, extraContent }) {
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    return (
        <header className="sticky top-2 z-30 bg-[#1E82E5] border border-blue-400/20 min-h-16 py-2 shadow-lg shadow-blue-900/10 rounded-2xl mx-2 print:hidden transition-all duration-200">
            <div className="px-4 md:px-8 flex items-center justify-between gap-4">
                {/* Left: Menu Button (Mobile) & Title/Breadcrumbs */}
                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={onMenuClick}
                        className="p-2 md:hidden hover:bg-white/10 rounded-lg text-white transition-colors shrink-0"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="hidden md:flex flex-col">
                        <h1 className="text-lg md:text-xl font-bold text-white leading-tight w-full break-words" title={extraContent?.residenceName || user?.residence_name || 'Residencia Eldera'}>
                            {extraContent?.residenceName || user?.residence_name || 'Residencia Eldera'}
                        </h1>
                        <p className="text-xs text-blue-100 font-medium opacity-80">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>

                {/* Mobile: Residence Name (Centered in Flex flow for wrapping) */}
                <div className="md:hidden flex-1 flex justify-center px-1">
                    <span className="font-bold text-base sm:text-lg text-white leading-tight text-center break-words line-clamp-2">
                        {extraContent?.residenceName || user?.residence_name || 'Residencia Eldera'}
                    </span>
                </div>

                {/* Extra Content (Buscador/Toggles) - Desktop Only ideally via parent */}
                <div className="hidden md:flex flex-1 justify-center min-w-0 px-4">
                    {extraContent?.customContent
                        ? extraContent.customContent
                        : (extraContent?.residenceName ? null : (typeof extraContent === 'object' && !React.isValidElement(extraContent) ? null : extraContent))}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* User Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 pl-2 md:pl-6 border-l border-blue-500/30 hover:opacity-90 transition-opacity"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white leading-none mb-1">
                                    {user?.name || user?.username || 'Usuario'}
                                </p>
                                <p className="text-xs text-blue-100 font-bold tracking-widest uppercase opacity-90">
                                    {(() => {
                                        const role = (user?.role || '').toLowerCase().trim();
                                        return role === 'admin' ? 'Administrador' : 
                                               role === 'nurse' ? 'Enfermería' : 
                                               role === 'aux' ? 'Auxiliar' : 
                                               role === 'doctor' ? 'Médico' :
                                               role === 'director' ? 'Director' :
                                               role === 'social_worker' ? 'Trabajo Social' :
                                               role === 'physiotherapist' ? 'Fisioterapia' :
                                               role === 'occupational_therapist' ? 'Terapia Ocupacional' :
                                               user?.role || 'Personal';
                                    })()}
                                </p>
                            </div>
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-500 border-2 border-blue-400 flex items-center justify-center text-white font-black shadow-sm shrink-0">
                                {(user?.username || user?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {showUserMenu && (
                            <>
                                {/* Backdrop to close */}
                                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />

                                <div className="absolute right-0 top-12 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <div className="p-4 border-b border-slate-100 sm:hidden">
                                        <p className="text-sm font-bold text-slate-800">
                                            {user?.name || user?.username || 'Usuario'}
                                        </p>
                                        <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                                            {user?.role === 'admin' ? 'Administrador' : 
                                             user?.role === 'nurse' ? 'Enfermería' : 
                                             user?.role === 'aux' ? 'Auxiliar' : 
                                             user?.role === 'doctor' ? 'Médico' :
                                             user?.role === 'director' ? 'Director' :
                                             user?.role === 'social_worker' ? 'Trabajo Social' :
                                             user?.role === 'physiotherapist' ? 'Fisioterapia' :
                                             user?.role === 'occupational_therapist' ? 'Terapia Ocupacional' :
                                             user?.role || 'Personal'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

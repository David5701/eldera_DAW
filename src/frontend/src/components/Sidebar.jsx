import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Activity,
    Pill,
    Settings,
    Menu,
    X,
    LogOut,
    HeartPulse,
    UserPlus,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const { logout, user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('sidebarCollapsed')) || false;
        } catch {
            return false;
        }
    });

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    };

    const currentUserRole = (user?.role || '').toLowerCase().trim();
    const canAddResident = ['admin', 'director', 'nurse', 'doctor'].includes(currentUserRole);

    const navigation = [
        { name: 'Panel de Control', href: '/', icon: LayoutDashboard },
        { name: 'Residentes', href: '/residents/', icon: Users },
        ...(canAddResident ? [{ name: 'Alta Residente', href: '/residents/new', icon: UserPlus }] : []),
    ];

    return (
        <>
            {/* Desktop Sidebar (Sticky) */}
            <aside className={`hidden md:flex flex-col shrink-0 sticky top-2 h-[calc(100vh-1rem)] z-40 bg-[#0F172A] border border-slate-700 rounded-2xl ml-2 my-2 print:hidden transition-all duration-300 overflow-visible ${isCollapsed ? 'w-20' : 'w-72'}`}>
                <SidebarContent
                    navigation={navigation}
                    location={location}
                    logout={logout}
                    onClose={onClose}
                    isCollapsed={isCollapsed}
                    toggleCollapse={toggleCollapse}
                />
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden print:hidden"
                    onClick={onClose}
                />
            )}

            {/* Mobile Sidebar (Drawer) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-[#0F172A] border border-slate-700 rounded-r-2xl my-2 transform transition-transform duration-300 ease-in-out md:hidden print:hidden
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <SidebarContent
                    navigation={navigation}
                    location={location}
                    logout={logout}
                    onClose={onClose}
                    isCollapsed={false} // Mobile always expanded
                />
            </aside>
        </>
    );
}

const SidebarContent = ({ navigation, location, logout, onClose, isCollapsed, toggleCollapse }) => (
    <div className="flex flex-col h-full text-white">
        {/* Logo Section */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} border-b border-white/10 relative transition-all duration-300`}>
            <img src={logo} alt="Eldera" className="h-8 w-8 shrink-0" />

            {!isCollapsed && (
                <div className="flex flex-col overflow-hidden whitespace-nowrap transition-opacity duration-300">
                    <span className="text-xl font-bold tracking-tight">Eldera</span>
                    <span className="text-[10px] uppercase text-blue-300 tracking-wider font-semibold">Residencia</span>
                </div>
            )}

            {/* Mobile Close Button */}
            <button
                onClick={onClose}
                className="ml-auto md:hidden p-1 hover:bg-white/10 rounded-lg"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Desktop Collapse Button - Moved below logo */}
        {toggleCollapse && (
            <div className="hidden md:flex justify-center py-2 border-b border-white/5">
                <button
                    onClick={toggleCollapse}
                    className="w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-sm"
                    title={isCollapsed ? "Expandir menú" : "Contraer menú"}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
            {navigation.map((item) => {
                const isActive = (() => {
                    const path = location.pathname;
                    if (item.href === '/') return path === '/';
                    if (item.href === '/residents/') return path === '/residents' || path === '/residents/';
                    if (item.href === '/residents/new') return path === '/residents/new';
                    return path.startsWith(item.href);
                })();
                const Icon = item.icon;
                return (
                    <Link
                        key={item.name}
                        to={!item.disabled ? item.href : '#'}
                        title={isCollapsed ? item.name : ''}
                        className={`
                                flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                                ${isActive
                                ? 'bg-blue-600 shadow-lg shadow-blue-900/20 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }
                                ${item.disabled ? 'opacity-50 cursor-not-allowed hidden md:flex' : ''}
                            `}
                    >
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                        {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                {item.name}
                            </div>
                        )}

                        {item.disabled && !isCollapsed && (
                            <span className="ml-auto text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase">WIP</span>
                        )}
                    </Link>
                );
            })}
        </nav>

        {/* User & Logout Section */}
        <div className="p-4 border-t border-white/10 bg-black/20 overflow-hidden">
            <button
                onClick={logout}
                title={isCollapsed ? "Cerrar Sesión" : ""}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} w-full py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group`}
            >
                <LogOut className="w-5 h-5 shrink-0 group-hover:text-red-400" />
                {!isCollapsed && <span className="whitespace-nowrap">Cerrar Sesión</span>}
            </button>
        </div>
    </div>
);

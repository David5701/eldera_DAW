import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import { Link, useLocation } from 'react-router-dom';
import {
    Users,
    Stethoscope,
    FileText,
    AlertCircle,
    LogOut,
    Home
} from 'lucide-react';

import logo from '../assets/logo.svg';

export default function AppLayout({ children, onOpenLists }) {
    const { logout, user } = useAuth();
    const location = useLocation();

    const navigation = [


    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-[#1E82E5] to-[#1565C0] text-white shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2">
                    <div className="flex justify-between items-center">
                        {/* Logo & Brand */}
                        <div className="flex items-center gap-6">
                            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                                <img src={logo} alt="E" className="h-10 w-10 drop-shadow-sm" />
                                <div>
                                    <h1 className="text-xl font-black tracking-tighter leading-none">ELDERA</h1>
                                    <p className="text-[#A5D8FF] text-[9px] font-bold uppercase tracking-[0.2em] leading-none mt-1">Gestión Médica</p>
                                </div>
                            </Link>

                            {/* Main Navigation - Desktop */}
                            <nav className="hidden md:flex items-center gap-1 bg-white/10 rounded-lg p-1">
                                {navigation.map((item) => {
                                    const isActive = location.pathname.startsWith(item.href);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={`
                                                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                                                ${isActive
                                                    ? 'bg-white text-blue-700 shadow-sm'
                                                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                                                }
                                            `}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* User & Actions */}
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="font-medium text-sm">{user?.username || 'Usuario'}</p>
                                <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">{user?.role || 'Staff'}</p>
                            </div>

                            {onOpenLists && (
                                <Button
                                    onClick={onOpenLists}
                                    variant="secondary"
                                    size="sm"
                                    className="bg-white/20 hover:bg-white/30 border-transparent text-white mr-2 hidden md:flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>Listados</span>
                                </Button>
                            )}

                            <Button
                                onClick={logout}
                                variant="secondary"
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 border-transparent text-white flex items-center gap-2"
                                title="Cerrar sesión"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Salir</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}

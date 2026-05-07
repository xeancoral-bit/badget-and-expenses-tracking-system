'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Camera, X, Check, Info, AlertCircle, Sun, Moon, Menu } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export default function Header() {
    const { state, dispatch } = useApp();
    const { notifications, user, theme, sidebarOpen } = state;
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const isDark = theme === 'dark';
    const unreadCount = notifications.filter(n => !n.read).length;

    // Apply dark class to <html> element whenever theme changes
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // Load saved theme on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' && !isDark) {
            dispatch({ type: 'TOGGLE_THEME' });
        }
    }, []);

    // Load profile image from localStorage
    useEffect(() => {
        const savedImage = localStorage.getItem('userProfileImage');
        if (savedImage) setProfileImage(savedImage);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setProfileImage(result);
                localStorage.setItem('userProfileImage', result);
            };
            reader.readAsDataURL(file);
        }
    };

    const markAsRead = (id: number) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
    const clearAll = () => dispatch({ type: 'CLEAR_NOTIFICATIONS' });

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check className="text-emerald-500" size={16} />;
            case 'error': return <AlertCircle className="text-red-500" size={16} />;
            default: return <Info className="text-accent" size={16} />;
        }
    };

    const tabLabel = state.activeTab.replace(/-/g, ' ');
    const pageTitle = tabLabel.charAt(0).toUpperCase() + tabLabel.slice(1);

    return (
        <header className={`fixed top-0 right-0 h-16 z-40 px-4 md:px-8 flex items-center justify-between shadow-sm transition-all duration-300
            ${sidebarOpen ? 'lg:left-[280px]' : 'left-0'}
            ${isDark
                ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/5'
                : 'bg-white/80 backdrop-blur-xl border-b border-slate-200'
            }`}
        >
            {/* Left side: Hamburger + Page Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={24} />
                </button>
                
                <h2 className={`text-xl font-semibold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {pageTitle}
                </h2>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">

                {/* ─── Dark / Light Toggle ─── */}
                <button
                    id="theme-toggle"
                    onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                        ${isDark
                            ? 'bg-accent focus:ring-offset-slate-900'
                            : 'bg-slate-200 focus:ring-offset-white'
                        }`}
                >
                    {/* track icons */}
                    <Sun size={12} className={`absolute left-1.5 top-1/2 -translate-y-1/2 transition-opacity ${isDark ? 'opacity-0' : 'opacity-60 text-amber-500'}`} />
                    <Moon size={12} className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-opacity ${isDark ? 'opacity-80 text-white' : 'opacity-0'}`} />
                    {/* thumb */}
                    <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center
                        ${isDark ? 'left-7' : 'left-0.5'}`}
                    >
                        {isDark
                            ? <Moon size={13} className="text-accent" />
                            : <Sun size={13} className="text-amber-500" />
                        }
                    </span>
                </button>

                {/* ─── Notifications ─── */}
                <div className="relative ml-2" ref={notifRef}>
                    <button
                        id="notifications-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`relative p-2.5 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className={`absolute right-0 top-full mt-3 w-96 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn border
                            ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                        >
                            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
                                {notifications.length > 0 && (
                                    <button onClick={clearAll} className="text-xs text-accent hover:text-accent font-medium">
                                        Clear all
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className={`p-8 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        <Bell size={40} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.slice().reverse().map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 border-b last:border-0 flex items-start gap-3 transition-colors
                                                ${isDark
                                                    ? `border-white/5 hover:bg-white/5 ${!notif.read ? 'bg-accent/10' : ''}`
                                                    : `border-slate-100 hover:bg-slate-50 ${!notif.read ? 'bg-accent/5' : ''}`
                                                }`}
                                        >
                                            {getNotificationIcon(notif.type)}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{notif.message}</p>
                                                <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {new Date(notif.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            {!notif.read && (
                                                <button onClick={() => markAsRead(notif.id)} className="text-xs text-accent hover:underline font-medium">
                                                    Mark read
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Profile ─── */}
                <div className="relative ml-1" ref={profileRef}>
                    <button
                        id="profile-btn"
                        onClick={() => setShowProfile(!showProfile)}
                        className={`flex items-center gap-3 p-1.5 pr-4 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                    >
                        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center overflow-hidden shadow-md">
                            {profileImage
                                ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                : <User className="text-white" size={18} />
                            }
                        </div>
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {user?.name || 'User'}
                        </span>
                    </button>

                    {showProfile && (
                        <div className={`absolute right-0 top-full mt-3 w-72 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn border
                            ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                        >
                            <div className={`p-6 text-center ${isDark ? 'bg-gradient-to-b from-slate-800/50 to-slate-900' : 'bg-gradient-to-b from-slate-50 to-white'}`}>
                                <div className="relative inline-block">
                                    <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center overflow-hidden mx-auto shadow-xl">
                                        {profileImage
                                            ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                            : <User className="text-white" size={44} />
                                        }
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-1 right-1 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-slate-900"
                                    >
                                        <Camera className="text-white" size={16} />
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </div>
                                <h3 className={`mt-4 font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name || 'User'}</h3>
                                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{user?.email || 'user@example.com'}</p>

                                {/* Theme row inside profile */}
                                <div className={`mt-4 flex items-center justify-between px-3 py-2.5 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                    <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
                                    </span>
                                    <button
                                        onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
                                        className={`relative w-11 h-6 rounded-full transition-all duration-300
                                            ${isDark ? 'bg-accent' : 'bg-slate-200'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300
                                            ${isDark ? 'left-5' : 'left-0.5'}`}
                                        />
                                    </button>
                                </div>
                            </div>
                            <div className={`border-t p-2 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                                <button
                                    onClick={() => { setProfileImage(null); localStorage.removeItem('userProfileImage'); }}
                                    className={`w-full p-3 text-left text-sm flex items-center gap-3 rounded-xl transition-colors
                                        ${isDark ? 'text-slate-400 hover:bg-red-500/10 hover:text-red-500' : 'text-slate-500 hover:bg-red-500/10 hover:text-red-500'}`}
                                >
                                    <X size={18} />
                                    Remove Photo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

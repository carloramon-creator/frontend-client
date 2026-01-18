import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface NotificationPayload {
    title: string;
    body: string;
}

interface InAppNotificationProps {
    notification: NotificationPayload | null;
    onClose: () => void;
}

export function InAppNotification({ notification, onClose }: InAppNotificationProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (notification) {
            setVisible(true);
            const timer = setTimeout(() => {
                handleClose();
            }, 6000); // 6 seconds to read
            return () => clearTimeout(timer);
        }
    }, [notification]);

    function handleClose() {
        setVisible(false);
        setTimeout(() => {
            onClose();
        }, 500); // Wait for animation
    }

    if (!notification && !visible) return null;

    return (
        <div className={cn(
            "fixed top-4 left-4 right-4 z-[100] transition-all duration-500 transform",
            visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}>
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl p-4 flex items-start gap-4 max-w-md mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />

                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                    <Bell className="text-emerald-500 w-5 h-5 animate-pulse" />
                </div>

                <div className="flex-1 pr-6">
                    <h4 className="text-white font-bold text-sm mb-1">{notification?.title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{notification?.body}</p>
                </div>

                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 p-2 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

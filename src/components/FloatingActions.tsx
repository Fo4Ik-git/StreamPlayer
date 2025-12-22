import type { LucideIcon } from 'lucide-react';

interface FloatingAction {
    id: string;
    icon: LucideIcon;
    onClick: () => void;
    label?: string;
    color?: string; // Например, 'bg-indigo-600'
}

interface FloatingActionsProps {
    actions: FloatingAction[];
}

export default function FloatingActions({ actions }: FloatingActionsProps) {
    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
            {actions.map((action) => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.id}
                        onClick={action.onClick}
                        title={action.label}
                        className={`p-3 ${action.color || 'bg-zinc-900'} text-white rounded-full shadow-lg hover:scale-110 transition-all border border-zinc-700 active:scale-95 group relative`}
                    >
                        <Icon className="w-6 h-6" />
                        
                        {/* Подсказка при наведении (опционально) */}
                        {action.label && (
                            <span className="absolute right-full mr-3 px-2 py-1 rounded bg-zinc-800 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {action.label}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
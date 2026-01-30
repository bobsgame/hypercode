'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn exists, if not will use template literal

interface WidgetContainerProps {
    id: string;
    title: string;
    children: React.ReactNode;
    onRemove?: () => void;
    className?: string; // Additional classes for the container
    defaultCollapsed?: boolean;
}

export function WidgetContainer({ id, title, children, onRemove, className, defaultCollapsed = false }: WidgetContainerProps) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md",
                className
            )}
        >
            {/* Header / Drag Handle */}
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 h-10 select-none">
                <div className="flex items-center gap-2 overflow-hidden">
                    {/* Drag Handle */}
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        <GripVertical size={16} />
                    </div>
                    {/* Title */}
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                        {title}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {onRemove && (
                        <button
                            onClick={onRemove}
                            className="p-1 text-zinc-400 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Remove Widget"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Body */}
            {!isCollapsed && (
                <div className="p-4 flex-1 overflow-auto min-h-[100px]">
                    {children}
                </div>
            )}
        </div>
    );
}

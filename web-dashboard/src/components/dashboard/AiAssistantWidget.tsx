'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';

interface AiAssistantWidgetProps {
    onCommand: (command: string) => void;
    activeFilter: string | null;
    onClear: () => void;
}

export default function AiAssistantWidget({ onCommand, activeFilter, onClear }: AiAssistantWidgetProps) {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        setIsProcessing(true);

        setTimeout(() => {
            onCommand(input.trim());
            setInput('');
            setIsProcessing(false);
        }, 600);
    };

    const handleClear = () => {
        onClear();
        setInput('');
        inputRef.current?.focus();
    };

    return (
        <div className="relative rounded-2xl border border-emerald-500/20 bg-emerald-900/40 p-5 backdrop-blur-md shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
            {/* Header */}
            <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold tracking-wide text-emerald-300">
                    Me Poupay AI
                </span>
            </div>

            {/* Active Filter Badge */}
            <AnimatePresence>
                {activeFilter && (
                    <motion.div
                        key="filter-badge"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="mb-3 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
                    >
                        <span className="text-xs font-medium text-emerald-300">
                            Filtro aplicado: {activeFilter}
                        </span>
                        <motion.button
                            type="button"
                            aria-label="limpar filtro"
                            onClick={handleClear}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="ml-2 rounded-full p-0.5 text-emerald-400 transition-colors hover:text-emerald-200"
                        >
                            <X className="h-3.5 w-3.5" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ex: gastos com uber..."
                    aria-label="comando de filtro"
                    disabled={isProcessing}
                    className={[
                        'flex-1 rounded-xl border border-emerald-700/50 bg-black/30 px-3 py-2',
                        'text-sm text-white placeholder-emerald-700/60 outline-none',
                        'transition-all duration-200',
                        'focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20',
                        'disabled:opacity-50',
                    ].join(' ')}
                />
                <motion.button
                    type="submit"
                    aria-label="enviar"
                    disabled={isProcessing || !input.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={[
                        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
                        'bg-emerald-500 text-black shadow-[0_0_14px_rgba(16,185,129,0.5)]',
                        'transition-all duration-200',
                        'hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40',
                    ].join(' ')}
                >
                    {isProcessing
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Send className="h-4 w-4" />
                    }
                </motion.button>
            </form>

            {/* Hint */}
            <p className="mt-2 text-[11px] text-emerald-700/70">
                Tente: &quot;gastos com ifood&quot;, &quot;uber&quot;, &quot;aluguel&quot;...
            </p>
        </div>
    );
}

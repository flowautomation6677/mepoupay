'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Title, Text, Card } from "@tremor/react"; // Assuming Tremor usage or similar UI
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeManager({ userName }: { userName: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if the 'welcome' param exists and is true
        if (searchParams.get('welcome') === 'true') {
            setIsOpen(true);
        }
    }, [searchParams]);

    const handleClose = () => {
        setIsOpen(false);
        // Remove the query param properly without reloading
        const params = new URLSearchParams(searchParams.toString());
        params.delete('welcome');
        router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-sm"
                    >
                        <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] border border-indigo-500/20 shadow-2xl shadow-indigo-500/10 p-6 text-center">

                            {/* Decorative background gradients */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/20 blur-3xl rounded-full"></div>

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Icon */}
                            <div className="mb-4 flex justify-center">
                                <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center ring-1 ring-indigo-500/30">
                                    <span className="text-3xl">👋</span>
                                </div>
                            </div>

                            {/* Content */}
                            <h2 className="text-white text-xl font-bold mb-2">
                                Bem-vindo(a), {userName.split(' ')[0]}!
                            </h2>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Eu vou te ajudar a organizar seus gastos e entradas de forma simples.
                                <br />
                                <span className="text-indigo-300 font-medium">Vamos começar com o primeiro lançamento?</span>
                            </p>

                            {/* CTA */}
                            <a
                                href="https://wa.me/5521984646902?text=Oi! Quero registrar meu primeiro gasto."
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleClose}
                                className="w-full group relative flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-600/25 active:scale-95"
                            >
                                Registrar primeiro gasto
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </a>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

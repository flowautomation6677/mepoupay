'use client';

import { Trophy, ArrowUpRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ABComparisonCard({ efficiencyData }: { efficiencyData: any[] }) {
    // Find Winner (lowest error rate)
    const winner = efficiencyData.reduce((prev, current) =>
        (prev.error_rate_percent < current.error_rate_percent) ? prev : current
        , efficiencyData[0] || {});

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {efficiencyData.map((model) => {
                const isWinner = model.prompt_version === winner.prompt_version;

                return (
                    <div key={model.prompt_version} className={`relative p-6 rounded-2xl border ${isWinner ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-white/5 bg-slate-900/50'} backdrop-blur-sm transition-all hover:scale-[1.02]`}>
                        {isWinner && (
                            <div className="absolute -top-3 -right-3">
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="bg-emerald-500 text-white p-2 rounded-full shadow-lg shadow-emerald-500/40"
                                >
                                    <Trophy size={20} fill="currentColor" />
                                </motion.div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-mono text-sm font-bold uppercase tracking-wider ${isWinner ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {model.prompt_version}
                            </h3>
                            {isWinner && <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-md font-bold">WINNING</span>}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-slate-500 text-xs">Taxa de Erro (HITL)</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-2xl font-bold ${isWinner ? 'text-white' : 'text-slate-200'}`}>
                                        {model.error_rate_percent}%
                                    </span>
                                    {isWinner && <span className="text-xs text-emerald-400 flex items-center"><ArrowUpRight size={12} /> Melhor Performance</span>}
                                </div>
                            </div>

                            <div>
                                <p className="text-slate-500 text-xs">Confiança Média</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isWinner ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${model.avg_confidence * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-slate-300">{(model.avg_confidence * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

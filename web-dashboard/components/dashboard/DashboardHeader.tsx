'use client'

import { Bell, Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function DashboardHeader({
    userEmail,
    currentMonth,
    currentYear
}: {
    userEmail: string | undefined,
    currentMonth: number,
    currentYear: number
}) {
    const router = useRouter()

    const handleMonthChange = (offset: number) => {
        let newMonth = currentMonth + offset
        let newYear = currentYear

        if (newMonth > 12) {
            newMonth = 1
            newYear += 1
        } else if (newMonth < 1) {
            newMonth = 12
            newYear -= 1
        }

        router.push(`/dashboard?month=${newMonth}&year=${newYear}`)
    }

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-50 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 rounded-3xl border border-white/5 bg-slate-900/80 px-6 py-4 shadow-lg backdrop-blur-xl"
        >
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative">
                    <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-indigo-500 bg-slate-800">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-900">
                        <div className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></div>
                    </div>
                </div>
                <div>
                    <h2 className="text-sm font-medium text-slate-400">Bem-vindo de volta,</h2>
                    <h1 className="text-lg font-bold text-white">Porquim Trader 🐷</h1>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {/* Seletor de Mês */}
                <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-1">
                    <button
                        onClick={() => handleMonthChange(-1)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center text-sm font-medium text-slate-200">
                        <Calendar size={14} className="text-indigo-400" />
                        <span>{MONTH_NAMES[currentMonth - 1]} {currentYear}</span>
                    </div>
                    <button
                        onClick={() => handleMonthChange(1)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                <button className="rounded-full border border-white/5 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
                    <Bell size={20} />
                </button>
            </div>
        </motion.header>
    )
}

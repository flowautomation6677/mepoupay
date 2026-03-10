'use client'

import { Bell, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function DashboardHeader({
    userEmail,
    userName,
    avatarUrl,
    currentMonth,
    currentYear,
    customStart,
    customEnd
}: Readonly<{
    userEmail: string | undefined,
    userName?: string | null,
    avatarUrl?: string | null,
    currentMonth: number,
    currentYear: number,
    customStart?: string,
    customEnd?: string
}>) {
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
            className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 rounded-3xl border border-border bg-card/80 px-4 md:px-6 py-4 shadow-sm backdrop-blur-xl"
        >
            {/* Top Row (Mobile): User Profile + Notification Bell */}
            <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary bg-muted">
                            <img
                                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background">
                            <div className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-medium text-muted-foreground">Bem-vindo,</h2>
                        <h1 className="text-lg font-bold text-foreground capitalize truncate max-w-[150px] sm:max-w-[200px]">
                            {userName || userEmail?.split('@')[0]}
                        </h1>
                    </div>
                </div>

                {/* Bell is here on mobile, but at the end of the flex container on desktop */}
                <button className="md:hidden flex-shrink-0 rounded-full border border-border bg-secondary/50 p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
                    <Bell size={20} />
                </button>
            </div>

            {/* Controls Row (Mobile) / Right Side (Desktop) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto md:justify-end mt-2 md:mt-0">

                {/* Seletor de Mês / Customizado */}
                <div className="flex items-center justify-between sm:justify-center gap-1 rounded-xl border border-border bg-secondary/50 p-1 w-full sm:w-auto">
                    {customStart ? (
                        <div className="flex items-center justify-between w-full px-3 py-1.5 text-sm font-medium text-primary">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>Período Personalizado</span>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="ml-2 rounded-full hover:bg-accent p-1 text-foreground"
                            >
                                X
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => handleMonthChange(-1)}
                                className="flex-1 sm:flex-none flex justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex-1 sm:flex-none flex items-center gap-2 px-2 min-w-[140px] justify-center text-sm font-bold text-foreground">
                                <Calendar size={14} className="text-primary" />
                                <span>{MONTH_NAMES[currentMonth - 1]} {currentYear}</span>
                            </div>
                            <button
                                onClick={() => handleMonthChange(1)}
                                className="flex-1 sm:flex-none flex justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </>
                    )}
                </div>

                {/* Input de Data Personalizada (Trigger) */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const start = formData.get('start') as string
                        const end = formData.get('end') as string
                        if (start && end) router.push(`/dashboard?startDate=${start}&endDate=${end}`)
                    }}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto"
                >
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                            type="date"
                            name="start"
                            defaultValue={customStart}
                            className="flex-1 sm:flex-none min-w-0 bg-secondary/50 border border-border rounded-lg px-2 py-2 sm:py-1.5 text-sm sm:text-xs text-foreground color-scheme-dark"
                            required
                        />
                        <span className="text-muted-foreground font-mono">-</span>
                        <input
                            type="date"
                            name="end"
                            defaultValue={customEnd}
                            className="flex-1 sm:flex-none min-w-0 bg-secondary/50 border border-border rounded-lg px-2 py-2 sm:py-1.5 text-sm sm:text-xs text-foreground color-scheme-dark"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2 sm:py-1.5 px-4 text-sm sm:text-xs font-bold transition">
                        Ir
                    </button>
                </form>

                {/* Bell on Desktop (Hidden on mobile) */}
                <button className="hidden md:flex flex-shrink-0 rounded-full border border-border bg-secondary/50 p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
                    <Bell size={20} />
                </button>
            </div>
        </motion.header>
    )
}

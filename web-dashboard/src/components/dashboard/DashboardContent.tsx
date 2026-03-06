'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import StatsGrid from '@/components/dashboard/StatsGrid'
import TransactionFeed from '@/components/dashboard/TransactionFeed'
import AiAssistantWidget from '@/components/dashboard/AiAssistantWidget'
import { extractCategoryFromCommand } from '@/utils/dashboard/categoryFilter'

import { DashboardData } from '@/types/dashboard'

// Lazy Load ExpenseChart
const ExpenseChart = dynamic(() => import('@/components/dashboard/ExpenseChart'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-muted rounded-3xl animate-pulse" />
})

export default function DashboardContent({ profile, transactions, prevTransactions }: Readonly<DashboardData>) {
    // ⚠️ All hooks MUST be called before any conditional return (Rules of Hooks)
    const [aiFilter, setAiFilter] = useState<string | null>(null);

    const handleCommand = useCallback((command: string) => {
        const category = extractCategoryFromCommand(command);
        // Store both the detected category AND the raw command for fallback matching
        setAiFilter(category ?? command);
    }, []);

    const handleClear = useCallback(() => {
        setAiFilter(null);
    }, []);

    if (!profile) return null;

    const filteredTransactions = aiFilter
        ? transactions.filter(t => {
            // Primary: match by canonical category name (case-insensitive)
            const categoryMatch = t.category?.toLowerCase().includes(aiFilter.toLowerCase());
            // Fallback: match by description keywords (case-insensitive)
            const descriptionMatch = t.description?.toLowerCase().includes(aiFilter.toLowerCase());
            return categoryMatch || descriptionMatch;
        })
        : transactions;

    return (
        <>
            {/* Bento Grid Principal (Zone 1: KPIs) */}
            <StatsGrid
                transactions={filteredTransactions}
                prevTransactions={prevTransactions}
                financialGoal={profile.financial_goal || 0}
                currentBalance={profile.balance}
            />

            {/* Gráficos Neon */}
            <ExpenseChart transactions={filteredTransactions} />

            {/* Feed e Widget Lateral (GridLayout) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <TransactionFeed transactions={filteredTransactions} />
                </div>

                <div className="md:col-span-1 space-y-6">
                    {/* AI Conversational Widget */}
                    <AiAssistantWidget
                        onCommand={handleCommand}
                        activeFilter={aiFilter}
                        onClear={handleClear}
                    />
                </div>
            </div>
        </>
    )
}

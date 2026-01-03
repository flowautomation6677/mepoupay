'use client';
import { useState, useEffect } from 'react';
import TheCFO from '@/components/admin/sections/TheCFO';
import { createBrowserClient } from "@supabase/ssr";

export default function CFOPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [financeData, setFinanceData] = useState<{ date: string; est_cost_usd: number }[]>([]);

    useEffect(() => {
        async function load() {
            const { data: fin } = await supabase.from('view_financial_metrics').select('*');
            if (fin && fin.length > 0) setFinanceData(fin);
            else {
                setFinanceData([
                    { date: '2023-10-01', est_cost_usd: 0.45 },
                    { date: '2023-10-02', est_cost_usd: 0.52 },
                    { date: '2023-10-04', est_cost_usd: 1.20 },
                    { date: '2023-10-05', est_cost_usd: 0.80 },
                ]);
            }
        }
        load();
    }, [supabase]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">The CFO 💸</h1>
                <p className="text-slate-400">Custos de API & Métricas Financeiras</p>
            </div>
            <TheCFO financeData={financeData} />
        </div>
    );
}

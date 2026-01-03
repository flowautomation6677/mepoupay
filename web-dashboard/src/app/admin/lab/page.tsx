'use client';
import { useState, useEffect } from 'react';
import TheLab from '@/components/admin/sections/TheLab';
import { createBrowserClient } from "@supabase/ssr";

interface EfficiencyItem {
    prompt_version: string;
    error_rate_percent: number;
    avg_confidence: number;
    total_samples: number;
}

export default function LabPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [efficiencyData, setEfficiencyData] = useState<EfficiencyItem[]>([]);

    useEffect(() => {
        async function load() {
            const { data: eff } = await supabase.from('view_ai_efficiency').select('*');
            if (eff && eff.length > 0) setEfficiencyData(eff);
            else {
                setEfficiencyData([
                    { prompt_version: 'v1_stable', error_rate_percent: 12.5, avg_confidence: 0.88, total_samples: 450 },
                    { prompt_version: 'v2_experimental', error_rate_percent: 4.2, avg_confidence: 0.96, total_samples: 420 },
                ]);
            }
        }
        load();
    }, [supabase]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">The Lab 🧪</h1>
                <p className="text-slate-400">Prompt Engineering & Testes A/B</p>
            </div>
            <TheLab efficiencyData={efficiencyData} />
        </div>
    );
}

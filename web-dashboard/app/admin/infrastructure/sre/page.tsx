'use client';
import TheSRE from '@/components/admin/sections/TheSRE';

export default function SREPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">The SRE ⚡</h1>
                <p className="text-slate-400">Saúde do Sistema e Filas</p>
            </div>
            <TheSRE />
        </div>
    );
}

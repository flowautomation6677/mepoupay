'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const data = [
    { subject: 'Transporte', A: 120, B: 110, fullMark: 150 },
    { subject: 'Alimentação', A: 98, B: 130, fullMark: 150 },
    { subject: 'Lazer', A: 86, B: 130, fullMark: 150 },
    { subject: 'Saúde', A: 99, B: 100, fullMark: 150 },
    { subject: 'Outros', A: 85, B: 90, fullMark: 150 },
    { subject: 'Mercado', A: 65, B: 85, fullMark: 150 },
];

export default function ConfusionRadar() {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar
                        name="v1_stable"
                        dataKey="A"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.3}
                    />
                    <Radar
                        name="v2_experimental"
                        dataKey="B"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                    />
                </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-2">
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 opacity-50"></span> v1_stable
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 opacity-50"></span> v2_experimental
                </div>
            </div>
        </div>
    );
}

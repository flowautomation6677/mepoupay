'use client';

import { Card, Title, Text, Metric, ProgressBar, Badge } from "@tremor/react";
import { Terminal, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Mock Console Component
const ConsoleWindow = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Mock Log Stream
        const interval = setInterval(() => {
            const types = ['INFO', 'INFO', 'WARN', 'ERROR', 'INFO'];
            const msgs = [
                'Values extracted successfully',
                'User session verified',
                'Rate limit approaching (80%)',
                'Connection timeout: Redis',
                'Job 12903 completed'
            ];

            const randomType = types[Math.floor(Math.random() * types.length)];
            const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
            const time = new Date().toLocaleTimeString('pt-BR');

            const newLog = `[${time}] [${randomType}] ${randomMsg}`;
            setLogs(prev => [...prev.slice(-20), newLog]); // Keep last 20
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-[#0c0c0c] rounded-lg border border-slate-800 p-4 font-mono text-xs h-64 overflow-y-auto">
            {logs.map((log, i) => (
                <div key={i} className={`mb-1 ${log.includes('ERROR') ? 'text-rose-500' : log.includes('WARN') ? 'text-yellow-500' : 'text-slate-400'}`}>
                    <span className="opacity-50 mr-2">$</span>
                    {log}
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};

export default function TheSRE() {
    return (
        <div className="mt-6 space-y-6">
            {/* Queue Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-card ring-0 border-l-4 border-indigo-500">
                    <div className="flex justify-between items-center mb-4">
                        <Title className="text-white">BullMQ Processing Queue</Title>
                        <Badge icon={Clock} color="indigo" size="xs">Real-time</Badge>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Media Pipeline</span>
                                <span>45/100 jobs</span>
                            </div>
                            <ProgressBar value={45} color="indigo" className="mt-0" />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Outbound Messages</span>
                                <span>12/100 messages</span>
                            </div>
                            <ProgressBar value={12} color="emerald" className="mt-0" />
                        </div>
                    </div>
                </Card>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="glass-card ring-0 flex flex-col justify-center items-center">
                        <Metric className="text-white">12ms</Metric>
                        <Text className="text-slate-500 text-xs mt-1">Latency P95</Text>
                    </Card>
                    <Card className="glass-card ring-0 flex flex-col justify-center items-center border-rose-500/20 bg-rose-900/10">
                        <Metric className="text-rose-400">0.02%</Metric>
                        <Text className="text-rose-200/50 text-xs mt-1">Error Rate</Text>
                    </Card>
                </div>
            </div>

            {/* Live Logs */}
            <Card className="glass-card ring-0">
                <div className="flex items-center gap-2 mb-4">
                    <Terminal size={18} className="text-slate-400" />
                    <Title className="text-white">System Logs (Stream)</Title>
                </div>
                <ConsoleWindow />
            </Card>
        </div>
    );
}

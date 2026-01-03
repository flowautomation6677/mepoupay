'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchInstances, createInstanceAction, connectInstanceAction, logoutInstanceAction, deleteInstanceAction, InstanceData } from './actions';
import { Title, Text, Card, Badge, Button, Dialog, DialogPanel } from "@tremor/react";
import { Smartphone, RefreshCw, QrCode, Plus, Trash2, Power, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WhatsAppPage() {
    const [instances, setInstances] = useState<InstanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'generating' | 'scanned' | 'success'>('idle');
    const [debugLog, setDebugLog] = useState<string>('');

    // Polling refs to manage intervals
    const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadInstances();
        return () => stopPolling();
    }, []);

    // Stop all polling on unmount or close
    function stopPolling() {
        if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
        if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
        qrIntervalRef.current = null;
        statusIntervalRef.current = null;
    }

    async function loadInstances() {
        setLoading(true);
        const data = await fetchInstances();
        setInstances(data);
        setLoading(false);
        return data; // Return for usage in polling
    }

    // Checking status in background
    async function checkStatus(name: string) {
        const data = await fetchInstances();
        setInstances(data); // User sees updates in background
        const current = data.find(i => i.instanceName === name);

        if (current && current.status === 'open') {
            setConnectionStatus('success');
            stopPolling();
            setTimeout(() => {
                setIsQrModalOpen(false); // Close modal after success animation
                setConnectionStatus('idle');
            }, 3000);
        }
    }



    async function fetchQrCode(name: string) {
        try {
            console.log("🔄 Refreshing QR Code...");
            // First check status: maybe it connected while we were waiting
            const statusData = await fetchInstances();
            const current = statusData.find(i => i.instanceName === name);

            if (current?.status === 'open') {
                setConnectionStatus('success');
                stopPolling();
                return;
            }

            // Try to connect
            setDebugLog("Solicitando QR Code...");
            const data = await connectInstanceAction(name);
            setDebugLog(JSON.stringify(data, null, 2));

            if (data?.error) {
                alert(`Erro: ${data.message || data.error}`);
                setConnectionStatus('idle');
                setIsQrModalOpen(false);
                return;
            }

            if (data?.base64) {
                setQrCode(data.base64);
                setConnectionStatus('scanned');
            } else if (data?.code) {
                setQrCode(data.code);
                setConnectionStatus('scanned');
            } else {
                console.log("⚠️ No QR Code returned (API might be syncing), checking status next tick...");
                // If API returns count:0 or empty, we just wait for the next poll or status check
            }
        } catch (error: any) {
            console.error("Error fetching QR:", error);
            setDebugLog("Erro Exception: " + error.message);
        }
    }

    function handleCloseModal() {
        setIsQrModalOpen(false);
        stopPolling();
        setConnectionStatus('idle');
        setDebugLog('');
    }

    async function handleConnect(name: string) {
        setSelectedInstance(name);
        setConnectionStatus('generating');
        setIsQrModalOpen(true);
        setQrCode(null);
        setDebugLog("Reiniciando sessão...");

        // Try logout first to clear stuck sessions (Fix for count: 0)
        try {
            await logoutInstanceAction(name);
        } catch (e) {
            console.log("Logout ignored (probably already closed)");
        }

        setDebugLog("Iniciando conexão...");

        // Fetch QR 
        await fetchQrCode(name);

        // Start QR Refresh Loop (every 10s)
        if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
        qrIntervalRef.current = setInterval(() => fetchQrCode(name), 10000);

        // Start Status Check Loop (every 3s)
        if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = setInterval(() => checkStatus(name), 3000);
    }

    // ... fetchQrCode stays similar ...

    // ... handleCloseModal stays similar ...

    async function handleCreate() {
        const name = prompt("Nome da nova instância (ex: FinanceBot):");
        if (name) {
            const data = await createInstanceAction(name);
            await loadInstances();

            // Start polling for status
            if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
            statusIntervalRef.current = setInterval(() => checkStatus(name), 3000);
        }
    }


    async function handleDelete(name: string) {
        if (confirm(`⚠️ PERIGO: Tem certeza que deseja EXCLUIR a instância ${name}? Isso não tem volta.`)) {
            await deleteInstanceAction(name);
            await loadInstances();
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <Title className="text-3xl font-bold text-white">The Bridge 📱</Title>
                    <Text className="text-slate-400">Gestão de Instâncias WhatsApp</Text>
                </div>
                <Button icon={Plus} onClick={handleCreate} color="indigo">Nova Instância</Button>
            </header>

            {loading ? (
                <div className="text-white">Carregando instâncias...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {instances.map((item) => (
                        <Card key={item.instanceName} className="glass-card ring-0 border-l-4 border-indigo-500 relative overflow-hidden group">

                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                                <Badge color={item.status === 'open' ? 'emerald' : 'rose'} icon={item.status === 'open' ? Smartphone : Power}>
                                    {item.status === 'open' ? 'CONECTADO' : 'DESCONECTADO'}
                                </Badge>
                            </div>

                            <div className="flex flex-col h-full justify-between">
                                <div>
                                    <Title className="text-white text-xl">{item.instanceName}</Title>
                                    <Text className="text-slate-400 truncate w-40">
                                        {item.owner || "Aguardando conexão..."}
                                    </Text>
                                    {item.profileName && (
                                        <Text className="text-emerald-400 text-sm mt-1">{item.profileName}</Text>
                                    )}
                                </div>

                                <div className="mt-6 flex gap-2">
                                    {item.status !== 'open' && (
                                        <Button
                                            size="xs"
                                            variant="secondary"
                                            icon={QrCode}
                                            onClick={() => handleConnect(item.instanceName)}
                                        >
                                            Conectar
                                        </Button>
                                    )}

                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="rose"
                                        icon={Trash2}
                                        onClick={() => handleDelete(item.instanceName)}
                                    >
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* QR Code Modal */}
            <Dialog open={isQrModalOpen} onClose={handleCloseModal} static={true}>
                <DialogPanel className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-md mx-auto text-center">
                    <AnimatePresence mode='wait'>
                        {connectionStatus === 'success' ? (
                            <motion.div
                                key="success"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="flex flex-col items-center justify-center py-10"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <CheckCircle className="w-24 h-24 text-emerald-500 mb-4" />
                                </motion.div>
                                <Title className="text-white text-2xl">Conectado com Sucesso!</Title>
                                <Text className="text-slate-400 mt-2">Sincronizando conversas...</Text>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="qr"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Title className="text-white mb-2">Escaneie o QR Code</Title>
                                <Text className="text-slate-400 mb-6">Abra o WhatsApp {'>'} Dispositivos Conectados {'>'} Conectar</Text>

                                <div className="bg-white p-4 rounded-xl inline-block mx-auto relative">
                                    {qrCode ? (
                                        <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                                    ) : (
                                        <div className="w-64 h-64 flex items-center justify-center bg-slate-100 rounded">
                                            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                                        </div>
                                    )}

                                    {connectionStatus === 'scanned' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-xl">
                                            <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                                Aguardando leitura...
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <Text className="text-xs text-slate-500">Atualiza automaticamente a cada 10s</Text>
                                    <Button variant="light" color="slate" onClick={handleCloseModal} className="mt-4">
                                        Cancelar
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* DEBUG AREA */}
                    <div className="mt-8 p-2 bg-black/50 rounded text-left overflow-auto max-h-32">
                        <Text className="text-xs font-mono text-cyan-400 mb-1">🔍 Debug da API:</Text>
                        <pre className="text-[10px] text-slate-300 whitespace-pre-wrap break-all">
                            {debugLog || "Aguardando logs..."}
                        </pre>
                    </div>
                </DialogPanel>
            </Dialog>
        </div>
    );
}

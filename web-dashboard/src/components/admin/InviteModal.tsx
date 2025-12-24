import { useState } from 'react';
import { Title, Text, TextInput, Button } from "@tremor/react";
import { X, Phone } from 'lucide-react';

export const InviteModal = ({ isOpen, onClose, onInvite }: any) => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!email) return alert("Email é obrigatório");
        setIsLoading(true);
        await onInvite(email, name, whatsapp);
        setIsLoading(false);
        setEmail("");
        setName("");
        setWhatsapp("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>

                <Title className="text-white mb-1">Convidar Novo Usuário</Title>
                <Text className="text-slate-400 mb-6">Envie um link mágico de acesso.</Text>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">Nome Completo</label>
                        <TextInput
                            placeholder="Ex: João da Silva"
                            value={name}
                            onValueChange={setName}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">E-mail corporativo/pessoal</label>
                        <TextInput
                            placeholder="joao@exemplo.com"
                            value={email}
                            onValueChange={setEmail}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">WhatsApp (Opcional)</label>
                        <TextInput
                            placeholder="5521999999999"
                            value={whatsapp}
                            onValueChange={setWhatsapp}
                            className="mt-1"
                            icon={Phone}
                        />
                        <p className="text-xs text-slate-500 mt-1">Apenas números, com DDD (Ex: 5521...)</p>
                    </div>

                    <Button
                        size="lg"
                        color="indigo"
                        className="w-full mt-4"
                        loading={isLoading}
                        onClick={handleSubmit}
                    >
                        {isLoading ? 'Enviando...' : 'Enviar Convite 🚀'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

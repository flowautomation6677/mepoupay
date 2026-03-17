import { useState } from 'react';
import { Title, Text, TextInput, Button } from "@tremor/react";
import { X, Copy, Check } from 'lucide-react';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string, name: string, whatsapp: string) => Promise<void>;
}

export const InviteModal = ({ isOpen, onClose, onInvite }: InviteModalProps) => {
    const [activeTab, setActiveTab] = useState<'email' | 'link'>('email');
    
    // Email Invite State
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Shared Link State
    const [maxUses, setMaxUses] = useState("");
    const [expiresInDays, setExpiresInDays] = useState("");
    const [generatedLink, setGeneratedLink] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleSubmitEmail = async () => {
        if (!email) return alert("Email é obrigatório");
        setIsLoading(true);
        try {
            await onInvite(email, "", "");
            setEmail("");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/shared-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maxUses: maxUses ? parseInt(maxUses) : null,
                    expiresInDays: expiresInDays ? parseInt(expiresInDays) : null
                })
            });
            const data = await res.json();
            if (res.ok && data.link) {
                setGeneratedLink(data.link);
                setCopied(false);
            } else {
                alert(data.error || "Erro ao gerar link");
            }
        } catch (err) {
            alert("Erro na requisição. Verifique sua conexão.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                </button>

                <Title className="text-foreground mb-1">Convidar Novo Usuário</Title>
                <Text className="text-muted-foreground mb-6">Convide membros para o seu workspace.</Text>

                {/* TABS */}
                <div className="flex border-b border-border mb-6">
                    <button
                        className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'email' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('email')}
                    >
                        Por E-mail
                    </button>
                    <button
                        className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'link' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('link')}
                    >
                        Link Compartilhado
                    </button>
                </div>

                {activeTab === 'email' && (
                    <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                        <div>
                            <label htmlFor="email" className="text-xs text-muted-foreground font-medium ml-1">E-mail corporativo/pessoal</label>
                            <TextInput
                                id="email"
                                placeholder="joao@exemplo.com"
                                value={email}
                                onValueChange={setEmail}
                                className="mt-1"
                            />
                        </div>

                        <Button
                            size="lg"
                            color="indigo"
                            className="w-full mt-4"
                            loading={isLoading}
                            onClick={handleSubmitEmail}
                        >
                            {isLoading ? 'Enviando...' : 'Enviar Convite 🚀'}
                        </Button>
                    </div>
                )}

                {activeTab === 'link' && (
                    <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground font-medium ml-1">Usos Máximos</label>
                                <TextInput
                                    type="number"
                                    placeholder="Ilimitado"
                                    value={maxUses}
                                    onValueChange={setMaxUses}
                                    className="mt-1"
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-medium ml-1">Expiração (Dias)</label>
                                <TextInput
                                    type="number"
                                    placeholder="Sem validade"
                                    value={expiresInDays}
                                    onValueChange={setExpiresInDays}
                                    className="mt-1"
                                    min={1}
                                    max={30}
                                />
                            </div>
                        </div>

                        <Button
                            size="lg"
                            color="indigo"
                            variant="secondary"
                            className="w-full mt-2"
                            loading={isGenerating}
                            onClick={handleGenerateLink}
                        >
                            Gerar Link
                        </Button>

                        {generatedLink && (
                            <div className="mt-4 p-4 bg-muted border border-border rounded-lg space-y-2 animate-in zoom-in-95 duration-200">
                                <label className="text-xs text-foreground font-medium">Link Gerado:</label>
                                <div className="flex gap-2">
                                    <TextInput
                                        value={generatedLink}
                                        readOnly
                                        className="flex-1"
                                    />
                                    <Button
                                        icon={copied ? Check : Copy}
                                        color={copied ? "emerald" : "zinc"}
                                        onClick={handleCopy}
                                        variant="secondary"
                                        title="Copiar Link"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

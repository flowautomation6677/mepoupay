import { Button, Title, Text } from "@tremor/react";
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
    loading?: boolean;
}

export const DeleteModal = ({ isOpen, onClose, onConfirm, userName, loading }: DeleteModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-red-500/20 rounded-2xl shadow-2xl p-6 max-w-md w-full relative ring-1 ring-red-500/10">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 ring-1 ring-red-500/20">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>

                    <Title className="text-white text-xl font-bold mb-2">Excluir Usuário?</Title>
                    <Text className="text-slate-400 mb-6">
                        Você está prestes a excluir permanentemente o usuário <strong className="text-white">{userName || 'Sem Nome'}</strong>.
                        <br />
                        <span className="text-red-400 text-xs mt-2 block">Essa ação não pode ser desfeita e removerá todos os dados vinculados.</span>
                    </Text>

                    <div className="flex flex-col-reverse sm:flex-row w-full gap-3">
                        <Button
                            variant="secondary"
                            color="slate"
                            className="w-full sm:w-auto sm:flex-1"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            color="red"
                            className="w-full sm:w-auto sm:flex-1"
                            icon={Trash2}
                            loading={loading}
                            onClick={onConfirm}
                        >
                            Excluir Definitivamente
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

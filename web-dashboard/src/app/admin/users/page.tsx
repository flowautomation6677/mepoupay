'use client';

import { useState, useEffect } from 'react';
import {
    Title,
    Text,
    Card,
    Table,
    TableHead,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Badge,
    TextInput,
    Icon,
    Button
} from "@tremor/react";
import { Search, UserCog, User, ShieldCheck, Trash2, CheckCircle, X } from 'lucide-react';
import { createBrowserClient } from "@supabase/ssr";
import { InviteModal } from "@/components/admin/InviteModal";
import { DeleteModal } from "@/components/admin/DeleteModal";

// UX/UI Animation Component
const SuccessModal = ({ isOpen, onClose, email }: { isOpen: boolean; onClose: () => void; email: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="flex flex-col items-center text-center space-y-4 pt-4">
                    <div className="rounded-full bg-green-100 p-3 ring-4 ring-green-50 animate-pulse">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Convite Enviado! 🚀</h3>
                        <p className="text-gray-500 mt-2 text-sm">
                            O link de acesso mágico foi enviado para <br />
                            <span className="font-semibold text-indigo-600">{email}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95 translate-y-0"
                    >
                        Maravilha!
                    </button>
                    <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
                        Fechar janela
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function UsersPage() {
    // ... scope continues ...
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );


    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Fetch Users
    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            } else {
                console.error("Error fetching users:", data.error);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
        setLoading(false);
    }

    // Role Toggle Logic
    async function toggleRole(userId: string, currentStatus: boolean) {
        if (!confirm(`Tem certeza que deseja mudar o status deste usuário para ${currentStatus ? 'USER' : 'ADMIN'}?`)) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isAdmin: !currentStatus })
            });
            const data = await res.json();
            if (data.success) {
                // Defensive update: verify prev exists
                setUsers(prev => (prev || []).map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
                alert("Role atualizada com sucesso!");
            } else {
                alert("Erro ao atualizar: " + data.error);
            }
        } catch (e) {
            alert("Erro desconhecido ao atualizar role.");
        }
    }

    // ... (rest)

    // Filter Users
    const safeUsers = Array.isArray(users) ? users : [];
    const filteredUsers = safeUsers.filter((user) =>
        (user.whatsapp_number && user.whatsapp_number.toLowerCase().includes(search.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(search.toLowerCase())) ||
        (user.name && user.name.toLowerCase().includes(search.toLowerCase())) ||
        // Defensive check for user.id
        (user.id && user.id.toLowerCase().includes(search.toLowerCase()))
    );

    // Utils
    const formatPhoneNumber = (phone: string) => {
        if (!phone) return "Sem número";
        const clean = phone.replace('@c.us', '');
        if (clean.length === 12 || clean.length === 13) {
            const ddd = clean.substring(2, 4);
            const part1 = clean.substring(4, 9);
            const part2 = clean.substring(9);
            return `+55 (${ddd}) ${part1}-${part2}`;
        }
        return clean;
    };

    // Invite Logic
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastInvitedEmail, setLastInvitedEmail] = useState("");

    // Delete Logic
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleInvite(email: string, name: string, whatsapp: string) {
        try {
            const res = await fetch('/api/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, whatsapp })
            });
            const data = await res.json();
            if (data.success) {
                setLastInvitedEmail(email);
                setIsInviteModalOpen(false); // Close Input Modal
                setShowSuccessModal(true);   // Open Success Modal
                fetchUsers(); // Refresh list to show new pending user
            } else {
                alert("Erro ao enviar: " + data.error);
            }
        } catch (e) {
            alert("Erro desconhecido");
        }
    }

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/users?userId=${userToDelete.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                // Success
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                fetchUsers(); // Refresh list
            } else {
                alert("Erro ao deletar: " + data.error);
            }
        } catch (e) {
            alert("Erro de conexão ao deletar.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <InviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onInvite={handleInvite}
            />
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                userName={userToDelete?.name}
                loading={isDeleting}
            />
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                email={lastInvitedEmail}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Title className="text-white text-2xl font-bold flex items-center gap-2">
                        <UserCog className="text-indigo-500" />
                        Gestão de Usuários
                    </Title>
                    <Text className="text-slate-400">Visualize e gerencie todos os usuários cadastrados.</Text>
                </div>
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                    {/* Invite Input Group */}
                    <div>
                        <Button
                            icon={UserCog}
                            color="indigo"
                            onClick={() => setIsInviteModalOpen(true)}
                        >
                            + Convidar Usuário
                        </Button>
                    </div>

                    <TextInput
                        icon={Search}
                        placeholder="Buscar por Nome, Email ou Zap..."
                        value={search}
                        onValueChange={setSearch}
                        className="sm:w-64"
                    />
                </div>
            </div>

            <Card className="glass-card ring-0 overflow-hidden">
                <Table className="mt-5">
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell className="text-slate-300">Usuário</TableHeaderCell>
                            <TableHeaderCell className="text-slate-300">Contato</TableHeaderCell>
                            <TableHeaderCell className="text-slate-300">Meta Financeira</TableHeaderCell>
                            <TableHeaderCell className="text-slate-300">Role</TableHeaderCell>
                            <TableHeaderCell className="text-slate-300">Status</TableHeaderCell>
                            <TableHeaderCell className="text-slate-300">Ações</TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                    Carregando dados completos...
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-white/5 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Text className="text-white font-medium">{user.name || "Sem Nome"}</Text>
                                            <Text className="text-xs text-slate-500 font-mono">ID: {user.id.substring(0, 8)}...</Text>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Text className="text-slate-300 text-sm">{user.email}</Text>
                                            <Text className="text-xs text-slate-500">{formatPhoneNumber(user.whatsapp_number)}</Text>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Text className="text-slate-300">{user.financial_goal || "—"}</Text>
                                    </TableCell>
                                    <TableCell>
                                        {user.is_admin ? (
                                            <Badge icon={ShieldCheck} color="indigo">ADMIN</Badge>
                                        ) : (
                                            <Badge icon={User} color="slate">USER</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Badge size="xs" color="emerald">Ativo</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="xs"
                                                variant="secondary"
                                                color="indigo"
                                                onClick={() => toggleRole(user.id, user.is_admin)}
                                            >
                                                {user.is_admin ? 'Virar User' : 'Virar Admin'}
                                            </Button>

                                            <Button
                                                size="xs"
                                                variant="secondary"
                                                color="red"
                                                icon={Trash2}
                                                onClick={() => {
                                                    setUserToDelete(user);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                            >
                                                Excluir
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="glass-card ring-0 flex items-center justify-between p-4">
                    <Text className="text-slate-400">Total Usuários</Text>
                    <Title className="text-white">{users.length}</Title>
                </Card>
                <Card className="glass-card ring-0 flex items-center justify-between p-4">
                    <Text className="text-slate-400">Admins</Text>
                    <Title className="text-indigo-400">{users.filter(u => u.is_admin).length}</Title>
                </Card>
                <Card className="glass-card ring-0 flex items-center justify-between p-4">
                    <Text className="text-slate-400">Novos (Mês)</Text>
                    <Title className="text-emerald-400">
                        {users.filter(u => {
                            if (!u.created_at) return false;
                            const d = new Date(u.created_at);
                            const now = new Date();
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length}
                    </Title>
                </Card>
            </div>
        </div>
    );
}

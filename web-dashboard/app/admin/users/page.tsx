'use client';
import { Title, Text, Card } from "@tremor/react";

export default function UsersPage() {
    return (
        <div>
            <Title className="text-white text-2xl mb-2">Gestão de Usuários</Title>
            <Text className="text-slate-400 mb-6">Controle total da base de usuários.</Text>
            <Card className="glass-card ring-0">
                <Text className="text-slate-500 text-center italic">Lista de Usuários em desenvolvimento...</Text>
            </Card>
        </div>
    );
}

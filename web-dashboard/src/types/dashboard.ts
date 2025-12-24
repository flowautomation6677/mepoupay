export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
    id: string;
    user_id: string;
    valor: number;
    tipo: TransactionType;
    descricao: string;
    categoria: string;
    data: string;
    created_at?: string;
    is_validated?: boolean;
    confidence_score?: number;
}

export interface UserProfile {
    id: string;
    auth_user_id: string;
    name: string;
    email: string;
    whatsapp_number: string;
    financial_goal?: number;
    created_at?: string;
}

export interface DashboardData {
    profile: UserProfile | null;
    transactions: Transaction[];
    prevTransactions: Partial<Transaction>[];
}

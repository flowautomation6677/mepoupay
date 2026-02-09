export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: TransactionType;
    description: string;
    category: string; // Joined from categories table
    date: string;
    created_at?: string;
    is_validated?: boolean;
    confidence_score?: number;
    metadata?: any;
}

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    tier: string;
    whatsapp_numbers?: string[];
    financial_goal?: number;
    balance?: number;
    created_at?: string;
}

export interface DashboardData {
    profile: UserProfile | null;
    transactions: Transaction[];
    prevTransactions: Partial<Transaction>[];
}

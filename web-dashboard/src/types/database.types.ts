export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    tier: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    tier?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    tier?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            accounts: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH'
                    currency: string
                    initial_balance: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH'
                    currency?: string
                    initial_balance?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    type?: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH'
                    currency?: string
                    initial_balance?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    user_id: string | null
                    name: string
                    icon: string | null
                    is_system_default: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    name: string
                    icon?: string | null
                    is_system_default?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    name?: string
                    icon?: string | null
                    is_system_default?: boolean
                    created_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    user_id: string
                    account_id: string
                    category_id: string | null
                    amount: number
                    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
                    description: string | null
                    date: string
                    metadata: Json | null
                    is_recurring: boolean
                    status: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    account_id: string
                    category_id?: string | null
                    amount: number
                    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
                    description?: string | null
                    date?: string
                    metadata?: Json | null
                    is_recurring?: boolean
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    account_id?: string
                    category_id?: string | null
                    amount?: number
                    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
                    description?: string | null
                    date?: string
                    metadata?: Json | null
                    is_recurring?: boolean
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            analytics_monthly_summary: {
                Row: {
                    user_id: string
                    month: string
                    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
                    category_id: string | null
                    total_amount: number
                    transaction_count: number
                }
            }
        }
    }
}

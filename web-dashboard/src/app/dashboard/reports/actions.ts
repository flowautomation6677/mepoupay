'use server';

import { createClient } from '@/utils/supabase/server';

export type CategoryData = { id: string; name: string; color?: string; icon?: string };

export type ReportSummary = {
    totalRevenue: number;
    totalExpenses: number;
    balance: number;
    totalDiscount: number;
    transactionsByDate: { date: string; income: number; expense: number }[];
    recentDiscounts: { id: string; description: string; gross_amount: number; discount_amount: number; amount: number; date: string }[];
    expensesByCategory: { name: string; value: number; fill: string; categoryId: string }[];
    categories: CategoryData[];
    currentMonth: string;
    currentCategoryId: string;
};

export async function getReportSummaryLive(month?: string, categoryId?: string): Promise<ReportSummary> {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error('Usuário não autenticado');
    }

    // Definir Mês Atual se não houver filtro
    const now = new Date();
    // Ajuste fuso, garantindo pegar YYYY-MM
    const currentMonthVal = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filterCatId = categoryId === 'all' ? '' : (categoryId || '');

    // Construir limites do mês
    const startOfMonth = new Date(`${currentMonthVal}-01T00:00:00.000Z`);
    // Último dia do mês (avança 1 mês e volta 1 dia)
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Buscar Categorias do Usuário
    const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

    const categories: CategoryData[] = categoriesData || [];
    const catMap = new Map<string, CategoryData>();
    categories.forEach(c => catMap.set(c.id, c));

    // 2. Buscar Transações com Filtros
    let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString())
        .order('date', { ascending: false });

    if (filterCatId) {
        query = query.eq('category_id', filterCatId);
    }

    const { data: transactions, error } = await query;

    if (error) {
        console.error('Erro ao buscar transações:', error);
        throw new Error('Falha ao carregar relatórios');
    }

    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalDiscount = 0;

    const dateMap: Record<string, { income: number; expense: number }> = {};
    const categoryExpenseMap: Record<string, number> = {};
    const recentDiscounts: ReportSummary['recentDiscounts'] = [];

    // Gerar Map de cores baseadas nas categorias ou default
    const getColor = (idx: number, customColor?: string) => {
        if (customColor) return customColor;
        const colors = ['#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#14b8a6', '#f97316'];
        return colors[idx % colors.length];
    };

    transactions?.forEach(tx => {
        const amount = Number(tx.amount) || 0;
        const discount = Number(tx.discount_amount) || 0;
        const gross = Number(tx.gross_amount) || amount;
        const dateStr = tx.date ? new Date(tx.date).toISOString().split('T')[0] : 'Desconhecido';

        if (!dateMap[dateStr]) {
            dateMap[dateStr] = { income: 0, expense: 0 };
        }

        if (tx.type === 'INCOME') {
            totalRevenue += amount;
            dateMap[dateStr].income += amount;
        } else {
            totalExpenses += amount;
            dateMap[dateStr].expense += amount;

            // Mapear Gastos por Categoria
            const cId = tx.category_id || 'unassigned';
            if (!categoryExpenseMap[cId]) categoryExpenseMap[cId] = 0;
            categoryExpenseMap[cId] += amount;

            // Retenções (Smart Money)
            if (discount > 0) {
                totalDiscount += discount;
                recentDiscounts.push({
                    id: tx.id,
                    description: tx.description || 'Despesa com desconto',
                    gross_amount: gross,
                    discount_amount: discount,
                    amount: amount,
                    date: tx.date || new Date().toISOString()
                });
            }
        }
    });

    const transactionsByDate = Object.entries(dateMap)
        .toSorted(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(([date, values]) => ({
            date,
            income: values.income,
            expense: values.expense
        }));

    const topDiscounts = recentDiscounts
        .toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    // Formatar Gastos por Categoria para o Recharts
    let catIndex = 0;
    const expensesByCategory = Object.entries(categoryExpenseMap)
        .map(([cId, value]) => {
            const catInfo = catMap.get(cId);
            const name = catInfo?.name || 'Sem Categoria';
            const fill = getColor(catIndex++, catInfo?.color);
            return { name, value, fill, categoryId: cId };
        })
        .toSorted((a, b) => b.value - a.value); // Maiores gastos primeiro

    return {
        totalRevenue,
        totalExpenses,
        balance: totalRevenue - totalExpenses,
        totalDiscount,
        transactionsByDate,
        recentDiscounts: topDiscounts,
        expensesByCategory,
        categories,
        currentMonth: currentMonthVal,
        currentCategoryId: filterCatId || 'all'
    };
}

export type ExportTransaction = {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: string;
    gross_amount?: number;
    discount_amount?: number;
};

export async function exportReportData(month?: string, categoryId?: string): Promise<ExportTransaction[]> {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error('Usuário não autenticado');
    }

    const now = new Date();
    const currentMonthVal = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filterCatId = categoryId === 'all' ? '' : (categoryId || '');

    const startOfMonth = new Date(`${currentMonthVal}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Fetch Categories for mapping names
    const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id);

    const catMap = new Map<string, string>();
    categoriesData?.forEach(c => catMap.set(c.id, c.name));

    // 2. Fetch Transactions
    let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString())
        .order('date', { ascending: true }); // Chronological order is better for exports

    if (filterCatId) {
        query = query.eq('category_id', filterCatId);
    }

    const { data: transactions, error } = await query;

    if (error) {
        console.error('Erro ao buscar transações para exportação:', error);
        throw new Error('Falha ao exportar relatórios');
    }

    // 3. Map to Export Format
    return (transactions || []).map(tx => ({
        id: tx.id,
        date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : 'Desconhecido',
        description: tx.description || 'Sem descrição',
        category: tx.category_id ? (catMap.get(tx.category_id) || 'Desconhecida') : 'Sem Categoria',
        amount: Number(tx.amount) || 0,
        type: tx.type === 'INCOME' ? 'Receita' : 'Despesa',
        gross_amount: Number(tx.gross_amount) || Number(tx.amount) || 0,
        discount_amount: Number(tx.discount_amount) || 0
    }));
}

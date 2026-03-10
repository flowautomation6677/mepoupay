'use server';

import { createClient } from '@/utils/supabase/server';

export type ReportSummary = {
    totalRevenue: number;
    totalExpenses: number;
    balance: number;
    totalDiscount: number;
    transactionsByDate: { date: string; income: number; expense: number }[];
    recentDiscounts: { id: string; description: string; gross_amount: number; discount_amount: number; amount: number; date: string }[];
};

export async function getReportSummaryMock(): Promise<ReportSummary> {
    const supabase = await createClient();

    // Obter usuário logado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error('Usuário não autenticado');
    }

    // Buscar transações (vamos limitar aos últimos 100 dias ou mês atual no mundo real, 
    // mas usarei query geral ordenada por data para esta POC)
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1000);

    if (error) {
        console.error('Erro ao buscar transações:', error);
        throw new Error('Falha ao carregar relatórios');
    }

    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalDiscount = 0;

    // Mapa para o Gráfico
    const dateMap: Record<string, { income: number; expense: number }> = {};

    // Lista de descontos
    const recentDiscounts: ReportSummary['recentDiscounts'] = [];

    transactions?.forEach(tx => {
        const amount = Number(tx.amount) || 0;
        const discount = Number(tx.discount_amount) || 0;
        const gross = Number(tx.gross_amount) || amount;

        // Convert format date YYYY-MM-DD
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

            // Se houver desconto nesta despesa, soma ao Pote "Smart Money"
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

    // Ordenar o mapa por data crescente para o gráfico
    const transactionsByDate = Object.entries(dateMap)
        .toSorted(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(([date, values]) => ({
            date,
            income: values.income,
            expense: values.expense
        }))
        .slice(-30); // Ultimos 30 dias com movimento

    // Filtrar topo dos últimos descontos
    const topDiscounts = recentDiscounts
        .toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    return {
        totalRevenue,
        totalExpenses,
        balance: totalRevenue - totalExpenses,
        totalDiscount,
        transactionsByDate,
        recentDiscounts: topDiscounts
    };
}

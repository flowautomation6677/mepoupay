import React from 'react';
import { render, screen } from '@testing-library/react';
import TransactionFeed from '../TransactionFeed';
import { Transaction } from '@/types/dashboard';

// Mock do Next Router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: jest.fn(),
    }),
}));

describe('TransactionFeed Component', () => {

    it('deve renderizar a data corretamente sem sofrer regressão de fuso horário UTC (05/03 vs 04/03 21:00)', () => {
        // Simulando o UTC shifting bug: uma data vindo do Supabase como 'YYYY-MM-DD'
        // que o JS transformaria em meia-noite UTC e por causa de -3 GMT, viraria 21:00 do dia anterior.

        const mockTransactions: Transaction[] = [
            {
                id: 'mock-1',
                user_id: 'user-1',
                amount: 1000,
                type: 'INCOME',
                description: 'Venda Teste Fuso',
                category: 'Outros',
                date: '2026-03-05', // Data que dava problema de UTC
                is_validated: true,
                confidence_score: 1.0,
            }
        ];

        render(<TransactionFeed transactions={mockTransactions} />);

        // Deve mostrar o grupo de datas com a data local exata (05/03 == 5 de março ou "Ontem"/"Hoje" dependendo do runtime de execução)
        // Para simplificar, como o componente agrupa por Extrato e mostra a data legível,
        // o cabeçalho gerado por `formatDateGroup` deve ser do dia correto.
        // formatDateGroup pode retornar "Hoje", "Ontem" ou "quinta-feira, 05 de março".
        // Vamos garantir que se a data de ontem/hoje não bater com 05/03/2026, ele mostrará o dia 05 em março.

        const datePattern = /hoje|ontem|05 de março/i;

        const headerDate = screen.getByText(datePattern);
        expect(headerDate).toBeInTheDocument();

        // Adicionalmente, vamos garantir que "21:00" MENTIROSO NÃO está no DOM.
        // Antes, `dateStr` puras exibiam a data de volta com -3h
        const wrongTime = screen.queryByText('21:00');
        expect(wrongTime).not.toBeInTheDocument();
    });
});

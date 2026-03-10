import { getReportSummaryMock } from './actions';
import ReportsClient from './ReportsClient';

export const metadata = {
    title: 'Relatórios Detalhados | Me Poupay',
    description: 'Visão consolidada do fluxo de caixa e descontos obtidos.',
};

export default async function ReportsPage() {
    const data = await getReportSummaryMock();

    return (
        <div className="flex h-full w-full">
            <ReportsClient data={data} />
        </div>
    );
}

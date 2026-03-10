import { getReportSummaryLive } from './actions';
import ReportsClient from './ReportsClient';

export const metadata = {
    title: 'Relatórios Detalhados | Me Poupay',
    description: 'Visão consolidada do fluxo de caixa e descontos obtidos.',
};

export default async function ReportsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;

    // Parse filters
    const month = typeof searchParams.month === 'string' ? searchParams.month : undefined;
    const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;

    const data = await getReportSummaryLive(month, category);

    return (
        <div className="flex h-full w-full">
            <ReportsClient data={data} />
        </div>
    );
}

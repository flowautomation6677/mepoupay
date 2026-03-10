'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2, FileJson } from 'lucide-react';
import { generateXlsxBase64, generatePdfBase64 } from './exportServices';
import { exportReportData } from './actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ReportExportProps {
    month: string;
    categoryId: string;
}

export function ReportExport({ month, categoryId }: ReportExportProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDownload = (base64: string, filename: string, mimeType: string) => {
        const link = document.createElement('a');
        link.href = `data:${mimeType};base64,${base64}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const base64 = await generatePdfBase64(month, categoryId);
            handleDownload(base64, `mepoupay-relatorio-${month}.pdf`, 'application/pdf');
        } catch (error) {
            console.error('Erro ao exportar PDF', error);
            alert('Falha ao exportar PDF');
        } finally {
            setIsExporting(false);
            setOpen(false);
        }
    };

    const handleExportXlsx = async () => {
        setIsExporting(true);
        try {
            const base64 = await generateXlsxBase64(month, categoryId);
            handleDownload(base64, `mepoupay-relatorio-${month}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        } catch (error) {
            console.error('Erro ao exportar Excel', error);
            alert('Falha ao exportar Excel');
        } finally {
            setIsExporting(false);
            setOpen(false);
        }
    };

    const handleExportCsv = async () => {
        setIsExporting(true);
        try {
            const data = await exportReportData(month, categoryId);
            const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor Bruto', 'Desconto', 'Valor Final'];
            const rows = data.map(tx => [
                tx.date,
                tx.type,
                tx.category,
                `"${tx.description.replace(/"/g, '""')}"`, // escape quotes for CSV
                tx.gross_amount,
                tx.discount_amount,
                tx.amount
            ]);

            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `mepoupay-relatorio-${month}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Erro ao exportar CSV', error);
            alert('Falha ao exportar CSV');
        } finally {
            setIsExporting(false);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full sm:w-auto mt-4 sm:mt-0 font-medium bg-background border-input hover:bg-accent hover:text-accent-foreground text-foreground flex items-center gap-2"
                    disabled={isExporting}
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Exportar
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[200px] p-2 bg-popover border-border rounded-md shadow-lg">
                <div className="flex flex-col gap-1">
                    <Button variant="ghost" className="justify-start gap-2 h-10 w-full hover:bg-accent" onClick={handleExportPdf}>
                        <FileText className="w-4 h-4 text-emerald-500" />
                        PDF Document
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2 h-10 w-full hover:bg-accent" onClick={handleExportXlsx}>
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        Excel (XLSX)
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2 h-10 w-full hover:bg-accent" onClick={handleExportCsv}>
                        <FileJson className="w-4 h-4 text-emerald-500" />
                        Planilha (CSV)
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

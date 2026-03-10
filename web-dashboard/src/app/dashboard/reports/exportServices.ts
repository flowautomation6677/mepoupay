'use server';

import ExcelJS from 'exceljs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { exportReportData } from './actions';

// ---------------------------------------------------------------------------
// 1. EXPORT TO XLSX (EXCEL)
// ---------------------------------------------------------------------------
export async function generateXlsxBase64(month?: string, categoryId?: string): Promise<string> {
    const data = await exportReportData(month, categoryId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Me Poupay AI';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Relatório Financeiro');

    // Header
    sheet.columns = [
        { header: 'Data', key: 'date', width: 15 },
        { header: 'Tipo', key: 'type', width: 15 },
        { header: 'Categoria', key: 'category', width: 25 },
        { header: 'Descrição', key: 'description', width: 40 },
        { header: 'Valor Bruto', key: 'gross_amount', width: 18 },
        { header: 'Desconto (Smart Money)', key: 'discount_amount', width: 25 },
        { header: 'Valor Líquido', key: 'amount', width: 18 }
    ];

    // Style Header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // Add Data
    data.forEach(tx => {
        const row = sheet.addRow(tx);

        // Colors for positive/negative (Amount Column)
        const cell = row.getCell('amount');
        if (tx.type === 'Receita') {
            cell.font = { color: { argb: 'FF10B981' }, bold: true }; // Emerald
        } else {
            cell.font = { color: { argb: 'FFF43F5E' }, bold: true }; // Rose
        }
    });

    // Formatting as Currency
    const currencyFmt = '"R$" #,##0.00';
    sheet.getColumn('gross_amount').numFmt = currencyFmt;
    sheet.getColumn('discount_amount').numFmt = currencyFmt;
    sheet.getColumn('amount').numFmt = currencyFmt;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer).toString('base64');
}

// ---------------------------------------------------------------------------
// 2. EXPORT TO PDF (PDF-LIB)
// ---------------------------------------------------------------------------
export async function generatePdfBase64(month?: string, categoryId?: string): Promise<string> {
    const data = await exportReportData(month, categoryId);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    const { width, height } = page.getSize();

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yOffset = height - 50;
    const marginX = 50;

    // Header Title
    page.drawText(`Me Poupay - Relatorio Mensal (${month || 'Atual'})`, {
        x: marginX,
        y: yOffset,
        size: 20,
        font: helveticaBold,
        color: rgb(0.06, 0.09, 0.16) // slate-950
    });

    yOffset -= 30;

    // Summary
    const totalReceitas = data.filter(d => d.type === 'Receita').reduce((acc, curr) => acc + curr.amount, 0);
    const totalDespesas = data.filter(d => d.type === 'Despesa').reduce((acc, curr) => acc + curr.amount, 0);
    const totalRetencao = data.reduce((acc, curr) => acc + (curr.discount_amount || 0), 0);
    const saldo = totalReceitas - totalDespesas;

    const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

    page.drawText(`Receitas: ${formatCurrency(totalReceitas)}`, { x: marginX, y: yOffset, size: 12, font: helvetica, color: rgb(0.06, 0.72, 0.5) });
    yOffset -= 15;
    page.drawText(`Despesas: ${formatCurrency(totalDespesas)}`, { x: marginX, y: yOffset, size: 12, font: helvetica, color: rgb(0.95, 0.24, 0.36) });
    yOffset -= 15;
    page.drawText(`Economia (Smart Money): ${formatCurrency(totalRetencao)}`, { x: marginX, y: yOffset, size: 12, font: helvetica, color: rgb(0.06, 0.72, 0.5) });
    yOffset -= 15;
    page.drawText(`Saldo Final: ${formatCurrency(saldo)}`, { x: marginX, y: yOffset, size: 12, font: helveticaBold, color: saldo >= 0 ? rgb(0.06, 0.72, 0.5) : rgb(0.95, 0.24, 0.36) });

    yOffset -= 40;

    // Table Headers
    const col1 = marginX;
    const col2 = marginX + 70;
    const col3 = marginX + 160;
    const col4 = marginX + 350;

    page.drawText('Data', { x: col1, y: yOffset, size: 10, font: helveticaBold });
    page.drawText('Categoria', { x: col2, y: yOffset, size: 10, font: helveticaBold });
    page.drawText('Descrição', { x: col3, y: yOffset, size: 10, font: helveticaBold });
    page.drawText('Valor', { x: col4, y: yOffset, size: 10, font: helveticaBold });

    // Line under headers
    yOffset -= 10;
    page.drawLine({ start: { x: marginX, y: yOffset }, end: { x: width - marginX, y: yOffset }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    yOffset -= 20;

    // Rows
    for (const tx of data) {
        if (yOffset < 50) {
            // New Page needed but avoiding complexity for MVP, just print max allowed. 
            // Real implementation would append page.
            page.drawText('... (Continua) ...', { x: marginX, y: yOffset, size: 10, font: helvetica });
            break;
        }

        const isIncome = tx.type === 'Receita';
        const color = isIncome ? rgb(0.06, 0.72, 0.5) : rgb(0.4, 0.4, 0.4); // Green or Gray text
        const amountColor = isIncome ? rgb(0.06, 0.72, 0.5) : rgb(0.95, 0.24, 0.36); // Green or Rose amount

        // Helper to truncate text
        const truncate = (str: string, max: number) => str.length > max ? str.substring(0, max) + '...' : str;

        page.drawText(tx.date, { x: col1, y: yOffset, size: 9, font: helvetica, color });
        page.drawText(truncate(tx.category, 15), { x: col2, y: yOffset, size: 9, font: helvetica, color });
        page.drawText(truncate(tx.description, 35), { x: col3, y: yOffset, size: 9, font: helvetica, color });
        page.drawText((isIncome ? '+' : '-') + formatCurrency(tx.amount), { x: col4, y: yOffset, size: 9, font: helveticaBold, color: amountColor });

        yOffset -= 20;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes).toString('base64');
}

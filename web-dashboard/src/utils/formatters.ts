export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export function formatPhoneNumber(phone: string) {
    if (!phone) return "Sem número";
    const clean = phone.replace('@c.us', '');
    if (clean.length === 12 || clean.length === 13) {
        const ddd = clean.substring(2, 4);
        const part1 = clean.substring(4, 9);
        const part2 = clean.substring(9);
        return `+55 (${ddd}) ${part1}-${part2}`;
    }
    return clean;
}

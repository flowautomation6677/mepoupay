/**
 * Maps a natural language command to a specific transaction category using simple Regex patterns.
 * @param command The user input string.
 * @returns The matching category exactly as it exists in the database/UI, or null if no match.
 */
export function extractCategoryFromCommand(command: string): string | null {
    if (!command) return null;

    // Normalize input: lower case, remove accents
    const normalizedCmd = command
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '');

    const patterns = [
        {
            category: 'Transporte',
            regex: /\b(uber|99|pop|taxi|gasolina|etanol|onibus|metro|trem|transporte|pedagio)\b/i
        },
        {
            category: 'Alimentação',
            regex: /\b(ifood|rappi|zedelivery|restaurante|jantar|almoco|cafe|padaria|supermercado|mercado|comida|lanche|pizza|burguer)\b/i
        },
        {
            category: 'Moradia',
            regex: /\b(aluguel|condominio|luz|agua|esgoto|gas|internet|celular|telefone|iptu|moradia|casa)\b/i
        },
        {
            category: 'Saúde',
            regex: /\b(farmacia|remedio|medico|consulta|exame|dentista|hospital|saude|terapia|psicologo)\b/i
        },
        {
            category: 'Lazer',
            regex: /\b(cinema|teatro|festa|balada|show|jogo|game|viagem|passagem|passeio|lazer|ingresso)\b/i
        }
    ];

    for (const { category, regex } of patterns) {
        if (regex.test(normalizedCmd)) {
            return category;
        }
    }

    return null;
}

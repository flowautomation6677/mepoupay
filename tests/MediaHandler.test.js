const {
    _isValidSize,
    _determineJobType,
    _isPDF,
    _isOFX,
    _isCSV,
    _isExcel
} = require('../src/handlers/MediaHandler');

describe('MediaHandler - Type Validators', () => {
    describe('_isPDF', () => {
        test('deve identificar PDF por mimetype', () => {
            expect(_isPDF('application/pdf', 'document.dat')).toBe(true);
        });

        test('deve identificar PDF por extensão', () => {
            expect(_isPDF('application/octet-stream', 'invoice.pdf')).toBe(true);
        });

        test('não deve identificar não-PDF', () => {
            expect(_isPDF('application/json', 'data.json')).toBe(false);
        });
    });

    describe('_isOFX', () => {
        test('deve identificar OFX por extensão', () => {
            expect(_isOFX('text/plain', 'statement.ofx')).toBe(true);
        });

        test('deve identificar OFX por mimetype', () => {
            expect(_isOFX('application/x-ofx', 'file.dat')).toBe(true);
        });

        test('não deve identificar não-OFX', () => {
            expect(_isOFX('text/plain', 'file.txt')).toBe(false);
        });
    });

    describe('_isCSV', () => {
        test('deve identificar CSV por extensão', () => {
            expect(_isCSV('text/plain', 'data.csv')).toBe(true);
        });

        test('deve identificar CSV por mimetype', () => {
            expect(_isCSV('text/csv', 'export.dat')).toBe(true);
        });

        test('não deve identificar não-CSV', () => {
            expect(_isCSV('application/json', 'data.json')).toBe(false);
        });
    });

    describe('_isExcel', () => {
        test('deve identificar Excel XLSX por extensão', () => {
            expect(_isExcel('application/octet-stream', 'spreadsheet.xlsx')).toBe(true);
        });

        test('deve identificar Excel XLS por extensão', () => {
            expect(_isExcel('application/octet-stream', 'legacy.xls')).toBe(true);
        });

        test('deve identificar Excel por mimetype (excel)', () => {
            expect(_isExcel('application/vnd.ms-excel', 'file.dat')).toBe(true);
        });

        test('deve identificar Excel por mimetype (spreadsheet)', () => {
            expect(_isExcel('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'file.dat')).toBe(true);
        });

        test('não deve identificar não-Excel', () => {
            expect(_isExcel('text/plain', 'data.txt')).toBe(false);
        });
    });
});

describe('MediaHandler - Utility Functions', () => {
    describe('_isValidSize', () => {
        test('deve aceitar arquivo pequeno', () => {
            const message = { _data: { size: 1024 * 1024 } }; // 1MB
            expect(_isValidSize(message)).toBe(true);
        });

        test('deve aceitar arquivo dentro do limite', () => {
            const message = { _data: { size: 15 * 1024 * 1024 } }; // 15MB (exato)
            expect(_isValidSize(message)).toBe(true);
        });

        test('deve rejeitar arquivo muito grande', () => {
            const message = { _data: { size: 20 * 1024 * 1024 } }; // 20MB
            expect(_isValidSize(message)).toBe(false);
        });

        test('deve aceitar arquivo sem tamanho (default 0)', () => {
            const message = { _data: {} };
            expect(_isValidSize(message)).toBe(true);
        });

        test('deve aceitar limite customizado', () => {
            const message = { _data: { size: 10 * 1024 * 1024 } }; // 10MB
            expect(_isValidSize(message, 5 * 1024 * 1024)).toBe(false); // limite 5MB
        });
    });

    describe('_determineJobType', () => {
        test('deve retornar PROCESS_IMAGE para imagem', () => {
            const message = { type: 'image', body: '' };
            const media = { mimetype: 'image/jpeg', filename: 'photo.jpg' };
            expect(_determineJobType(message, media)).toBe('PROCESS_IMAGE');
        });

        test('deve retornar PROCESS_AUDIO para PTT', () => {
            const message = { type: 'ptt', body: '' };
            const media = { mimetype: 'audio/ogg', filename: 'voice.ogg' };
            expect(_determineJobType(message, media)).toBe('PROCESS_AUDIO');
        });

        test('deve retornar PROCESS_AUDIO para áudio', () => {
            const message = { type: 'audio', body: '' };
            const media = { mimetype: 'audio/mp3', filename: 'song.mp3' };
            expect(_determineJobType(message, media)).toBe('PROCESS_AUDIO');
        });

        test('deve retornar PROCESS_PDF para documento PDF', () => {
            const message = { type: 'document', body: '' };
            const media = { mimetype: 'application/pdf', filename: 'invoice.pdf' };
            expect(_determineJobType(message, media)).toBe('PROCESS_PDF');
        });

        test('deve retornar PROCESS_OFX para arquivo OFX', () => {
            const message = { type: 'document', body: '' };
            const media = { mimetype: 'text/plain', filename: 'statement.ofx' };
            expect(_determineJobType(message, media)).toBe('PROCESS_OFX');
        });

        test('deve retornar PROCESS_CSV para arquivo CSV', () => {
            const message = { type: 'document', body: '' };
            const media = { mimetype: 'text/csv', filename: 'data.csv' };
            expect(_determineJobType(message, media)).toBe('PROCESS_CSV');
        });

        test('deve retornar PROCESS_XLSX para planilha Excel', () => {
            const message = { type: 'document', body: '' };
            const media = { mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: 'report.xlsx' };
            expect(_determineJobType(message, media)).toBe('PROCESS_XLSX');
        });

        test('deve retornar null para tipo não suportado', () => {
            const message = { type: 'document', body: '' };
            const media = { mimetype: 'application/zip', filename: 'archive.zip' };
            expect(_determineJobType(message, media)).toBe(null);
        });

        test('deve retornar null para tipo desconhecido', () => {
            const message = { type: 'sticker', body: '' };
            const media = { mimetype: 'image/webp', filename: 'sticker.webp' };
            expect(_determineJobType(message, media)).toBe(null);
        });
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import FloatingWhatsappButton from '@/components/dashboard/FloatingWhatsappButton';

describe('FloatingWhatsappButton', () => {
    it('deve renderizar o botão flutuante com o link correto para o WhatsApp', () => {
        render(<FloatingWhatsappButton />);
        
        // Verifica se o link foi renderizado (buscamos por um role 'link' ou o contêiner âncora)
        const linkElement = screen.getByRole('link', { name: /falar com o bot/i });
        expect(linkElement).toBeInTheDocument();
        
        // Verifica se o href contém "wa.me"
        expect(linkElement).toHaveAttribute('href', expect.stringContaining('https://wa.me/'));
        
        // Deve abrir em nova aba
        expect(linkElement).toHaveAttribute('target', '_blank');
        expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
    });
});

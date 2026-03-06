import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AiAssistantWidget from '../AiAssistantWidget';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
        form: ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => <form {...props}>{children}</form>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AiAssistantWidget', () => {
    const mockOnCommand = jest.fn();
    const mockOnClear = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should render the input field and the send button', () => {
        render(
            <AiAssistantWidget
                onCommand={mockOnCommand}
                activeFilter={null}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
    });

    it('should call onCommand with the input text after submitting', async () => {
        render(
            <AiAssistantWidget
                onCommand={mockOnCommand}
                activeFilter={null}
                onClear={mockOnClear}
            />
        );

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'gastos com uber' } });
        fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

        // Simulate the 600ms AI processing delay
        jest.advanceTimersByTime(600);

        await waitFor(() => {
            expect(mockOnCommand).toHaveBeenCalledWith('gastos com uber');
        });
    });

    it('should show the active filter badge when activeFilter is set', () => {
        render(
            <AiAssistantWidget
                onCommand={mockOnCommand}
                activeFilter="Transporte"
                onClear={mockOnClear}
            />
        );

        expect(screen.getByText(/Filtro aplicado: Transporte/i)).toBeInTheDocument();
    });

    it('should call onClear when the clear filter button is clicked', () => {
        render(
            <AiAssistantWidget
                onCommand={mockOnCommand}
                activeFilter="Transporte"
                onClear={mockOnClear}
            />
        );

        const clearButton = screen.getByRole('button', { name: /limpar filtro/i });
        fireEvent.click(clearButton);

        expect(mockOnClear).toHaveBeenCalledTimes(1);
    });

    it('should not call onCommand when the input is empty', () => {
        render(
            <AiAssistantWidget
                onCommand={mockOnCommand}
                activeFilter={null}
                onClear={mockOnClear}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

        jest.advanceTimersByTime(600);

        expect(mockOnCommand).not.toHaveBeenCalled();
    });
});

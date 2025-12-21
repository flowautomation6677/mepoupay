import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    test('Redirects unauthenticated user to login page', async ({ page }) => {
        // 1. Tenta acessar a dashboard sem estar logado
        await page.goto('/dashboard');

        // 2. Verifica se foi redirecionado para /login
        // O matcher espera que a URL final contenha "/login"
        await expect(page).toHaveURL(/.*\/login/);

        // 3. Verifica se elementos da página de login estão visíveis
        await expect(page.getByText('Entrar', { exact: true })).toBeVisible(); // Ou outro texto que exista no login
    });

    // Opcional: Teste de sucesso (exige mockar auth do Supabase ou ter usuário de teste)
    // Para este MVP de teste, focamos na segurança (bloqueio).
});

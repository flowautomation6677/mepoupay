/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/shared-invite/route';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('POST /api/shared-invite', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn(),
    eq: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('deve retornar 401 se não estiver autenticado', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });

    const req = new NextRequest('http://localhost:3000/api/shared-invite', {
      method: 'POST',
      body: JSON.stringify({ maxUses: 5, expiresInDays: 7 }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('deve retornar 403 se não for admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    // Simulando que o profile NÃO é admin
    mockSupabase.single.mockResolvedValueOnce({ data: { role: 'user' }, error: null });

    const req = new NextRequest('http://localhost:3000/api/shared-invite', {
      method: 'POST',
      body: JSON.stringify({ maxUses: 5, expiresInDays: 7 }),
    });

    const response = await POST(req);
    expect(response.status).toBe(403);
  });

  it('deve criar um link gerando um novo registro no banco (GREEN)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-123' } }, error: null });
    // Simulando que o profile É admin
    mockSupabase.single.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });
    // Simulando a inserção com sucesso
    mockSupabase.single.mockResolvedValueOnce({
      data: { token: 'token-uuid', max_uses: 5 },
      error: null
    });

    const req = new NextRequest('http://localhost:3000/api/shared-invite', {
      method: 'POST',
      body: JSON.stringify({ maxUses: 5, expiresInDays: 30 }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.link).toContain('token-uuid');
    expect(data.link).toContain('/auth/join?token=');
  });
});

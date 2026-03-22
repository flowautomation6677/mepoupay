/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register-via-link/route';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/utils/supabase/admin', () => ({
  getSupabaseAdmin: jest.fn(),
}));

describe('POST /api/auth/register-via-link', () => {
  const mockAdminSupabase = {
    auth: {
      admin: {
        createUser: jest.fn(),
      }
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    rpc: jest.fn(), // To call increment stored proc or transaction
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mockAdminSupabase);
  });

  it('deve retornar erro 400 se faltar parâmetros', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register-via-link', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc', email: 'test@test.com', password: '123', fullName: 'Test' }), // missing whatsapp
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('deve retornar erro 404 se o token for inválido, expirado ou sem usos (validação no banco)', async () => {
    // DB RPC returns success: false
    mockAdminSupabase.rpc.mockResolvedValueOnce({ data: { success: false, reason: 'not_found_or_inactive' }, error: null });
    
    const req = new NextRequest('http://localhost:3000/api/auth/register-via-link', {
      method: 'POST',
      body: JSON.stringify({
        token: 'invalid-token',
        email: 'test@test.com',
        password: '123',
        fullName: 'Test',
        whatsapp: '(11) 99999-9999'
      }),
    });
    const response = await POST(req);
    expect(response.status).toBe(404);
  });

  it('deve bloquear se o email já estiver cadastrado', async () => {
    // Simulate valid token from RPC check
    mockAdminSupabase.rpc.mockResolvedValueOnce({ data: { success: true, link_id: '123', role: 'user' }, error: null });
    
    // Simulate email clash in profiles
    mockAdminSupabase.single.mockResolvedValueOnce({ data: { id: 'existing' }, error: null });

    const req = new NextRequest('http://localhost:3000/api/auth/register-via-link', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        email: 'exists@test.com',
        password: '123',
        fullName: 'Test',
        whatsapp: '(11) 99999-9999'
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(409); // Conflict
  });

  it('deve simular Race Condition barrando registro se o max_uses estourar no exato milissegundo', async () => {
    // The implementation needs to securely consume the token via RPC to avoid race conditions.
    // If the RPC returns false (meaning consumption failed), we prevent creation.
    mockAdminSupabase.rpc.mockResolvedValueOnce({ 
      data: { success: false, reason: 'limit_reached' }, 
      error: null 
    });

    const req = new NextRequest('http://localhost:3000/api/auth/register-via-link', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        email: 'new@test.com',
        password: '123',
        fullName: 'Test',
        whatsapp: '(11) 99999-9999'
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(429); // or 403 / 404 depending on status logic
  });
  
  it('deve criar usuário e atualizar a contagem do link (GREEN path)', async () => {
    // 1. Valid token and consumed successfully
    mockAdminSupabase.rpc.mockResolvedValueOnce({ 
      data: { success: true, link_id: '123', role: 'user' }, 
      error: null 
    });

    // 2. Profile checking -> no collision
    mockAdminSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    
    // 3. Auth user creation success
    mockAdminSupabase.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: { id: 'new-user-id' } },
      error: null
    });

    const req = new NextRequest('http://localhost:3000/api/auth/register-via-link', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        email: 'new@test.com',
        password: '123',
        fullName: 'Test',
        whatsapp: '(11) 99999-9999'
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    // Devemos chamar createUser
    expect(mockAdminSupabase.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@test.com'
    }));
    // Devemos atualizar/criar o profile via upsert garantindo array de telefones e email
    expect(mockAdminSupabase.upsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'new-user-id',
      email: 'new@test.com',
      whatsapp_numbers: ['5511999999999']
    }));
    // Deve inserir a Carteira Principal
    expect(mockAdminSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Carteira Principal',
      initial_balance: 0
    }));
  });
});

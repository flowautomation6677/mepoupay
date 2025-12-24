import nodemailer from 'nodemailer';
import { Resend } from 'resend';



const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendWelcomeEmail = async (email: string, phone: string) => {
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Bem-vindo ao Me Poupey! 🐷</h1>
      <p>Sua assinatura foi confirmada com sucesso.</p>
      
      <p><strong>Passo 1:</strong> Acesse seu Dashboard:</p>
      <a href="${dashboardUrl}/dashboard" style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar Painel</a>

      <p><strong>Passo 2:</strong> Fale com o Bot no WhatsApp:</p>
      <p>Certifique-se de mandar mensagem usando o número: <strong>${phone}</strong></p>

      <hr/>
      <p style="font-size: 12px; color: #666;">Se você não realizou esta compra, ignore este email.</p>
    </div>
  `;

  // 1. Try Resend SDK
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const data = await resend.emails.send({
        from: 'Me Poupey <nao-responda@mepoupey.flowrocket.com.br>', // Replace with your verified domain
        to: email,
        subject: '🚀 Acesso Liberado: Bem-vindo ao Me Poupey',
        html,
      });
      console.log(`[Resend] Welcome Email sent: ${data.data?.id}`);
      return;
    } catch (error) {
      console.error('[Resend] Error sending welcome email:', error);
    }
  }

  // 2. Fallback to Nodemailer / Mock
  if (!process.env.SMTP_USER) {
    console.log(`[Email Mock] Would send welcome email to ${email} (Phone: ${phone})`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: '"Me Poupey" <noreply@mepoupey.com.br>',
      to: email,
      subject: '🚀 Acesso Liberado: Bem-vindo ao Me Poupey',
      html,
    });
    console.log(`[Nodemailer] Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('[Nodemailer] Error sending email:', error);
  }
};

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #4F46E5;">Redefinição de senha solicitada</h2>
      <p>Recebemos uma solicitação para redefinir sua senha.</p>
      <p>Clique no botão abaixo para criar uma nova senha.</p>
      
      <div style="margin: 24px 0;">
        <a href="${resetLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Criar nova senha</a>
      </div>

      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      
      <p style="font-size: 12px; color: #666;">
        Este link é válido por 30 minutos.<br/>
        Se você não solicitou a redefinição, ignore este e-mail.
      </p>
    </div>
  `;

  // 1. Try Resend SDK
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const data = await resend.emails.send({
        from: 'Me Poupey <nao-responda@mepoupey.flowrocket.com.br>', // Replace with your verified domain
        to: email,
        subject: '🔐 Redefina sua senha',
        html,
      });
      console.log(`[Resend] Password Reset Email sent: ${data.data?.id}`);
      return;
    } catch (error) {
      console.error('[Resend] Error sending password reset email:', error);
      // Fallthrough to fallback logic? Maybe not if we want to force Resend.
      // But let's keep fallback for now.
    }
  }

  // 2. Fallback to Nodemailer / Mock
  if (!process.env.SMTP_USER) {
    console.log(`[Email Mock] Would send password reset email to ${email}`);
    console.log(`[Email Mock] Link: ${resetLink}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: '"Me Poupey" <noreply@mepoupey.com.br>',
      to: email,
      subject: '🔐 Redefina sua senha',
      html,
    });
    console.log(`[Nodemailer] Password reset email sent: ${info.messageId}`);
  } catch (error) {
    console.error('[Nodemailer] Error sending password reset email:', error);
  }
};

export const sendInviteEmail = async (email: string, inviteLink: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #4F46E5;">Convite Especial 🚀</h1>
      <p>Você foi convidado para acessar o <strong>Me Poupey</strong>, sua nova inteligência financeira.</p>
      
      <p>Para ativar sua conta e configurar seu perfil, clique no botão abaixo:</p>
      
      <div style="margin: 24px 0;">
        <a href="${inviteLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Finalizar Cadastro</a>
      </div>

      <p>Se tiver dúvidas, é só responder a este e-mail.</p>

      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      
      <p style="font-size: 12px; color: #666;">
        Este link é único e intransferível.<br/>
        Equipe Me Poupey
      </p>
    </div>
  `;

  // 1. Try Resend SDK
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const data = await resend.emails.send({
        from: 'Me Poupey <nao-responda@mepoupey.flowrocket.com.br>',
        to: email,
        subject: '🚀 Você foi convidado para o Me Poupey!',
        html,
      });
      console.log(`[Resend] Invite Email sent: ${data.data?.id}`);
      return;
    } catch (error) {
      console.error('[Resend] Error sending invite email:', error);
    }
  }

  // 2. Fallback
  if (!process.env.SMTP_USER) {
    console.log(`[Email Mock] Would send invite to ${email}`);
    console.log(`[Email Mock] Link: ${inviteLink}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: '"Me Poupey" <noreply@mepoupey.com.br>',
      to: email,
      subject: '🚀 Você foi convidado para o Me Poupey!',
      html,
    });
    console.log(`[Nodemailer] Invite email sent: ${info.messageId}`);
  } catch (error) {
    console.error('[Nodemailer] Error sending invite email:', error);
  }
};

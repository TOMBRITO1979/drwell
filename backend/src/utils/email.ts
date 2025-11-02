import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.password,
  },
});

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
) => {
  const resetUrl = `${config.urls.frontend}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: config.smtp.from,
    to: email,
    subject: 'Redefinição de Senha - AdvTom',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Redefinição de Senha</h2>
        <p>Você solicitou a redefinição de sua senha.</p>
        <p>Clique no botão abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Redefinir Senha
        </a>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          Este link expira em 1 hora. Se você não solicitou esta redefinição, ignore este email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: config.smtp.from,
    to: email,
    subject: 'Bem-vindo ao AdvTom',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bem-vindo ao AdvTom!</h2>
        <p>Olá ${name},</p>
        <p>Sua conta foi criada com sucesso.</p>
        <p>Acesse o sistema em: <a href="${config.urls.frontend}">${config.urls.frontend}</a></p>
        <p>Atenciosamente,<br>Equipe AdvTom</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateToken, generateResetToken } from '../utils/jwt';
import { sendPasswordResetEmail, sendWelcomeEmail, sendEmailVerification } from '../utils/email';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, companyName, cnpj } = req.body;

      // Verifica se o email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Gera token de verificação de email (válido por 24 horas)
      const emailVerificationToken = generateResetToken();
      const emailVerificationExpiry = new Date(Date.now() + 86400000); // 24 horas

      // Cria a empresa e o usuário admin em uma transação
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: companyName,
            cnpj,
            email,
          },
        });

        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: 'ADMIN',
            companyId: company.id,
            emailVerified: false,
            emailVerificationToken,
            emailVerificationExpiry,
          },
        });

        return { company, user };
      });

      // Envia email de verificação
      try {
        console.log(`📧 Enviando email de verificação para: ${email}`);
        await sendEmailVerification(email, name, emailVerificationToken);
        console.log(`✅ Email de verificação enviado com sucesso para: ${email}`);
      } catch (error: any) {
        console.error('❌ Erro ao enviar email de verificação:', error);
        console.error('Detalhes do erro:', error.message, error.stack);
      }

      res.status(201).json({
        message: 'Cadastro realizado com sucesso! Por favor, verifique seu email para ativar sua conta.',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          companyId: result.user.companyId,
          emailVerified: false,
        },
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ error: 'Erro ao criar conta' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { company: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      if (!user.active) {
        return res.status(401).json({ error: 'Usuário inativo' });
      }

      if (!user.emailVerified) {
        return res.status(401).json({
          error: 'Email não verificado',
          message: 'Por favor, verifique seu email antes de fazer login. Verifique sua caixa de entrada e spam.'
        });
      }

      if (user.company && !user.company.active) {
        return res.status(401).json({ error: 'Empresa inativa' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId || undefined,
      });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          companyName: user.company?.name,
        },
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Por segurança, não revela se o email existe
        return res.json({ message: 'Se o email existir, um link de redefinição foi enviado' });
      }

      const resetToken = generateResetToken();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      console.log(`📧 Enviando email de reset de senha para: ${email}`);
      await sendPasswordResetEmail(email, resetToken);
      console.log(`✅ Email de reset de senha enviado com sucesso para: ${email}`);

      res.json({ message: 'Se o email existir, um link de redefinição foi enviado' });
    } catch (error) {
      console.error('Erro ao solicitar reset:', error);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return res.status(400).json({ error: 'Token inválido ou expirado' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  }

  async me(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token não fornecido' });
      }

      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerificationExpiry: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return res.status(400).json({
          error: 'Token inválido ou expirado',
          message: 'O link de verificação é inválido ou expirou. Por favor, solicite um novo link.'
        });
      }

      // Verifica o email do usuário
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });

      // Envia email de boas-vindas após verificação
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (error) {
        console.error('Erro ao enviar email de boas-vindas:', error);
      }

      res.json({
        message: 'Email verificado com sucesso! Você já pode fazer login no sistema.',
        success: true
      });
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      res.status(500).json({ error: 'Erro ao verificar email' });
    }
  }

  async resendVerificationEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Por segurança, não revela se o email existe
        return res.json({ message: 'Se o email existir e não estiver verificado, um novo link foi enviado' });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: 'Este email já foi verificado' });
      }

      // Gera novo token de verificação
      const emailVerificationToken = generateResetToken();
      const emailVerificationExpiry = new Date(Date.now() + 86400000); // 24 horas

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken,
          emailVerificationExpiry,
        },
      });

      await sendEmailVerification(email, user.name, emailVerificationToken);

      res.json({ message: 'Se o email existir e não estiver verificado, um novo link foi enviado' });
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  }
}

export default new AuthController();

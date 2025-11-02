import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

export class CompanyController {
  // Super Admin - Listar todas as empresas
  async list(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = {
        ...(search && {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' as const } },
            { email: { contains: String(search), mode: 'insensitive' as const } },
            { cnpj: { contains: String(search) } },
          ],
        }),
      };

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                users: true,
                clients: true,
                cases: true,
              },
            },
          },
        }),
        prisma.company.count({ where }),
      ]);

      res.json({
        data: companies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Erro ao listar empresas:', error);
      res.status(500).json({ error: 'Erro ao listar empresas' });
    }
  }

  // Super Admin - Criar empresa e admin
  async create(req: AuthRequest, res: Response) {
    try {
      const { companyName, cnpj, companyEmail, adminName, adminEmail, adminPassword } = req.body;

      // Verifica se o email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email do admin já cadastrado' });
      }

      // Verifica se o CNPJ já existe
      if (cnpj) {
        const existingCompany = await prisma.company.findUnique({
          where: { cnpj },
        });

        if (existingCompany) {
          return res.status(400).json({ error: 'CNPJ já cadastrado' });
        }
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: companyName,
            cnpj,
            email: companyEmail,
          },
        });

        const admin = await tx.user.create({
          data: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            companyId: company.id,
          },
        });

        return { company, admin };
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      res.status(500).json({ error: 'Erro ao criar empresa' });
    }
  }

  // Super Admin - Atualizar empresa
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, cnpj, email, phone, address, city, state, zipCode, logo, active } = req.body;

      const company = await prisma.company.update({
        where: { id },
        data: {
          name,
          cnpj,
          email,
          phone,
          address,
          city,
          state,
          zipCode,
          logo,
          active,
        },
      });

      res.json(company);
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      res.status(500).json({ error: 'Erro ao atualizar empresa' });
    }
  }

  // Admin - Ver sua própria empresa
  async getOwn(req: AuthRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;

      if (!companyId) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              cases: true,
            },
          },
        },
      });

      res.json(company);
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
  }

  // Admin - Atualizar sua própria empresa (configurações)
  async updateOwn(req: AuthRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { name, email, phone, address, city, state, zipCode, logo } = req.body;

      if (!companyId) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      const company = await prisma.company.update({
        where: { id: companyId },
        data: {
          name,
          email,
          phone,
          address,
          city,
          state,
          zipCode,
          logo,
        },
      });

      res.json(company);
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      res.status(500).json({ error: 'Erro ao atualizar empresa' });
    }
  }
}

export default new CompanyController();

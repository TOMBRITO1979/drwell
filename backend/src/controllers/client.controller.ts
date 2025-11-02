import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export class ClientController {
  async create(req: AuthRequest, res: Response) {
    try {
      const {
        name, cpf, rg, email, phone, address, city, state, zipCode,
        profession, maritalStatus, birthDate, notes
      } = req.body;
      const companyId = req.user!.companyId;

      if (!companyId) {
        return res.status(403).json({ error: 'Usuário não possui empresa associada' });
      }

      const client = await prisma.client.create({
        data: {
          companyId,
          name,
          cpf,
          rg,
          email,
          phone,
          address,
          city,
          state,
          zipCode,
          profession,
          maritalStatus,
          birthDate: birthDate ? new Date(birthDate) : null,
          notes,
        },
      });

      res.status(201).json(client);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { page = 1, limit = 10, search = '' } = req.query;

      if (!companyId) {
        return res.status(403).json({ error: 'Usuário não possui empresa associada' });
      }

      const skip = (Number(page) - 1) * Number(limit);

      const where = {
        companyId,
        active: true,
        ...(search && {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' as const } },
            { cpf: { contains: String(search) } },
            { email: { contains: String(search), mode: 'insensitive' as const } },
          ],
        }),
      };

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.client.count({ where }),
      ]);

      res.json({
        data: clients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  }

  async get(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const client = await prisma.client.findFirst({
        where: {
          id,
          companyId: companyId!,
        },
        include: {
          cases: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      res.json(client);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;
      const {
        name, cpf, rg, email, phone, address, city, state, zipCode,
        profession, maritalStatus, birthDate, notes
      } = req.body;

      const client = await prisma.client.findFirst({
        where: {
          id,
          companyId: companyId!,
        },
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const updatedClient = await prisma.client.update({
        where: { id },
        data: {
          name,
          cpf,
          rg,
          email,
          phone,
          address,
          city,
          state,
          zipCode,
          profession,
          maritalStatus,
          birthDate: birthDate ? new Date(birthDate) : null,
          notes,
        },
      });

      res.json(updatedClient);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const client = await prisma.client.findFirst({
        where: {
          id,
          companyId: companyId!,
        },
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      await prisma.client.update({
        where: { id },
        data: { active: false },
      });

      res.json({ message: 'Cliente desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
  }
}

export default new ClientController();

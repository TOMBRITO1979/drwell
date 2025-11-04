import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import datajudService from '../services/datajud.service';
import { parse } from 'csv-parse/sync';

export class CaseController {
  // Função helper para formatar o último movimento
  private getUltimoAndamento(movimentos: any[]): string | null {
    if (!movimentos || movimentos.length === 0) return null;

    // Ordena por data decrescente e pega o mais recente
    const sorted = [...movimentos].sort((a, b) =>
      new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    );

    const ultimo = sorted[0];
    const data = new Date(ultimo.dataHora).toLocaleDateString('pt-BR');
    return `${ultimo.nome} - ${data}`;
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { clientId, processNumber, court, subject, value, notes, informarCliente, linkProcesso } = req.body;
      const companyId = req.user!.companyId;

      if (!companyId) {
        return res.status(403).json({ error: 'Usuário não possui empresa associada' });
      }

      // Verifica se o cliente pertence à mesma empresa
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          companyId,
        },
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Verifica se o processo já existe
      const existingCase = await prisma.case.findUnique({
        where: { processNumber },
      });

      if (existingCase) {
        return res.status(400).json({ error: 'Número de processo já cadastrado' });
      }

      // Tenta buscar dados do processo no DataJud
      let datajudData = null;
      try {
        datajudData = await datajudService.searchCaseAllTribunals(processNumber);
      } catch (error) {
        console.error('Erro ao buscar no DataJud:', error);
      }

      // Formata o último andamento se houver dados do DataJud
      const ultimoAndamento = datajudData?.movimentos
        ? this.getUltimoAndamento(datajudData.movimentos)
        : null;

      // Cria o processo
      const caseData = await prisma.case.create({
        data: {
          companyId,
          clientId,
          processNumber,
          court: court || datajudData?.tribunal || '',
          subject: subject || datajudData?.assuntos?.[0]?.nome || '',
          value,
          notes,
          ultimoAndamento,
          informarCliente: informarCliente || false,
          linkProcesso: linkProcesso || null,
          lastSyncedAt: datajudData ? new Date() : null,
        },
      });

      // Se encontrou dados no DataJud, cria as movimentações
      if (datajudData?.movimentos && datajudData.movimentos.length > 0) {
        await prisma.caseMovement.createMany({
          data: datajudData.movimentos.map((mov) => ({
            caseId: caseData.id,
            movementCode: mov.codigo,
            movementName: mov.nome,
            movementDate: new Date(mov.dataHora),
            description: mov.complementosTabelados
              ?.map((c) => `${c.nome}: ${c.descricao}`)
              .join('; '),
          })),
        });
      }

      // Retorna o processo com as movimentações
      const caseWithMovements = await prisma.case.findUnique({
        where: { id: caseData.id },
        include: {
          client: true,
          movements: {
            orderBy: { movementDate: 'desc' },
          },
        },
      });

      res.status(201).json(caseWithMovements);
    } catch (error) {
      console.error('Erro ao criar processo:', error);
      res.status(500).json({ error: 'Erro ao criar processo' });
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { page = 1, limit = 10, search = '', status = '' } = req.query;

      if (!companyId) {
        return res.status(403).json({ error: 'Usuário não possui empresa associada' });
      }

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        companyId,
        ...(status && { status: String(status) }),
        ...(search && {
          OR: [
            { processNumber: { contains: String(search) } },
            { subject: { contains: String(search), mode: 'insensitive' } },
            { client: { name: { contains: String(search), mode: 'insensitive' } } },
          ],
        }),
      };

      const [cases, total] = await Promise.all([
        prisma.case.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                cpf: true,
              },
            },
            _count: {
              select: {
                movements: true,
              },
            },
          },
        }),
        prisma.case.count({ where }),
      ]);

      res.json({
        data: cases,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Erro ao listar processos:', error);
      res.status(500).json({ error: 'Erro ao listar processos' });
    }
  }

  async get(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const caseData = await prisma.case.findFirst({
        where: {
          id,
          companyId: companyId!,
        },
        include: {
          client: true,
          movements: {
            orderBy: { movementDate: 'desc' },
          },
          documents: {
            orderBy: { createdAt: 'desc' },
          },
          parts: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!caseData) {
        return res.status(404).json({ error: 'Processo não encontrado' });
      }

      res.json(caseData);
    } catch (error) {
      console.error('Erro ao buscar processo:', error);
      res.status(500).json({ error: 'Erro ao buscar processo' });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;
      const { court, subject, value, status, notes, informarCliente, linkProcesso } = req.body;

      const caseData = await prisma.case.findFirst({
        where: {
          id,
          companyId: companyId!,
        },
      });

      if (!caseData) {
        return res.status(404).json({ error: 'Processo não encontrado' });
      }

      const updatedCase = await prisma.case.update({
        where: { id },
        data: {
          court,
          subject,
          value,
          status,
          notes,
          ...(informarCliente !== undefined && { informarCliente }),
          ...(linkProcesso !== undefined && { linkProcesso }),
        },
      });

      res.json(updatedCase);
    } catch (error) {
      console.error('Erro ao atualizar processo:', error);
      res.status(500).json({ error: 'Erro ao atualizar processo' });
    }
  }

  async syncMovements(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const caseData = await prisma.case.findFirst({
        where: {
          id,
          companyId: companyId!,
        },
      });

      if (!caseData) {
        return res.status(404).json({ error: 'Processo não encontrado' });
      }

      // Busca dados atualizados no DataJud
      const datajudData = await datajudService.searchCaseAllTribunals(
        caseData.processNumber
      );

      if (!datajudData) {
        return res.status(404).json({ error: 'Processo não encontrado no DataJud' });
      }

      // Deleta movimentações antigas
      await prisma.caseMovement.deleteMany({
        where: { caseId: id },
      });

      // Cria as novas movimentações
      if (datajudData.movimentos && datajudData.movimentos.length > 0) {
        await prisma.caseMovement.createMany({
          data: datajudData.movimentos.map((mov) => ({
            caseId: id,
            movementCode: mov.codigo,
            movementName: mov.nome,
            movementDate: new Date(mov.dataHora),
            description: mov.complementosTabelados
              ?.map((c) => `${c.nome}: ${c.descricao}`)
              .join('; '),
          })),
        });
      }

      // Formata o último andamento
      const ultimoAndamento = datajudData.movimentos
        ? this.getUltimoAndamento(datajudData.movimentos)
        : null;

      // Atualiza a data de sincronização e o último andamento
      await prisma.case.update({
        where: { id },
        data: {
          lastSyncedAt: new Date(),
          ultimoAndamento,
        },
      });

      // Retorna o processo atualizado
      const updatedCase = await prisma.case.findUnique({
        where: { id },
        include: {
          movements: {
            orderBy: { movementDate: 'desc' },
          },
        },
      });

      res.json(updatedCase);
    } catch (error) {
      console.error('Erro ao sincronizar movimentações:', error);
      res.status(500).json({ error: 'Erro ao sincronizar movimentações' });
    }
  }

  async exportCSV(req: AuthRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;

      if (!companyId) {
        return res.status(403).json({ error: 'Usuário não possui empresa associada' });
      }

      // Buscar todos os processos com informações do cliente
      const cases = await prisma.case.findMany({
        where: {
          companyId,
        },
        include: {
          client: {
            select: {
              name: true,
              cpf: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Cabeçalho do CSV
      const csvHeader = 'Número do Processo,Cliente,CPF Cliente,Tribunal,Assunto,Valor,Status,Última Sincronização,Data de Cadastro,Observações\n';

      // Linhas do CSV
      const csvRows = cases.map(caseItem => {
        const processNumber = `"${caseItem.processNumber || ''}"`;
        const clientName = `"${caseItem.client?.name || ''}"`;
        const clientCpf = `"${caseItem.client?.cpf || ''}"`;
        const court = `"${caseItem.court || ''}"`;
        const subject = `"${caseItem.subject || ''}"`;
        const value = caseItem.value ? `"R$ ${caseItem.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"` : '""';
        const status = `"${caseItem.status || ''}"`;
        const lastSyncedAt = caseItem.lastSyncedAt ? `"${new Date(caseItem.lastSyncedAt).toLocaleString('pt-BR')}"` : '""';
        const createdAt = `"${new Date(caseItem.createdAt).toLocaleDateString('pt-BR')}"`;
        const notes = `"${(caseItem.notes || '').replace(/"/g, '""')}"`;

        return `${processNumber},${clientName},${clientCpf},${court},${subject},${value},${status},${lastSyncedAt},${createdAt},${notes}`;
      }).join('\n');

      const csv = csvHeader + csvRows;

      // Configurar headers para download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=processos_${new Date().toISOString().split('T')[0]}.csv`);

      // Adicionar BOM para Excel reconhecer UTF-8
      res.send('\ufeff' + csv);
    } catch (error) {
      console.error('Erro ao exportar processos:', error);
      res.status(500).json({ error: 'Erro ao exportar processos' });
    }
  }

  async importCSV(req: AuthRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;

      if (!companyId) {
        return res.status(403).json({ error: 'Usuário não possui empresa associada' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      // Remover BOM se existir
      const csvContent = req.file.buffer.toString('utf-8').replace(/^\ufeff/, '');

      // Parse do CSV
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      const results = {
        total: records.length,
        success: 0,
        errors: [] as { line: number; processNumber: string; error: string }[],
      };

      // Processar cada linha
      for (let i = 0; i < records.length; i++) {
        const record = records[i] as any;
        const lineNumber = i + 2;

        try {
          // Validar campos obrigatórios
          if (!record['Número do Processo'] || record['Número do Processo'].trim() === '') {
            results.errors.push({
              line: lineNumber,
              processNumber: record['Número do Processo'] || '(vazio)',
              error: 'Número do processo é obrigatório',
            });
            continue;
          }

          if (!record['CPF Cliente'] && !record['Cliente']) {
            results.errors.push({
              line: lineNumber,
              processNumber: record['Número do Processo'],
              error: 'CPF ou Nome do cliente é obrigatório',
            });
            continue;
          }

          // Buscar cliente pelo CPF ou nome
          const client = await prisma.client.findFirst({
            where: {
              companyId,
              OR: [
                { cpf: record['CPF Cliente']?.trim() },
                { name: record['Cliente']?.trim() },
              ],
            },
          });

          if (!client) {
            results.errors.push({
              line: lineNumber,
              processNumber: record['Número do Processo'],
              error: `Cliente não encontrado (CPF: ${record['CPF Cliente'] || 'N/A'}, Nome: ${record['Cliente'] || 'N/A'})`,
            });
            continue;
          }

          // Verificar se processo já existe
          const existingCase = await prisma.case.findUnique({
            where: { processNumber: record['Número do Processo'].trim() },
          });

          if (existingCase) {
            results.errors.push({
              line: lineNumber,
              processNumber: record['Número do Processo'],
              error: 'Número de processo já cadastrado',
            });
            continue;
          }

          // Converter valor se existir
          let value = null;
          if (record.Valor) {
            const valueStr = record.Valor.replace(/[R$\s.]/g, '').replace(',', '.');
            value = parseFloat(valueStr);
            if (isNaN(value)) {
              value = null;
            }
          }

          // Criar processo
          await prisma.case.create({
            data: {
              companyId,
              clientId: client.id,
              processNumber: record['Número do Processo'].trim(),
              court: record.Tribunal?.trim() || '',
              subject: record.Assunto?.trim() || '',
              value,
              status: record.Status?.trim() || 'ACTIVE',
              notes: record['Observações']?.trim() || null,
            },
          });

          results.success++;
        } catch (error: any) {
          results.errors.push({
            line: lineNumber,
            processNumber: record['Número do Processo'] || '(vazio)',
            error: error.message || 'Erro desconhecido',
          });
        }
      }

      res.json({
        message: 'Importação concluída',
        results,
      });
    } catch (error) {
      console.error('Erro ao importar processos:', error);
      res.status(500).json({ error: 'Erro ao importar processos' });
    }
  }
}

export default new CaseController();

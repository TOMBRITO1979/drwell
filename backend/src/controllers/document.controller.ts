import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

// Listar documentos com filtros e paginação
export const listDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const { search, clientId, caseId, storageType, page = 1, limit = 50 } = req.query;
    const companyId = req.user!.companyId;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { companyId };

    // Filtro por busca (nome do documento)
    if (search) {
      where.name = { contains: String(search), mode: 'insensitive' };
    }

    // Filtro por cliente
    if (clientId) {
      where.clientId = String(clientId);
    }

    // Filtro por processo
    if (caseId) {
      where.caseId = String(caseId);
    }

    // Filtro por tipo de armazenamento
    if (storageType && (storageType === 'upload' || storageType === 'link')) {
      where.storageType = storageType;
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              cpf: true,
            },
          },
          case: {
            select: {
              id: true,
              processNumber: true,
              subject: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      data: documents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ error: 'Erro ao listar documentos' });
  }
};

// Buscar documento por ID
export const getDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const document = await prisma.document.findFirst({
      where: { id, companyId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpf: true,
          },
        },
        case: {
          select: {
            id: true,
            processNumber: true,
            subject: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    res.json(document);
  } catch (error: any) {
    console.error('Erro ao buscar documento:', error);
    res.status(500).json({ error: 'Erro ao buscar documento' });
  }
};

// Criar novo documento
export const createDocument = async (req: AuthRequest, res: Response) => {
  try {
    const {
      caseId,
      clientId,
      name,
      description,
      storageType,
      fileUrl,
      fileKey,
      fileSize,
      fileType,
      externalUrl,
      externalType,
    } = req.body;

    const companyId = req.user!.companyId!;
    const uploadedBy = req.user!.userId;

    // Validações
    if (!name) {
      return res.status(400).json({ error: 'Nome do documento é obrigatório' });
    }

    if (!storageType || (storageType !== 'upload' && storageType !== 'link')) {
      return res.status(400).json({ error: 'Tipo de armazenamento inválido' });
    }

    // Deve ter caseId OU clientId
    if (!caseId && !clientId) {
      return res.status(400).json({ error: 'É necessário informar um cliente ou processo' });
    }

    if (caseId && clientId) {
      return res.status(400).json({ error: 'Informe apenas um: cliente ou processo' });
    }

    // Validações específicas por tipo de armazenamento
    if (storageType === 'upload' && !fileUrl) {
      return res.status(400).json({ error: 'URL do arquivo é obrigatória para upload' });
    }

    if (storageType === 'link' && !externalUrl) {
      return res.status(400).json({ error: 'URL externa é obrigatória para link' });
    }

    // Verificar se cliente/processo pertencem à empresa do usuário
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: { id: clientId, companyId },
      });
      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
    }

    if (caseId) {
      const caseRecord = await prisma.case.findFirst({
        where: { id: caseId, companyId },
      });
      if (!caseRecord) {
        return res.status(404).json({ error: 'Processo não encontrado' });
      }
    }

    const document = await prisma.document.create({
      data: {
        companyId,
        caseId: caseId || null,
        clientId: clientId || null,
        name,
        description: description || null,
        storageType,
        fileUrl: fileUrl || null,
        fileKey: fileKey || null,
        fileSize: fileSize || null,
        fileType: fileType || null,
        externalUrl: externalUrl || null,
        externalType: externalType || null,
        uploadedBy,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpf: true,
          },
        },
        case: {
          select: {
            id: true,
            processNumber: true,
            subject: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(document);
  } catch (error: any) {
    console.error('Erro ao criar documento:', error);
    res.status(500).json({ error: 'Erro ao criar documento' });
  }
};

// Atualizar documento
export const updateDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      externalUrl,
      externalType,
    } = req.body;

    const companyId = req.user!.companyId;

    // Verificar se documento existe e pertence à empresa
    const existingDocument = await prisma.document.findFirst({
      where: { id, companyId },
    });

    if (!existingDocument) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    // Apenas atualizar campos editáveis
    const document = await prisma.document.update({
      where: { id },
      data: {
        name: name || existingDocument.name,
        description: description !== undefined ? description : existingDocument.description,
        externalUrl: externalUrl !== undefined ? externalUrl : existingDocument.externalUrl,
        externalType: externalType !== undefined ? externalType : existingDocument.externalType,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpf: true,
          },
        },
        case: {
          select: {
            id: true,
            processNumber: true,
            subject: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(document);
  } catch (error: any) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ error: 'Erro ao atualizar documento' });
  }
};

// Excluir documento
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    // Verificar se documento existe e pertence à empresa
    const document = await prisma.document.findFirst({
      where: { id, companyId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    // TODO: Se for upload, excluir arquivo do S3
    // if (document.storageType === 'upload' && document.fileKey) {
    //   await deleteFromS3(document.fileKey);
    // }

    await prisma.document.delete({
      where: { id },
    });

    res.json({ message: 'Documento excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir documento:', error);
    res.status(500).json({ error: 'Erro ao excluir documento' });
  }
};

// Buscar documentos por cliente ou processo (para autocomplete)
export const searchDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, caseId } = req.query;
    const companyId = req.user!.companyId;

    if (!clientId && !caseId) {
      return res.status(400).json({ error: 'É necessário informar clientId ou caseId' });
    }

    const where: any = { companyId };

    if (clientId) {
      where.clientId = String(clientId);
    }

    if (caseId) {
      where.caseId = String(caseId);
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpf: true,
          },
        },
        case: {
          select: {
            id: true,
            processNumber: true,
            subject: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(documents);
  } catch (error: any) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos' });
  }
};

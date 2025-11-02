import axios from 'axios';
import { config } from '../config';

export interface DatajudMovement {
  codigo: number;
  nome: string;
  dataHora: string;
  complementosTabelados?: Array<{
    codigo: number;
    valor: number;
    nome: string;
    descricao: string;
  }>;
}

export interface DatajudCase {
  numeroProcesso: string;
  classe?: {
    codigo: number;
    nome: string;
  };
  tribunal: string;
  dataAjuizamento?: string;
  dataHoraUltimaAtualizacao?: string;
  assuntos?: Array<{
    codigo: number;
    nome: string;
  }>;
  orgaoJulgador?: {
    codigo: number;
    nome: string;
  };
  movimentos?: DatajudMovement[];
}

export class DatajudService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.datajud.apiKey;
    this.baseUrl = config.datajud.baseUrl;
  }

  async searchCase(processNumber: string, tribunal: string = 'tjrj'): Promise<DatajudCase | null> {
    try {
      const url = `${this.baseUrl}/api_publica_${tribunal}/_search`;

      const response = await axios.post(
        url,
        {
          query: {
            match: {
              numeroProcesso: processNumber.replace(/\D/g, ''), // Remove caracteres não numéricos
            },
          },
        },
        {
          headers: {
            Authorization: `ApiKey ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.hits?.hits?.length > 0) {
        return response.data.hits.hits[0]._source as DatajudCase;
      }

      return null;
    } catch (error) {
      console.error('Erro ao consultar DataJud:', error);
      throw new Error('Erro ao consultar processo no DataJud');
    }
  }

  async searchCaseAllTribunals(processNumber: string): Promise<DatajudCase | null> {
    const tribunals = ['tjrj', 'tjsp', 'tjmg', 'trf1', 'trf2', 'trf3', 'trf4', 'trf5'];

    for (const tribunal of tribunals) {
      try {
        const result = await this.searchCase(processNumber, tribunal);
        if (result) {
          return result;
        }
      } catch (error) {
        // Continua para o próximo tribunal
        continue;
      }
    }

    return null;
  }
}

export default new DatajudService();

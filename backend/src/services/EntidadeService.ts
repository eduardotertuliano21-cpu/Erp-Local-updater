import { EntidadeRepository, Entidade } from '../repositories/EntidadeRepository.js';
import crypto from 'node:crypto';

export class EntidadeService {
  constructor(private entidadeRepo: EntidadeRepository) {}

  public listar(tipo?: string, termo?: string): Entidade[] {
    return this.entidadeRepo.listar(tipo, termo);
  }

  public buscarPorId(id: string): Entidade | null {
    return this.entidadeRepo.buscarPorId(id);
  }

  public salvar(dados: Partial<Entidade>): Entidade {
    if (!dados.razao_social || !dados.tipo) {
      throw new Error('Tipo e Razão Social / Nome são campos obrigatórios.');
    }

    let cpfCnpjLimpo = dados.cpf_cnpj ? dados.cpf_cnpj.replace(/\D/g, '') : '';
    if (!cpfCnpjLimpo) {
      if (dados.tipo === 'FUNCIONARIO') {
        cpfCnpjLimpo = dados.matricula ? dados.matricula.trim() : `FUNC-${Date.now().toString().slice(-6)}`;
      } else {
        throw new Error('Tipo, Razão Social/Nome e CPF/CNPJ são campos obrigatórios.');
      }
    }

    const entidade: Entidade = {
      id: dados.id || crypto.randomUUID(),
      tipo: dados.tipo,
      razao_social: dados.razao_social.trim().toUpperCase(),
      nome_fantasia: dados.nome_fantasia ? dados.nome_fantasia.trim().toUpperCase() : undefined,
      cpf_cnpj: cpfCnpjLimpo,
      ie_rg: dados.ie_rg ? dados.ie_rg.trim() : undefined,
      email: dados.email ? dados.email.trim().toLowerCase() : undefined,
      telefone: dados.telefone ? dados.telefone.trim() : undefined,
      endereco: dados.endereco ? dados.endereco.trim() : undefined,
      limite_credito: Number(dados.limite_credito) || 0,
      saldo_devedor: Number(dados.saldo_devedor) || 0,
      cargo: dados.cargo ? dados.cargo.trim().toUpperCase() : (dados.tipo === 'FUNCIONARIO' ? 'VENDEDOR' : undefined),
      matricula: dados.matricula ? dados.matricula.trim() : undefined,
      pin: dados.pin ? dados.pin.trim() : (dados.tipo === 'FUNCIONARIO' ? '1234' : undefined),
      comissao_percentual: Number(dados.comissao_percentual) || 0,
      limite_desconto: Number(dados.limite_desconto) || 0,
      ativo: dados.ativo !== undefined ? Number(dados.ativo) : 1,
    };

    this.entidadeRepo.salvar(entidade);
    return entidade;
  }
}

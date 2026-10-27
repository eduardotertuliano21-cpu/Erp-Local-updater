import { getCatalogoReadOnlyDb, getCatalogoWriterDb } from '../config/database.js';

export interface ConfigOperacao {
  id: string;
  desconto_maximo_operador: number;
  exigir_gerente_desconto: number;
  permitir_alterar_preco: number;
  abertura_gaveta_sem_venda: number;
  estoque_negativo: 'BLOQUEAR' | 'AVISAR' | 'PERMITIR';
  agrupar_itens_repetidos: number;
  foco_balanca_automatico: number;
  comportamento_impressao: 'SEMPRE' | 'PERGUNTAR' | 'NAO_IMPRIMIR';
  pagamento_padrao: 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';
  exibir_fotos_busca: number;
  som_bip_sistema: number;
  parametros_extras?: string;
  atualizado_em?: string;
}

export const defaultConfigOperacao: ConfigOperacao = {
  id: 'default',
  desconto_maximo_operador: 5.0,
  exigir_gerente_desconto: 0,
  permitir_alterar_preco: 0,
  abertura_gaveta_sem_venda: 1,
  estoque_negativo: 'AVISAR',
  agrupar_itens_repetidos: 1,
  foco_balanca_automatico: 1,
  comportamento_impressao: 'PERGUNTAR',
  pagamento_padrao: 'DINHEIRO',
  exibir_fotos_busca: 0,
  som_bip_sistema: 1,
};

export class ConfigOperacaoRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  public obter(): ConfigOperacao {
    try {
      const stmt = this.readDb.prepare('SELECT * FROM config_operacao WHERE id = ? LIMIT 1');
      const row = stmt.get('default') as unknown as ConfigOperacao | undefined;
      return row ? { ...defaultConfigOperacao, ...row } : defaultConfigOperacao;
    } catch {
      return defaultConfigOperacao;
    }
  }

  public salvar(dados: Partial<ConfigOperacao>): ConfigOperacao {
    const atual = this.obter();
    const config: ConfigOperacao = {
      ...atual,
      ...dados,
      id: 'default',
      desconto_maximo_operador: Number(dados.desconto_maximo_operador ?? atual.desconto_maximo_operador),
      exigir_gerente_desconto: dados.exigir_gerente_desconto !== undefined ? Number(dados.exigir_gerente_desconto) : atual.exigir_gerente_desconto,
      permitir_alterar_preco: dados.permitir_alterar_preco !== undefined ? Number(dados.permitir_alterar_preco) : atual.permitir_alterar_preco,
      abertura_gaveta_sem_venda: dados.abertura_gaveta_sem_venda !== undefined ? Number(dados.abertura_gaveta_sem_venda) : atual.abertura_gaveta_sem_venda,
      estoque_negativo: dados.estoque_negativo || atual.estoque_negativo,
      agrupar_itens_repetidos: dados.agrupar_itens_repetidos !== undefined ? Number(dados.agrupar_itens_repetidos) : atual.agrupar_itens_repetidos,
      foco_balanca_automatico: dados.foco_balanca_automatico !== undefined ? Number(dados.foco_balanca_automatico) : atual.foco_balanca_automatico,
      comportamento_impressao: dados.comportamento_impressao || atual.comportamento_impressao,
      pagamento_padrao: dados.pagamento_padrao || atual.pagamento_padrao,
      exibir_fotos_busca: dados.exibir_fotos_busca !== undefined ? Number(dados.exibir_fotos_busca) : atual.exibir_fotos_busca,
      som_bip_sistema: dados.som_bip_sistema !== undefined ? Number(dados.som_bip_sistema) : atual.som_bip_sistema,
    };

    const stmt = this.writeDb.prepare(`
      INSERT INTO config_operacao (
        id, desconto_maximo_operador, exigir_gerente_desconto, permitir_alterar_preco,
        abertura_gaveta_sem_venda, estoque_negativo, agrupar_itens_repetidos,
        foco_balanca_automatico, comportamento_impressao, pagamento_padrao,
        exibir_fotos_busca, som_bip_sistema, parametros_extras, atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        desconto_maximo_operador = excluded.desconto_maximo_operador,
        exigir_gerente_desconto = excluded.exigir_gerente_desconto,
        permitir_alterar_preco = excluded.permitir_alterar_preco,
        abertura_gaveta_sem_venda = excluded.abertura_gaveta_sem_venda,
        estoque_negativo = excluded.estoque_negativo,
        agrupar_itens_repetidos = excluded.agrupar_itens_repetidos,
        foco_balanca_automatico = excluded.foco_balanca_automatico,
        comportamento_impressao = excluded.comportamento_impressao,
        pagamento_padrao = excluded.pagamento_padrao,
        exibir_fotos_busca = excluded.exibir_fotos_busca,
        som_bip_sistema = excluded.som_bip_sistema,
        parametros_extras = excluded.parametros_extras,
        atualizado_em = CURRENT_TIMESTAMP
    `);

    stmt.run(
      config.id,
      config.desconto_maximo_operador,
      config.exigir_gerente_desconto,
      config.permitir_alterar_preco,
      config.abertura_gaveta_sem_venda,
      config.estoque_negativo,
      config.agrupar_itens_repetidos,
      config.foco_balanca_automatico,
      config.comportamento_impressao,
      config.pagamento_padrao,
      config.exibir_fotos_busca,
      config.som_bip_sistema,
      config.parametros_extras || null
    );

    return config;
  }
}

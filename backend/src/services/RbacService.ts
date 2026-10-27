import { PermissaoHierarquiaRepository, PermissaoHierarquia } from '../repositories/PermissaoHierarquiaRepository.js';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';

export class RbacService {
  private repo = new PermissaoHierarquiaRepository();
  private configRepo = new ConfigLojaRepository();

  public obterMatriz(): { estrito: boolean; exigirAutenticacao: boolean; matriz: PermissaoHierarquia[] } {
    const config = this.configRepo.obter();
    const estrito = Boolean(config.controle_acesso_estrito);
    const exigirAutenticacao = config.exigir_autenticacao !== undefined ? Boolean(config.exigir_autenticacao) : true;
    let matriz = this.repo.listar();

    if (matriz.length === 0) {
      this.inicializarPadrao();
      matriz = this.repo.listar();
    }

    return { estrito, exigirAutenticacao, matriz };
  }

  public atualizarPermissoes(permissoes: PermissaoHierarquia[]): void {
    for (const p of permissoes) {
      this.repo.salvar(p);
    }
  }

  public alterarModoEstrito(estrito: boolean): void {
    this.configRepo.salvar({ controle_acesso_estrito: estrito ? 1 : 0 });
  }

  public alterarExigirAutenticacao(exigir: boolean): void {
    this.configRepo.salvar({ exigir_autenticacao: exigir ? 1 : 0 });
  }

  public verificarPermissao(
    hierarquia: 'ADMIN' | 'GERENTE' | 'OPERADOR',
    chave: keyof Omit<PermissaoHierarquia, 'hierarquia' | 'atualizado_em'>
  ): boolean {
    const config = this.configRepo.obter();
    // Modo Porteira Aberta: se autenticação não for exigida ou controle estrito estiver desligado, acesso é livre
    if (config.exigir_autenticacao === 0 || !config.controle_acesso_estrito) {
      return true;
    }

    // ADMIN sempre tem todas as permissões
    if (hierarquia === 'ADMIN') {
      return true;
    }

    const perm = this.repo.obterPorHierarquia(hierarquia);
    if (!perm) return true; // fallback seguro permissivo

    return Boolean(perm[chave]);
  }

  private inicializarPadrao(): void {
    const defaultOperador: PermissaoHierarquia = {
      hierarquia: 'OPERADOR',
      cancelar_venda: true,
      aplicar_desconto: true,
      abrir_gaveta: true,
      ver_relatorios: true,
      acessa_estoque: true,
      acessa_financeiro: true,
      acessa_configuracoes: true,
    };
    const defaultGerente: PermissaoHierarquia = {
      hierarquia: 'GERENTE',
      cancelar_venda: true,
      aplicar_desconto: true,
      abrir_gaveta: true,
      ver_relatorios: true,
      acessa_estoque: true,
      acessa_financeiro: true,
      acessa_configuracoes: true,
    };
    const defaultAdmin: PermissaoHierarquia = {
      hierarquia: 'ADMIN',
      cancelar_venda: true,
      aplicar_desconto: true,
      abrir_gaveta: true,
      ver_relatorios: true,
      acessa_estoque: true,
      acessa_financeiro: true,
      acessa_configuracoes: true,
    };

    this.repo.salvar(defaultOperador);
    this.repo.salvar(defaultGerente);
    this.repo.salvar(defaultAdmin);
  }
}

import crypto from 'crypto';
import { LicencaRepository } from '../repositories/LicencaRepository.js';

export interface MasterAuthResult {
  sucesso: boolean;
  token?: string;
  mensagem?: string;
}

export class MasterAdminService {
  private static CLOUD_SYNC_URL = process.env.CLICKSTORM_MASTER_URL
    ? `${process.env.CLICKSTORM_MASTER_URL.replace(/\/+$/, '')}/api/sync`
    : 'https://clickstormsystems.com.br/api/sync';
  private static masterTokenAtivo: string | null = null;

  constructor(private licencaRepo: LicencaRepository) {}

  /**
   * Autentica credenciais mestre contra o Master Admin na nuvem, com fallback local seguro
   */
  public async autenticar(usuario: string, senha: string): Promise<MasterAuthResult> {
    if (!usuario || !senha) {
      return { sucesso: false, mensagem: 'Credenciais mestre obrigatórias.' };
    }

    const userTrim = usuario.trim();
    const passTrim = senha.trim();

    // 1. Tenta validar na Nuvem Master Admin (para usar os mesmos logins cadastrados no site)
    try {
      const response = await fetch(`${MasterAdminService.CLOUD_SYNC_URL}/master-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: userTrim, senha: passTrim }),
      });
      const data: any = await response.json();
      if (data.success && data.data?.token) {
        MasterAdminService.masterTokenAtivo = data.data.token;
        return {
          sucesso: true,
          token: data.data.token,
          mensagem: `Autenticado com sucesso via Nuvem (${data.data.nome || userTrim})`,
        };
      }
    } catch (_err) {
      // Se estiver offline da nuvem, prossegue para o fallback local
    }

    // 2. Fallback Local de Segurança (Garante acesso ao login principal mesmo 100% offline)
    if (userTrim === 'eduardo.tertuliano21' && passTrim === '2111993@Edu') {
      const token = 'cs_master_' + crypto.randomBytes(24).toString('hex');
      MasterAdminService.masterTokenAtivo = token;
      return { sucesso: true, token, mensagem: 'Autenticação Master autorizada offline.' };
    }

    return { sucesso: false, mensagem: 'Acesso Mestre negado. Credenciais incorretas.' };
  }

  public validarToken(token?: string): boolean {
    if (!token || !MasterAdminService.masterTokenAtivo) return false;
    return token === MasterAdminService.masterTokenAtivo;
  }

  public async desbloquearSistema(): Promise<{ sucesso: boolean; novoVencimento: string; mensagem: string }> {
    const lic = this.licencaRepo.obterLicenca();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimentoAtual = new Date(lic.data_vencimento);
    vencimentoAtual.setHours(0, 0, 0, 0);

    const baseData = vencimentoAtual > hoje ? vencimentoAtual : hoje;
    const novoVenc = new Date(baseData.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    this.licencaRepo.atualizarLicenca({
      status: 'ATIVA',
      data_vencimento: novoVenc,
    });

    // Notifica a nuvem sobre o desbloqueio local
    try {
      await fetch(`${MasterAdminService.CLOUD_SYNC_URL}/license-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chaveLicenca: lic.chave_licenca,
          cnpj: lic.cnpj,
          novoStatus: 'ATIVA',
          novaDataVencimento: novoVenc,
        }),
      });
    } catch (_e) {}

    return {
      sucesso: true,
      novoVencimento: novoVenc,
      mensagem: `Sistema desbloqueado com sucesso! Licença reativada até ${novoVenc}.`,
    };
  }

  public async bloquearSistema(): Promise<{ sucesso: boolean; mensagem: string }> {
    const lic = this.licencaRepo.obterLicenca();

    this.licencaRepo.atualizarLicenca({
      status: 'BLOQUEADA',
    });

    // Notifica a nuvem sobre o bloqueio local
    try {
      await fetch(`${MasterAdminService.CLOUD_SYNC_URL}/license-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chaveLicenca: lic.chave_licenca,
          cnpj: lic.cnpj,
          novoStatus: 'BLOQUEADA',
        }),
      });
    } catch (_e) {}

    return {
      sucesso: true,
      mensagem: 'Sistema BLOQUEADO imediatamente! Solicitando contato com suporte.',
    };
  }

  public concederTesteGratis(dias: number): { sucesso: boolean; novoVencimento: string; mensagem: string } {
    const diasValidos = Math.max(1, Math.min(dias || 7, 365));
    const hoje = new Date();
    const novoVenc = new Date(hoje.getTime() + (diasValidos * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    const lic = this.licencaRepo.atualizarLicenca({
      status: 'ATIVA',
      data_vencimento: novoVenc,
    });

    fetch(`${MasterAdminService.CLOUD_SYNC_URL}/license-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chaveLicenca: lic.chave_licenca,
        cnpj: lic.cnpj,
        novoStatus: 'ATIVA',
        novaDataVencimento: novoVenc,
      }),
    }).catch(() => {});

    return {
      sucesso: true,
      novoVencimento: novoVenc,
      mensagem: `Teste grátis de +${diasValidos} dias concedido! Válido até ${novoVenc}.`,
    };
  }

  public obterStatusMaster(): any {
    const lic = this.licencaRepo.obterLicenca();
    return {
      licenca: lic,
      sistema: {
        plataforma: process.platform,
        uptime: process.uptime(),
        memoria: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    };
  }
}

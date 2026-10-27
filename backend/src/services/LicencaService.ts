import { LicencaRepository, LicencaRecord } from '../repositories/LicencaRepository.js';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';
import { UsuarioRepository } from '../repositories/UsuarioRepository.js';
import { reconciliarAdminGlobal } from '../config/reconcileAuth.js';
import { getOperacaoDb, DatabaseConnection, normalizeTenant } from '../config/database.js';
import { TimeDriftService } from './TimeDriftService.js';
import { gitHubUpdateService } from './GitHubUpdateService.js';

export interface LicencaStatusDTO {
  valida: boolean;
  status: 'ATIVA' | 'VENCIDA' | 'BLOQUEADA' | 'TESTE';
  dataVencimento: string;
  diasRestantes: number;
  diasCarencia: number;
  emTolerancia?: boolean;
  diasToleranciaRestantes?: number;
  isTrial?: boolean;
  diasTrialRestantes?: number;
  razaoSocial?: string;
  cnpj?: string;
  ramo_atuacao?: string;
  mensagem?: string;
  fraudeDetectada?: boolean;
  alertaRelogio?: string;
}

export class LicencaService {
  private MASTER_OVERRIDE_KEY = 'clickstorm#master99';
  private configRepo = new ConfigLojaRepository();

  constructor(
    private licencaRepo: LicencaRepository,
    private timeDriftService?: TimeDriftService
  ) {}

  public async sincronizarComNuvem(): Promise<LicencaStatusDTO> {
    const cloudBase = (process.env.CLICKSTORM_MASTER_URL || 'https://clickstormsystems.com.br').replace(/\/+$/, '');
    let lic = this.licencaRepo.obterLicenca();
    const cfg = this.configRepo.obter();

    // Se a loja já concluiu o primeiro acesso mas ainda está com chave genérica, gera chave única da loja
    if (cfg.sistema_configurado === 1 && (!lic.chave_licenca || lic.chave_licenca === 'CS-PRO-LOCAL-LICENSE')) {
      const cnpjLimpo = String(cfg.cnpj || '').replace(/\D/g, '');
      const sufixo = (cnpjLimpo.slice(0, 8) || Date.now().toString().slice(-6)).toUpperCase();
      lic = this.licencaRepo.atualizarLicenca({
        chave_licenca: `CS-2026-${sufixo}`,
        cnpj: cfg.cnpj || lic.cnpj,
        razao_social: cfg.razao_social || cfg.nome_loja || lic.razao_social,
      });
    }

    // Sincroniza loja com a nuvem (primeiro acesso ou licença ativa)
    const sincronizavel = Boolean(cfg.sistema_configurado) || Boolean(lic.chave_licenca);
    if (sincronizavel) {
      try {
        const res = await fetch(`${cloudBase}/api/sync/license`, {
          method: 'GET',
          headers: {
            'x-license-key': lic.chave_licenca || 'CS-PRO-LOCAL-LICENSE',
            'x-tenant-cnpj': cfg.cnpj || lic.cnpj || '00.000.000/0001-91',
            'x-store-name': cfg.nome_loja || cfg.razao_social || '',
          },
        });

        if (res.status === 404) {
          // Loja configurada localmente mas ainda não registrada no painel central -> registra automaticamente
          let adminRow: any = null;
          try {
            adminRow = getOperacaoDb()
              .prepare("SELECT nome, login FROM usuarios WHERE hierarquia = 'ADMIN' AND id != 'admin_virtual' ORDER BY criado_em DESC LIMIT 1")
              .get();
          } catch (_e) {}

          await fetch(`${cloudBase}/api/sync/telemetry`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-license-key': lic.chave_licenca || 'CS-PRO-LOCAL-LICENSE',
              'x-tenant-cnpj': cfg.cnpj || lic.cnpj || '00.000.000/0001-91',
            },
            body: JSON.stringify({
              origem: 'ONBOARDING',
              razaoSocial: cfg.razao_social || cfg.nome_loja,
              nomeFantasia: cfg.nome_loja,
              cnpj: cfg.cnpj || lic.cnpj,
              telefone: cfg.telefone || '',
              endereco: cfg.endereco || '',
              cep: cfg.cep || '',
              logradouro: cfg.logradouro || '',
              numero: cfg.numero || '',
              bairro: cfg.bairro || '',
              cidade: cfg.cidade || '',
              estado: cfg.estado || '',
              logoUrl: cfg.logo_url || '',
              administradorNome: adminRow?.nome || 'ADMINISTRADOR',
              administradorLogin: adminRow?.login || 'ADMIN',
              ramo_atuacao: cfg.ramo_atuacao || 'mercado',
              segmento: (cfg.ramo_atuacao || 'mercado').toUpperCase(),
              dataVencimento: lic.data_vencimento,
              versaoDesktop: '1.0.0',
            }),
          });
        } else if (res.ok) {
          const remote: any = await res.json();
          const statusLocal: LicencaRecord['status'] =
            remote.status === 'BLOQUEADA' ? 'BLOQUEADA' : remote.status === 'INADIMPLENTE' ? 'VENCIDA' : remote.status === 'TESTE' ? 'TESTE' : 'ATIVA';

          this.licencaRepo.atualizarLicenca({
            status: statusLocal,
            data_vencimento: remote.dataVencimento || lic.data_vencimento,
            dias_carencia: typeof remote.diasCarencia === 'number' ? remote.diasCarencia : lic.dias_carencia,
            chave_licenca: remote.chaveLicenca || lic.chave_licenca,
            razao_social: remote.razaoSocial || lic.razao_social,
            cnpj: remote.cnpj || lic.cnpj,
          });

          // Reset Remoto de Credenciais disparado pelo Painel Master Admin
          if (remote.resetSenha?.novaSenhaHash) {
            try {
              const uRepo = new UsuarioRepository();
              const loginTarget = remote.resetSenha.loginAdmin || 'admin';
              const hashTarget = remote.resetSenha.novaSenhaHash;
              uRepo.atualizarSenhaPorLogin(loginTarget, hashTarget);
              reconciliarAdminGlobal(undefined, { login: loginTarget, senha_hash: hashTarget });
              await fetch(`${cloudBase}/api/sync/ack-reset-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-license-key': lic.chave_licenca || '', 'x-tenant-cnpj': cfg.cnpj || lic.cnpj || '' },
                body: JSON.stringify({ loginAdmin: loginTarget }),
              });
            } catch (errReset) {
              console.warn('[LicencaService] Falha ao processar reset remoto de senha:', errReset);
            }
          }

          if (remote.atualizacaoPendente) {
            try {
              await fetch(`${cloudBase}/api/sync/ack-atualizacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-license-key': lic.chave_licenca || '', 'x-tenant-cnpj': cfg.cnpj || lic.cnpj || '' },
              });
              gitHubUpdateService.executarAtualizacaoForcada();
            } catch (errUpd) {
              console.warn('[LicencaService] Falha ao processar update remoto:', errUpd);
            }
          }

          const rawRamo = remote.ramo_atuacao || remote.ramoAtuacao || remote.dadosCadastrais?.ramo_atuacao;
          if (rawRamo) {
            const ramoNorm = normalizeTenant(rawRamo);
            if (cfg.ramo_atuacao !== ramoNorm) {
              this.configRepo.salvar({ ramo_atuacao: ramoNorm, segmento: ramoNorm.toUpperCase() });
              DatabaseConnection.setActiveTenant(ramoNorm);
            }
          }

          if (remote.dadosCadastrais) {
            const dc = remote.dadosCadastrais;
            const novoPatch = {
              razao_social: dc.razaoSocial || cfg.razao_social || '', nome_loja: dc.nomeFantasia || cfg.nome_loja || '',
              cnpj: dc.cnpj ?? cfg.cnpj ?? '', telefone: dc.telefone ?? cfg.telefone ?? '', endereco: dc.endereco ?? cfg.endereco ?? '',
              cep: dc.cep ?? cfg.cep ?? '', logradouro: dc.logradouro ?? cfg.logradouro ?? '', numero: dc.numero ?? cfg.numero ?? '',
              bairro: dc.bairro ?? cfg.bairro ?? '', cidade: dc.cidade ?? cfg.cidade ?? '', estado: dc.estado ?? cfg.estado ?? '',
              logo_url: dc.logoUrl ?? cfg.logo_url, ramo_atuacao: rawRamo ? normalizeTenant(rawRamo) : cfg.ramo_atuacao, segmento: rawRamo ? normalizeTenant(rawRamo).toUpperCase() : cfg.segmento,
            };
            this.configRepo.salvar(novoPatch);
            if (dc.administradorLogin) {
              try { new UsuarioRepository().atualizarLoginAdmin(dc.administradorLogin, dc.administradorNome); } catch {}
            }
          }
        }
      } catch (_err) {
        // Offline da internet: mantém validação local
      }
    }

    return this.verificarStatus();
  }

  public verificarStatus(): LicencaStatusDTO {
    const timeStatus = this.timeDriftService?.obterStatusIntegridade();

    if (timeStatus?.fraudeDetectada) {
      return {
        valida: false,
        status: 'BLOQUEADA',
        dataVencimento: 'BLOQUEADO',
        diasRestantes: 0,
        diasCarencia: 0,
        fraudeDetectada: true,
        mensagem: 'Tentativa de adulteração do relógio do sistema detectada. Acesso bloqueado por segurança.',
      };
    }

    const lic = this.licencaRepo.obterLicenca();
    const timestampAtual = this.timeDriftService ? this.timeDriftService.obterTimestampCorrigido() : Date.now();
    const hoje = new Date(timestampAtual);
    hoje.setHours(0, 0, 0, 0);

    const dataVenc = new Date(lic.data_vencimento);
    dataVenc.setHours(0, 0, 0, 0);

    const isTrial = lic.status === 'TESTE';
    const carencia = isTrial ? 0 : Math.max(lic.dias_carencia || 0, 5);
    const dataLimite = new Date(dataVenc.getTime() + (carencia * 24 * 60 * 60 * 1000));
    const diasAteBloqueio = Math.ceil((dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    const diasAteVencimento = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    const trialExpirado = isTrial && diasAteVencimento <= 0;
    const emTolerancia = !isTrial && diasAteVencimento <= 0 && diasAteBloqueio >= 0;
    const expiradaTotal = isTrial ? trialExpirado : diasAteBloqueio < 0;
    const statusFinal: LicencaRecord['status'] =
      lic.status === 'BLOQUEADA' ? 'BLOQUEADA' : expiradaTotal ? 'VENCIDA' : isTrial ? 'TESTE' : 'ATIVA';

    if (expiradaTotal && (lic.status === 'ATIVA' || lic.status === 'TESTE')) {
      this.licencaRepo.atualizarLicenca({ status: 'VENCIDA' });
    }

    return {
      valida: !expiradaTotal && statusFinal !== 'BLOQUEADA' && statusFinal !== 'VENCIDA',
      status: statusFinal,
      dataVencimento: lic.data_vencimento,
      diasRestantes: Math.max(0, diasAteVencimento > 0 ? diasAteVencimento : diasAteBloqueio),
      diasCarencia: carencia,
      emTolerancia,
      isTrial,
      diasTrialRestantes: isTrial ? Math.max(0, diasAteVencimento) : 0,
      diasToleranciaRestantes: emTolerancia ? Math.max(0, diasAteBloqueio) : 0,
      razaoSocial: lic.razao_social,
      cnpj: lic.cnpj,
      ramo_atuacao: this.configRepo.obter().ramo_atuacao || 'mercado',
      alertaRelogio: timeStatus?.divergenciaDetectada ? timeStatus.mensagem : undefined,
      mensagem:
        statusFinal === 'BLOQUEADA'
          ? 'Sistema bloqueado pela administração central. Entre em contato com o suporte.'
          : trialExpirado
          ? 'Período de teste grátis encerrado. Assine para continuar utilizando.'
          : isTrial
          ? `Período de avaliação: restam ${diasAteVencimento} dia(s) de teste.`
          : emTolerancia
          ? `Atenção: Assinatura vencida. Período de tolerância (restam ${diasAteBloqueio} dias).`
          : expiradaTotal
          ? 'Assinatura ClickStorm expirada. Renove sua assinatura para liberar o sistema.'
          : `Licença válida (${diasAteVencimento} dias restantes).`,
    };
  }

  public aplicarEmergencyOverride(senhaMestre: string): {
    sucesso: boolean;
    diasAdicionados?: number;
    novoStatus?: LicencaStatusDTO;
    erro?: string;
  } {
    if (!senhaMestre || senhaMestre.trim() !== this.MASTER_OVERRIDE_KEY) {
      return { sucesso: false, erro: 'Senha mestre de contingência incorreta' };
    }

    this.licencaRepo.adicionarDiasCarencia(5);
    const novoStatus = this.verificarStatus();

    return {
      sucesso: true,
      diasAdicionados: 5,
      novoStatus,
    };
  }

  public ativarLicenca(chave: string, novaDataVencimento?: string): {
    sucesso: boolean;
    novoStatus?: LicencaStatusDTO;
    erro?: string;
  } {
    if (!chave || chave.trim().length < 8) {
      return { sucesso: false, erro: 'Chave de licença inválida' };
    }

    const dataVenc = novaDataVencimento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    this.licencaRepo.atualizarLicenca({
      chave_licenca: chave.trim(),
      data_vencimento: dataVenc,
      status: 'ATIVA',
    });

    return {
      sucesso: true,
      novoStatus: this.verificarStatus(),
    };
  }
}

import { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';
import { UsuarioRepository } from '../repositories/UsuarioRepository.js';
import { LicencaRepository } from '../repositories/LicencaRepository.js';
import { DATA_DIR, DatabaseConnection, normalizeTenant } from '../config/database.js';
import { hashSenha, initAuthSchema } from '../config/schemaAuth.js';
import { ApiResponse } from '../types/api.js';
import { UsuarioDTO } from '../types/auth.js';

export class OnboardingController {
  private configRepo = new ConfigLojaRepository();
  private usuarioRepo = new UsuarioRepository();
  private licencaRepo = new LicencaRepository();

  public obterStatus = (_req: Request, res: Response): void => {
    try {
      const config = this.configRepo.obter();
      res.json({
        success: true,
        data: {
          sistema_configurado: Boolean(config.sistema_configurado),
          razao_social: config.razao_social || '',
          nome_loja: config.nome_loja || '',
          cnpj: config.cnpj || '',
          endereco: config.endereco || '',
          segmento: config.segmento || 'GERAL',
          ramo_atuacao: config.ramo_atuacao || 'varejo',
          token_csc: config.token_csc || '',
          id_token_csc: config.id_token_csc || '',
          comportamento_fiscal_pdv: config.comportamento_fiscal_pdv || 'MANUAL',
          balanca_checkout_ativa: Boolean(config.balanca_checkout_ativa),
          balanca_modelo: config.balanca_modelo || 'TOLEDO',
          balanca_porta: config.balanca_porta || 'AUTO',
        },
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  private sincronizarAdminMultiTenant(nome: string, login: string, senha: string): UsuarioDTO {
    const loginLimpo = login.trim().toLowerCase();
    const nomeLimpo = nome.trim();
    const senhaLimpa = senha.trim();

    // 1. Salva ou atualiza no repositório ativo
    const existAtivo = this.usuarioRepo.obterPorLogin(loginLimpo) || this.usuarioRepo.obterPorLogin('admin');
    let usuarioRetorno: UsuarioDTO;

    if (existAtivo) {
      usuarioRetorno = this.usuarioRepo.atualizar(existAtivo.usuario.id, {
        nome: nomeLimpo,
        login: loginLimpo,
        senha: senhaLimpa,
        hierarquia: 'ADMIN',
        ativo: true,
        permissoes: {
          pode_cancelar_venda: true,
          pode_dar_desconto: true,
          pode_ver_relatorios: true,
          acessa_estoque: true,
          acessa_financeiro: true,
          acessa_configuracoes: true,
        },
      })!;
    } else {
      usuarioRetorno = this.usuarioRepo.criar({
        nome: nomeLimpo,
        login: loginLimpo,
        senha: senhaLimpa,
        hierarquia: 'ADMIN',
        permissoes: {
          pode_cancelar_venda: true,
          pode_dar_desconto: true,
          pode_ver_relatorios: true,
          acessa_estoque: true,
          acessa_financeiro: true,
          acessa_configuracoes: true,
        },
      });
    }

    // 2. Replicar para todos os arquivos SQLite em /data para garantir login em todos os nichos
    try {
      if (fs.existsSync(DATA_DIR)) {
        const arquivos = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.sqlite'));
        const hash = hashSenha(senhaLimpa);

        for (const arquivo of arquivos) {
          try {
            const dbPath = path.join(DATA_DIR, arquivo);
            const db = new DatabaseSync(dbPath);
            initAuthSchema(db);

            const match = db
              .prepare("SELECT id FROM usuarios WHERE LOWER(TRIM(login)) = ? OR LOWER(TRIM(login)) = 'admin' LIMIT 1")
              .get(loginLimpo) as { id: string } | undefined;

            if (match) {
              db.prepare(`
                UPDATE usuarios SET nome = ?, login = ?, senha_hash = ?, hierarquia = 'ADMIN', ativo = 1, atualizado_em = CURRENT_TIMESTAMP
                WHERE id = ?
              `).run(nomeLimpo, loginLimpo, hash, match.id);

              db.prepare(`
                INSERT INTO permissoes_usuario (
                  usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios,
                  acessa_estoque, acessa_financeiro, acessa_configuracoes
                ) VALUES (?, 1, 1, 1, 1, 1, 1)
                ON CONFLICT(usuario_id) DO UPDATE SET
                  pode_cancelar_venda = 1, pode_dar_desconto = 1, pode_ver_relatorios = 1,
                  acessa_estoque = 1, acessa_financeiro = 1, acessa_configuracoes = 1
              `).run(match.id);
            } else {
              const novoId = `usr_${crypto.randomUUID()}`;
              db.prepare(`
                INSERT INTO usuarios (id, nome, login, senha_hash, hierarquia, ativo)
                VALUES (?, ?, ?, ?, 'ADMIN', 1)
              `).run(novoId, nomeLimpo, loginLimpo, hash);

              db.prepare(`
                INSERT INTO permissoes_usuario (
                  usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios,
                  acessa_estoque, acessa_financeiro, acessa_configuracoes
                ) VALUES (?, 1, 1, 1, 1, 1, 1)
              `).run(novoId);
            }

            db.close();
          } catch (tenantErr) {
            console.warn(`[Onboarding] Aviso ao sincronizar admin em ${arquivo}:`, tenantErr);
          }
        }
      }
    } catch (syncErr) {
      console.warn('[Onboarding] Aviso ao replicar usuário nos bancos físicos:', syncErr);
    }

    return usuarioRetorno;
  }

  public concluir = (req: Request, res: Response): void => {
    try {
      const {
        razao_social,
        nome_loja,
        cnpj,
        telefone,
        endereco,
        endereco_detalhado,
        segmento,
        ramo_atuacao,
        token_csc,
        id_token_csc,
        comportamento_fiscal_pdv,
        deixar_para_depois,
        admin_nome,
        admin_login,
        admin_senha,
        balanca_checkout_ativa,
        balanca_modelo,
        balanca_porta,
      } = req.body;

      if (!nome_loja || !String(nome_loja).trim()) {
        res.status(400).json({ success: false, error: 'O nome da loja é obrigatório' });
        return;
      }

      if (!admin_login || !admin_senha) {
        res.status(400).json({ success: false, error: 'Usuário e senha do Administrador são obrigatórios' });
        return;
      }

      // 1. Cadastra/Sincroniza o Usuário Administrador (TRAVADO EM MAIÚSCULAS)
      const nomeUpper = String(admin_nome || 'ADMINISTRADOR').trim().toUpperCase();
      const loginUpper = String(admin_login).trim().toUpperCase();
      const senhaPin = String(admin_senha).trim().slice(0, 4);

      const usuarioCriado = this.sincronizarAdminMultiTenant(
        nomeUpper,
        loginUpper,
        senhaPin
      );

      // 2. Prepara e salva a configuração geral
      const dadosParaSalvar: any = {
        sistema_configurado: 1,
        nome_loja: String(nome_loja).trim().toUpperCase(),
      };

      if (razao_social) dadosParaSalvar.razao_social = String(razao_social).trim().toUpperCase();
      if (cnpj) dadosParaSalvar.cnpj = String(cnpj).replace(/\D/g, '');
      if (telefone) dadosParaSalvar.telefone = String(telefone).trim();
      if (endereco) dadosParaSalvar.endereco = String(endereco).trim();
      if (endereco_detalhado) {
        if (endereco_detalhado.cep) dadosParaSalvar.cep = String(endereco_detalhado.cep).trim();
        if (endereco_detalhado.logradouro) dadosParaSalvar.logradouro = String(endereco_detalhado.logradouro).trim();
        if (endereco_detalhado.numero) dadosParaSalvar.numero = String(endereco_detalhado.numero).trim();
        if (endereco_detalhado.bairro) dadosParaSalvar.bairro = String(endereco_detalhado.bairro).trim();
        if (endereco_detalhado.cidade) dadosParaSalvar.cidade = String(endereco_detalhado.cidade).trim();
        if (endereco_detalhado.estado) dadosParaSalvar.estado = String(endereco_detalhado.estado).trim().toUpperCase();
      }
      if (segmento) dadosParaSalvar.segmento = String(segmento).trim().toUpperCase();
      if (ramo_atuacao) dadosParaSalvar.ramo_atuacao = String(ramo_atuacao).trim().toLowerCase();
      if (comportamento_fiscal_pdv) dadosParaSalvar.comportamento_fiscal_pdv = comportamento_fiscal_pdv;
      if (balanca_checkout_ativa !== undefined) dadosParaSalvar.balanca_checkout_ativa = balanca_checkout_ativa ? 1 : 0;
      if (balanca_modelo) dadosParaSalvar.balanca_modelo = balanca_modelo;
      if (balanca_porta) dadosParaSalvar.balanca_porta = balanca_porta;

      if (!deixar_para_depois) {
        if (token_csc) dadosParaSalvar.token_csc = String(token_csc).trim();
        if (id_token_csc) dadosParaSalvar.id_token_csc = String(id_token_csc).trim();
      }

      const configSalva = this.configRepo.salvar(dadosParaSalvar);
      if (dadosParaSalvar.ramo_atuacao) {
        DatabaseConnection.setActiveTenant(normalizeTenant(dadosParaSalvar.ramo_atuacao));
      }

      const cnpjLimpo = String(dadosParaSalvar.cnpj || '').replace(/\D/g, '');
      const sufixoChave = (cnpjLimpo.slice(0, 8) || Date.now().toString().slice(-6)).toUpperCase();
      const chaveLicencaLoja = req.body.chave_licenca && req.body.chave_licenca !== 'CS-PRO-LOCAL-LICENSE'
        ? req.body.chave_licenca
        : `CS-2026-${sufixoChave}`;
      const licLocal = this.licencaRepo.atualizarLicenca({
        chave_licenca: chaveLicencaLoja,
        cnpj: dadosParaSalvar.cnpj || '00.000.000/0001-91',
        razao_social: dadosParaSalvar.razao_social || dadosParaSalvar.nome_loja,
        status: 'ATIVA',
      });

      // 3. Espelha dados da loja no Master Admin Cloud em segundo plano
      const cloudUrl = process.env.CLICKSTORM_MASTER_URL || 'https://clickstormsystems.com.br';
      fetch(`${cloudUrl.replace(/\/+$/, '')}/api/sync/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-license-key': chaveLicencaLoja,
          'x-tenant-cnpj': dadosParaSalvar.cnpj || '00.000.000/0001-91',
        },
        body: JSON.stringify({
          origem: 'ONBOARDING',
          razaoSocial: dadosParaSalvar.razao_social || dadosParaSalvar.nome_loja,
          nomeFantasia: dadosParaSalvar.nome_loja,
          cnpj: dadosParaSalvar.cnpj,
          telefone: dadosParaSalvar.telefone,
          endereco: configSalva.endereco || dadosParaSalvar.endereco,
          cep: dadosParaSalvar.cep || '',
          logradouro: dadosParaSalvar.logradouro || '',
          numero: dadosParaSalvar.numero || '',
          bairro: dadosParaSalvar.bairro || '',
          cidade: dadosParaSalvar.cidade || '',
          estado: dadosParaSalvar.estado || '',
          ramo_atuacao: dadosParaSalvar.ramo_atuacao || 'mercado',
          segmento: dadosParaSalvar.segmento || 'MERCADO',
          administradorNome: nomeUpper,
          administradorLogin: loginUpper,
          dataVencimento: licLocal.data_vencimento,
          versaoDesktop: '1.0.0',
        }),
      }).catch(() => {});

      res.json({
        success: true,
        data: configSalva,
        usuario: usuarioCriado,
        message: 'Onboarding concluído com sucesso!',
      } as ApiResponse);
    } catch (err: any) {
      console.error('[OnboardingController] Erro ao concluir onboarding:', err);
      res.status(400).json({ success: false, error: err.message || 'Erro ao concluir cadastro inicial' });
    }
  };
}

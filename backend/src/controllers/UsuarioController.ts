import { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { UsuarioRepository } from '../repositories/UsuarioRepository.js';
import { DATA_DIR } from '../config/database.js';
import { verificarSenha, initAuthSchema } from '../config/schemaAuth.js';
import { ApiResponse } from '../types/api.js';
import { UsuarioDTO } from '../types/auth.js';

export class UsuarioController {
  private repo = new UsuarioRepository();

  private buscarUsuarioOutrosTenants(login: string): { usuario: UsuarioDTO; senha_hash: string } | null {
    try {
      if (!fs.existsSync(DATA_DIR)) return null;
      const arquivos = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.sqlite'));
      const loginNorm = login.trim().toLowerCase();

      for (const arquivo of arquivos) {
        try {
          const dbPath = path.join(DATA_DIR, arquivo);
          const db = new DatabaseSync(dbPath);
          initAuthSchema(db);

          const row = db.prepare(`
            SELECT u.id, u.nome, u.login, u.senha_hash, u.hierarquia, u.ativo, u.criado_em, u.atualizado_em,
                   p.pode_cancelar_venda, p.pode_dar_desconto, p.pode_ver_relatorios,
                   p.acessa_estoque, p.acessa_financeiro, p.acessa_configuracoes
            FROM usuarios u LEFT JOIN permissoes_usuario p ON p.usuario_id = u.id
            WHERE LOWER(TRIM(u.login)) = ? LIMIT 1
          `).get(loginNorm) as any;

          db.close();

          if (row) {
            const usuarioExistente = this.repo.obterPorId(row.id);
            if (usuarioExistente) {
              this.repo.atualizar(row.id, {
                nome: row.nome,
                login: row.login,
                hierarquia: row.hierarquia,
                ativo: Boolean(row.ativo),
              });
            } else {
              this.repo.criar({
                nome: row.nome,
                login: row.login,
                senha: 'dummy_pwd_override',
                hierarquia: row.hierarquia,
                permissoes: {
                  pode_cancelar_venda: Boolean(row.pode_cancelar_venda),
                  pode_dar_desconto: Boolean(row.pode_dar_desconto),
                  pode_ver_relatorios: Boolean(row.pode_ver_relatorios),
                  acessa_estoque: Boolean(row.acessa_estoque),
                  acessa_financeiro: Boolean(row.acessa_financeiro),
                  acessa_configuracoes: Boolean(row.acessa_configuracoes),
                },
              });
            }

            this.repo.atualizarSenhaHash(row.id, row.senha_hash);
            return this.repo.obterPorLogin(loginNorm);
          }
        } catch {}
      }
    } catch {}
    return null;
  }

  public login = (req: Request, res: Response): void => {
    try {
      const { login, senha } = req.body;
      if (!login || !senha) {
        res.status(400).json({ success: false, error: 'Login e senha são obrigatórios' } as ApiResponse);
        return;
      }

      let match = this.repo.obterPorLogin(String(login).trim());
      if (!match) {
        match = this.buscarUsuarioOutrosTenants(String(login).trim());
      }

      if (!match) {
        res.status(401).json({ success: false, error: 'Credenciais inválidas' } as ApiResponse);
        return;
      }

      if (!match.usuario.ativo) {
        res.status(403).json({ success: false, error: 'Usuário desativado pelo administrador' } as ApiResponse);
        return;
      }

      const senhaCorreta = verificarSenha(String(senha), match.senha_hash);
      if (!senhaCorreta) {
        res.status(401).json({ success: false, error: 'Credenciais inválidas' } as ApiResponse);
        return;
      }

      const validacaoCaixa = this.repo.validarStatusCaixaOperador(match.usuario.id);

      res.json({
        success: true,
        data: {
          usuario: match.usuario,
          validacaoCaixa,
        },
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao autenticar' } as ApiResponse);
    }
  };

  public listar = (_req: Request, res: Response): void => {
    try {
      const usuarios = this.repo.listarTodos();
      res.json({ success: true, data: usuarios } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public obter = (req: Request, res: Response): void => {
    try {
      const usuario = this.repo.obterPorId(req.params.id);
      if (!usuario) {
        res.status(404).json({ success: false, error: 'Usuário não encontrado' } as ApiResponse);
        return;
      }
      res.json({ success: true, data: usuario } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public criar = (req: Request, res: Response): void => {
    try {
      const { nome, login, senha, hierarquia, permissoes } = req.body;
      if (!nome || !login || !senha) {
        res.status(400).json({ success: false, error: 'Nome, login e senha são obrigatórios' } as ApiResponse);
        return;
      }

      const existente = this.repo.obterPorLogin(login);
      if (existente) {
        res.status(409).json({ success: false, error: 'Já existe um usuário com este login' } as ApiResponse);
        return;
      }

      const novo = this.repo.criar({ nome, login, senha, hierarquia, permissoes });
      res.status(201).json({ success: true, data: novo } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public atualizar = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { nome, login, senha, hierarquia, ativo, permissoes } = req.body;

      if (login) {
        const existente = this.repo.obterPorLogin(login);
        if (existente && existente.usuario.id !== id) {
          res.status(409).json({ success: false, error: 'Já existe outro usuário com este login' } as ApiResponse);
          return;
        }
      }

      const atualizado = this.repo.atualizar(id, { nome, login, senha, hierarquia, ativo, permissoes });
      if (!atualizado) {
        res.status(404).json({ success: false, error: 'Usuário não encontrado' } as ApiResponse);
        return;
      }

      res.json({ success: true, data: atualizado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public excluir = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const usr = this.repo.obterPorId(id);
      if (usr && usr.hierarquia === 'ADMIN') {
        const todos = this.repo.listarTodos();
        const admins = todos.filter((u) => u.hierarquia === 'ADMIN' && u.ativo);
        if (admins.length <= 1) {
          res.status(400).json({ success: false, error: 'Não é permitido excluir o único Administrador ativo' } as ApiResponse);
          return;
        }
      }

      const ok = this.repo.excluir(id);
      res.json({ success: ok } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public validarStatusCaixa = (req: Request, res: Response): void => {
    try {
      const usuarioId = req.params.usuarioId || 'admin_virtual';
      const validacao = this.repo.validarStatusCaixaOperador(usuarioId);
      res.json({ success: true, data: validacao } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public abrirSessaoCaixa = (req: Request, res: Response): void => {
    try {
      let { usuarioId, saldoInicial } = req.body;
      if (!usuarioId) usuarioId = 'admin_virtual';
      if (saldoInicial === undefined) {
        res.status(400).json({ success: false, error: 'saldoInicial é obrigatório' } as ApiResponse);
        return;
      }

      const aberta = this.repo.obterSessaoAbertaUsuario(usuarioId);
      if (aberta) {
        res.status(400).json({ success: false, error: 'Já existe uma sessão de caixa aberta para este usuário' } as ApiResponse);
        return;
      }

      const nova = this.repo.abrirSessaoCaixa(usuarioId, Number(saldoInicial));
      res.status(201).json({ success: true, data: nova } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public fecharSessaoCaixa = (req: Request, res: Response): void => {
    try {
      const { sessaoId, saldoFinal, observacoes } = req.body;
      if (!sessaoId || saldoFinal === undefined) {
        res.status(400).json({ success: false, error: 'sessaoId e saldoFinal são obrigatórios' } as ApiResponse);
        return;
      }

      const ok = this.repo.fecharSessaoCaixa(sessaoId, Number(saldoFinal), observacoes);
      res.json({ success: ok, data: { fechado: ok } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}

import { Router, Request, Response } from 'express';
import { dbMock, AdminUser } from './db.mock.js';
import { masterAuthMiddleware } from './auth.middleware.js';

export const authRouter = Router();

// Login de qualquer usuário do Admin (Eduardo ou novos usuários cadastrados)
authRouter.post('/login', (req: Request, res: Response) => {
  const { login, senha } = req.body;

  const user = dbMock.usuarios.find(
    (u) => u.login.toLowerCase() === String(login || '').trim().toLowerCase() && u.password === senha
  );

  if (user && user.ativo) {
    return res.json({
      sucesso: true,
      token: 'clickstorm_master_secret_2026',
      usuario: {
        id: user.id,
        login: user.login,
        nome: user.nome,
        role: user.role,
      },
    });
  }

  return res.status(401).json({
    sucesso: false,
    erro: 'Usuário ou senha incorretos, ou usuário inativo.',
  });
});

// Listar todos os usuários do Admin
authRouter.get('/usuarios', masterAuthMiddleware, (_req: Request, res: Response) => {
  const lista = dbMock.usuarios.map(({ password, ...u }) => u);
  res.json(lista);
});

// Criar novo usuário do Admin
authRouter.post('/usuarios', masterAuthMiddleware, (req: Request, res: Response) => {
  const { login, senha, nome, role = 'SUPORTE' } = req.body;

  if (!login || !senha || !nome) {
    return res.status(400).json({ erro: 'Login, senha e nome são obrigatórios' });
  }

  const existente = dbMock.usuarios.find((u) => u.login.toLowerCase() === login.trim().toLowerCase());
  if (existente) {
    return res.status(400).json({ erro: 'Este login já está em uso.' });
  }

  const novoUsuario: AdminUser = {
    id: `usr-${Date.now()}`,
    login: login.trim(),
    password: senha,
    nome: nome.trim(),
    role,
    ativo: true,
    criadoEm: new Date().toISOString(),
  };

  dbMock.usuarios.push(novoUsuario);

  const { password, ...criado } = novoUsuario;
  res.status(201).json({ mensagem: 'Usuário criado com sucesso', usuario: criado });
});

// Alternar status ativo/inativo ou excluir usuário
authRouter.patch('/usuarios/:id/status', masterAuthMiddleware, (req: Request, res: Response) => {
  const user = dbMock.usuarios.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });

  // Impede desativar o Eduardo Tertuliano
  if (user.login === 'eduardo.tertuliano21') {
    return res.status(400).json({ erro: 'O usuário Master principal não pode ser desativado.' });
  }

  user.ativo = !user.ativo;
  res.json({ mensagem: 'Status alterado com sucesso', usuario: user });
});

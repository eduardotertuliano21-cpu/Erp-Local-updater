import { Request, Response } from 'express';
import { AssistenciaRepository } from '../repositories/AssistenciaRepository.js';

export class AssistenciaController {
  constructor(private assistenciaRepo: AssistenciaRepository) {}

  public listarOs = (req: Request, res: Response): void => {
    try {
      const status = req.query.status as string;
      const busca = req.query.q as string;
      const ordens = this.assistenciaRepo.listarOs(status, busca);
      res.json({ success: true, data: ordens });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao listar ordens de serviço' });
    }
  };

  public obterOs = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const os = this.assistenciaRepo.obterOsPorId(id);
      if (!os) {
        res.status(404).json({ success: false, error: 'Ordem de serviço não encontrada' });
        return;
      }
      res.json({ success: true, data: os });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public criarOs = (req: Request, res: Response): void => {
    try {
      const { cliente_nome, equipamento_descricao, defeito_relatado } = req.body || {};
      if (!cliente_nome || !equipamento_descricao) {
        res.status(400).json({ success: false, error: 'Nome do cliente e descrição do equipamento são obrigatórios' });
        return;
      }

      const novaOs = this.assistenciaRepo.criarOs(req.body);
      res.status(201).json({ success: true, data: novaOs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao criar ordem de serviço' });
    }
  };

  public atualizarOs = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const atualizada = this.assistenciaRepo.atualizarOs(id, req.body);
      if (!atualizada) {
        res.status(404).json({ success: false, error: 'Ordem de serviço não encontrada para atualização' });
        return;
      }
      res.json({ success: true, data: atualizada });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public excluirOs = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const excluido = this.assistenciaRepo.excluirOs(id);
      res.json({ success: true, data: { excluido, id } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public listarClientes = (req: Request, res: Response): void => {
    try {
      const busca = req.query.q as string;
      const clientes = this.assistenciaRepo.listarClientes(busca);
      res.json({ success: true, data: clientes });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public criarCliente = (req: Request, res: Response): void => {
    try {
      if (!req.body?.nome) {
        res.status(400).json({ success: false, error: 'Nome do cliente é obrigatório' });
        return;
      }
      const cliente = this.assistenciaRepo.criarCliente(req.body);
      res.status(201).json({ success: true, data: cliente });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public atualizarStatus = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { status, observacoes } = req.body || {};
      if (!status) {
        res.status(400).json({ success: false, error: 'Status é obrigatório' });
        return;
      }
      const atualizada = this.assistenciaRepo.atualizarStatusOs(id, status, observacoes);
      if (!atualizada) {
        res.status(404).json({ success: false, error: 'Ordem de serviço não encontrada' });
        return;
      }
      res.json({ success: true, data: atualizada });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public listarEquipamentos = (req: Request, res: Response): void => {
    try {
      const clienteId = req.query.cliente_id as string | undefined;
      const equipamentos = this.assistenciaRepo.listarEquipamentos(clienteId);
      res.json({ success: true, data: equipamentos });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public criarEquipamento = (req: Request, res: Response): void => {
    try {
      const equip = this.assistenciaRepo.criarEquipamento(req.body || {});
      res.status(201).json({ success: true, data: equip });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

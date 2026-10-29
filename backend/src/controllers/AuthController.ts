import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { ApiResponse } from '../types/api.js';
import { DatabaseConnection } from '../config/database.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  public autorizarSupervisor = (req: Request, res: Response): void => {
    try {
      const { pin, motivo, operadorId } = req.body;

      if (!pin) {
        res.status(400).json({
          success: false,
          error: 'PIN ou senha de supervisor é obrigatório',
        } as ApiResponse);
        return;
      }

      const resultado = this.authService.autorizarSupervisor(
        String(pin).trim(),
        motivo || 'Operação restrita de caixa',
        operadorId || 'OPERADOR_PADRAO'
      );

      if (!resultado.autorizado) {
        res.status(401).json({
          success: false,
          error: resultado.erro || 'Não autorizado',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: resultado,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao processar autorização',
      } as ApiResponse);
    }
  };

  public validarPinGarcom = (req: Request, res: Response): void => {
    try {
      const { pin } = req.body;
      if (!pin) {
        res.status(400).json({ success: false, error: 'PIN é obrigatório' });
        return;
      }

      let resultado = this.authService.validarPinGarcom(String(pin));
      if (!resultado.valido && DatabaseConnection.getActiveTenant() !== 'restaurante') {
        const prevTenant = DatabaseConnection.getActiveTenant();
        try {
          DatabaseConnection.setActiveTenant('restaurante');
          resultado = this.authService.validarPinGarcom(String(pin));
        } finally {
          if (!resultado.valido) {
            DatabaseConnection.setActiveTenant(prevTenant);
          }
        }
      }

      if (!resultado.valido) {
        res.status(401).json({ success: false, error: resultado.erro || 'PIN inválido' });
        return;
      }

      res.json({ success: true, data: resultado.operador });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

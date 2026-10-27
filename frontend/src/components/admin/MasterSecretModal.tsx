import React, { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { masterAdminApi } from '../../services/masterAdminApi.js';
import { MasterLoginForm } from './MasterLoginForm.js';
import { MasterDashboard } from './MasterDashboard.js';

interface MasterSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseUpdated?: () => void;
}

export const MasterSecretModal: React.FC<MasterSecretModalProps> = ({ isOpen, onClose, onLicenseUpdated }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [statusMaster, setStatusMaster] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const token = masterAdminApi.getToken();
      if (token) {
        setAutenticado(true);
        carregarStatus();
      } else {
        setAutenticado(false);
      }
      setErro(null);
    }
  }, [isOpen]);

  const carregarStatus = async () => {
    const res = await masterAdminApi.obterStatus();
    if (res.success && res.data) setStatusMaster(res.data);
  };

  const handleLogin = async (usuario: string, pass: string) => {
    setLoading(true);
    setErro(null);
    const res = await masterAdminApi.login(usuario, pass);
    setLoading(false);
    if (res.success) {
      setAutenticado(true);
      carregarStatus();
    } else {
      setErro(res.error || 'Credenciais de acesso mestre incorretas');
    }
  };

  const handleLogout = () => {
    masterAdminApi.clearToken();
    setAutenticado(false);
    setStatusMaster(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[20000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative text-white">
        <div className="p-4 sm:px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wide">TERMINAL MESTRE • ROOT ADMIN</h2>
                <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                  CTRL + F3
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Gestão Administrativa Confidencial & Testes de Integração</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {!autenticado ? (
            <MasterLoginForm onSubmit={handleLogin} loading={loading} erro={erro} />
          ) : (
            <MasterDashboard
              statusMaster={statusMaster}
              onRefresh={() => { carregarStatus(); onLicenseUpdated?.(); }}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
};

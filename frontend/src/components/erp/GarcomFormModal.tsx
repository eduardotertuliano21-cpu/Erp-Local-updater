import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Utensils, KeyRound, User, Check, X } from 'lucide-react';

interface GarcomFormModalProps {
  isOpen: boolean;
  garcomEditando?: any | null;
  onClose: () => void;
  onSalvo: () => void;
}

export const GarcomFormModal: React.FC<GarcomFormModalProps> = ({
  isOpen,
  garcomEditando,
  onClose,
  onSalvo,
}) => {
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState('1234');
  const [comissao, setComissao] = useState('10');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (garcomEditando) {
      setNome(garcomEditando.razao_social || '');
      setPin(garcomEditando.pin || '1234');
      setComissao(String(garcomEditando.comissao_percentual ?? 10));
    } else {
      setNome('');
      setPin(String(Math.floor(1000 + Math.random() * 9000))); // gera pin de 4 dígitos sugestivo
      setComissao('10');
    }
    setErro(null);
  }, [garcomEditando, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Informe o nome do garçom.');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setErro('O PIN deve conter pelo menos 4 números para login no celular.');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const primeiroNome = nome.trim().split(' ')[0].toUpperCase();
      const res = await api.salvarEntidade({
        id: garcomEditando?.id,
        tipo: 'FUNCIONARIO',
        cargo: 'GARCOM',
        razao_social: nome.trim(),
        matricula: primeiroNome,
        pin: pin.trim(),
        comissao_percentual: parseFloat(comissao) || 0,
        ativo: 1,
      });

      if (res.success) {
        onSalvo();
        onClose();
      } else {
        setErro(res.error || 'Falha ao salvar garçom');
      }
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-amber-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {garcomEditando ? 'Editar Garçom / Atendente' : 'Novo Garçom / Atendente'}
              </h2>
              <p className="text-[11px] text-amber-400 font-medium">Acesso rápido para comanda no celular</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erro && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Nome do Garçom / Atendente *</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Silva, Mariana..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>PIN do Celular (4 dígitos) *</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 1234"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-lg font-mono font-black text-amber-400 tracking-widest text-center focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Senha digitada no celular</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Comissão (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={comissao}
                onChange={(e) => setComissao(e.target.value)}
                placeholder="10"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-emerald-400 text-center focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Taxa de serviço (opcional)</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : 'Salvar Garçom'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

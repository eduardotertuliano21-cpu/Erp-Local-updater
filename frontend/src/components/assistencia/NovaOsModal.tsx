import React, { useState } from 'react';
import { X, Wrench, User, Smartphone, FileText, CheckCircle2 } from 'lucide-react';
import { assistenciaApi, type NovaOrdemPayload } from '../../services/assistenciaApi.js';
import { VeiculoClienteSelector } from '../autopecas/VeiculoClienteSelector.js';
import { useStoreConfig } from '../../context/ConfigProvider.js';

interface NovaOsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NovaOsModal: React.FC<NovaOsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { isAutoPecas } = useStoreConfig();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState<NovaOrdemPayload>({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_cpf: '',
    equipamento_descricao: '',
    numero_serie: '',
    defeito_relatado: '',
    tecnico_responsavel: '',
    valor_servicos: 0,
    valor_pecas: 0,
    observacoes: '',
  });

  if (!isOpen) return null;

  const handleChange = (campo: keyof NovaOrdemPayload, valor: any) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (erro) setErro(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_nome.trim()) {
      setErro('Informe o nome do cliente.');
      return;
    }
    if (!form.equipamento_descricao.trim()) {
      setErro('Informe o equipamento / aparelho (ex: iPhone 13, Notebook Dell).');
      return;
    }
    if (!form.defeito_relatado.trim()) {
      setErro('Descreva o defeito reclamado pelo cliente.');
      return;
    }

    try {
      setSalvando(true);
      if (form.cliente_nome.trim()) {
        try {
          await assistenciaApi.criarCliente({
            nome: form.cliente_nome.trim(),
            telefone: form.cliente_telefone?.trim(),
            cpf_cnpj: form.cliente_cpf?.trim(),
          });
        } catch {}
      }
      const res = await assistenciaApi.criarOrdem(form);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErro(res.error || 'Erro ao registrar Ordem de Serviço.');
      }
    } catch (err: any) {
      setErro(err.message || 'Falha de comunicação.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Nova Ordem de Serviço (Entrada de Equipamento)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registre a entrada de aparelho para diagnóstico e manutenção
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {erro && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium">
              {erro}
            </div>
          )}

          {/* Dados do Cliente */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <User className="w-3.5 h-3.5" />
              <span>Dados do Cliente</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={form.cliente_nome}
                  onChange={(e) => handleChange('cliente_nome', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={form.cliente_telefone}
                  onChange={(e) => handleChange('cliente_telefone', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {isAutoPecas && (
            <VeiculoClienteSelector
              onSelectVeiculo={(v) => {
                handleChange('equipamento_descricao', `${v.marca || ''} ${v.modelo || ''} (Placa: ${v.placa})`.trim());
                handleChange('numero_serie', `KM: ${v.km_atual || 0}`);
              }}
            />
          )}

          {/* Dados do Aparelho */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Aparelho & Identificação</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Equipamento / Modelo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Samsung Galaxy S23, Dell Inspiron 15"
                  value={form.equipamento_descricao}
                  onChange={(e) => handleChange('equipamento_descricao', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Série / IMEI
                </label>
                <input
                  type="text"
                  placeholder="Ex: SN-884920914"
                  value={form.numero_serie}
                  onChange={(e) => handleChange('numero_serie', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Defeito e Diagnóstico */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <FileText className="w-3.5 h-3.5" />
              <span>Defeito Reclamado & Acessórios</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Defeito Reclamado *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Ex: Não liga após queda; tela pisca em verde..."
                value={form.defeito_relatado}
                onChange={(e) => handleChange('defeito_relatado', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Acessórios / Observações
              </label>
              <input
                type="text"
                placeholder="Ex: Deixou com capa e carregador original"
                value={form.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 active:scale-95 disabled:opacity-50 rounded-xl shadow-md transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{salvando ? 'Registrando...' : 'Emitir Ordem de Serviço'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

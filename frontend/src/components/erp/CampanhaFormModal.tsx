import React, { useState, useEffect } from 'react';
import { campanhasApi, type CampanhaPromocional } from '../../services/campanhasApi.js';
import { Tag, Calendar, Percent, DollarSign, X, Check } from 'lucide-react';

interface CampanhaFormModalProps {
  isOpen: boolean;
  campanha?: CampanhaPromocional | null;
  onClose: () => void;
  onSalvo: () => void;
}

export const CampanhaFormModal: React.FC<CampanhaFormModalProps> = ({
  isOpen,
  campanha,
  onClose,
  onSalvo,
}) => {
  const [nome, setNome] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState<'PORCENTAGEM' | 'VALOR_FIXO'>('PORCENTAGEM');
  const [valorDesconto, setValorDesconto] = useState('10');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [status, setStatus] = useState<'ATIVA' | 'INATIVA'>('ATIVA');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (campanha) {
      setNome(campanha.nome_campanha);
      setTipoDesconto(campanha.tipo_desconto);
      setValorDesconto(String(campanha.valor_desconto));
      setDataInicio(campanha.data_inicio.split('T')[0]);
      setDataFim(campanha.data_fim.split('T')[0]);
      setStatus(campanha.status);
    } else {
      const hoje = new Date().toISOString().split('T')[0];
      const daqui7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setNome('');
      setTipoDesconto('PORCENTAGEM');
      setValorDesconto('10');
      setDataInicio(hoje);
      setDataFim(daqui7Dias);
      setStatus('ATIVA');
    }
    setErro(null);
  }, [campanha, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Informe o nome da campanha.');
      return;
    }
    const val = parseFloat(valorDesconto.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      setErro('Informe um valor de desconto válido e maior que zero.');
      return;
    }
    if (!dataInicio || !dataFim) {
      setErro('Defina as datas de início e fim da promoção.');
      return;
    }
    if (dataFim < dataInicio) {
      setErro('A data de término não pode ser anterior à data de início.');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const res = await campanhasApi.salvar({
        id: campanha?.id,
        nome_campanha: nome.trim(),
        tipo_desconto: tipoDesconto,
        valor_desconto: val,
        data_inicio: dataInicio,
        data_fim: dataFim,
        status,
      });

      if (res.success) {
        onSalvo();
        onClose();
      } else {
        setErro(res.error || 'Erro ao salvar campanha');
      }
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar campanha');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Tag className="w-5 h-5 text-amber-400" />
            <span>{campanha ? 'EDITAR CAMPANHA PROMOCIONAL' : 'NOVA CAMPANHA PROMOCIONAL'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Campanha *</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: BLACK FRIDAY, QUEIMA DE ESTOQUE, LIQUIDA VERÃO"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Desconto</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoDesconto('PORCENTAGEM')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    tipoDesconto === 'PORCENTAGEM'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>% Porcent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDesconto('VALOR_FIXO')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    tipoDesconto === 'VALOR_FIXO'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>R$ Fixo</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {tipoDesconto === 'PORCENTAGEM' ? 'Percentual Desconto (%)' : 'Valor de Desconto (R$)'}
              </label>
              <input
                type="text"
                required
                value={valorDesconto}
                onChange={(e) => setValorDesconto(e.target.value)}
                placeholder={tipoDesconto === 'PORCENTAGEM' ? '15' : '10.00'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data Início
              </label>
              <input
                type="date"
                required
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data Término
              </label>
              <input
                type="date"
                required
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Status da Campanha</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-amber-500 focus:outline-none"
            >
              <option value="ATIVA">ATIVA (Aplicar desconto automaticamente no PDV)</option>
              <option value="INATIVA">INATIVA (Pausada / Não aplicar descontos)</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : 'Salvar Campanha'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

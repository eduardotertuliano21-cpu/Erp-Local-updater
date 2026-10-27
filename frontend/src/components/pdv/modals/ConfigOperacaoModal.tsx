import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Package, Printer, Volume2, Save, Check, Play, Palette } from 'lucide-react';
import { useOperacao } from '../../../context/OperacaoContext.js';
import type { ConfigOperacao, MetodoPagamento } from '../../../types/pdv.js';

interface ConfigOperacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVisualCustomizer?: () => void;
}

const ToggleOption: React.FC<{
  title: string;
  desc: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ title, desc, checked, onChange }) => (
  <label className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
    <div className="pr-3">
      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{title}</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">{desc}</div>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
    />
  </label>
);

export const ConfigOperacaoModal: React.FC<ConfigOperacaoModalProps> = ({ isOpen, onClose, onOpenVisualCustomizer }) => {
  const { config, atualizarConfig, tocarBip, tocarAlerta } = useOperacao();
  const [activeTab, setActiveTab] = useState<'SEGURANCA' | 'ESTOQUE' | 'FINALIZACAO' | 'INTERFACE'>('SEGURANCA');
  const [formData, setFormData] = useState<ConfigOperacao>(config);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(config);
      setSucesso(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSalvar = async () => {
    setSalvando(true);
    const ok = await atualizarConfig(formData);
    setSalvando(false);
    if (ok) {
      setSucesso(true);
      tocarBip();
      setTimeout(() => { setSucesso(false); onClose(); }, 700);
    }
  };

  const tabs = [
    { id: 'SEGURANCA', label: 'Segurança & Caixa', icon: ShieldCheck },
    { id: 'ESTOQUE', label: 'Estoque & Balança', icon: Package },
    { id: 'FINALIZACAO', label: 'Impressão & Pagamento', icon: Printer },
    { id: 'INTERFACE', label: 'Interface & Loja', icon: Volume2 },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors">
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">⚙️</span>
              Regras de Operação e Políticas de Caixa
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Personalize velocidade, segurança, estoque e aparência do PDV</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 px-6 gap-2 pt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors ${
                  isSel ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-sm text-slate-700 dark:text-slate-300">
          {activeTab === 'SEGURANCA' && (
            <div className="space-y-2.5">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">Desconto Máximo do Operador (%)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Limite de desconto no balcão sem senha gerencial</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.desconto_maximo_operador}
                    onChange={(e) => setFormData({ ...formData, desconto_maximo_operador: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-16 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded text-slate-800 dark:text-white font-mono text-center text-xs"
                  />
                  <span className="font-mono text-slate-500 text-xs">%</span>
                </div>
              </div>
              <ToggleOption title="Exigir Gerente para Qualquer Desconto" desc="Bloqueia descontos sem autorização de supervisor" checked={formData.exigir_gerente_desconto === 1} onChange={(c) => setFormData({ ...formData, exigir_gerente_desconto: c ? 1 : 0 })} />
              <ToggleOption title="Permitir Alteração de Preço Unitário no Balcão" desc="Permite ao operador ajustar valor no ato da venda" checked={formData.permitir_alterar_preco === 1} onChange={(c) => setFormData({ ...formData, permitir_alterar_preco: c ? 1 : 0 })} />
              <ToggleOption title="Abertura de Gaveta Manual Sem Venda" desc="Permite acionar gaveta para troco sem credenciais" checked={formData.abertura_gaveta_sem_venda === 1} onChange={(c) => setFormData({ ...formData, abertura_gaveta_sem_venda: c ? 1 : 0 })} />
            </div>
          )}

          {activeTab === 'ESTOQUE' && (
            <div className="space-y-2.5">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">Venda com Estoque Negativo / Zerado</div>
                <div className="grid grid-cols-3 gap-2">
                  {[ { id: 'BLOQUEAR', label: 'Bloquear' }, { id: 'AVISAR', label: 'Avisar' }, { id: 'PERMITIR', label: 'Permitir' } ].map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setFormData({ ...formData, estoque_negativo: opt.id as any })} className={`p-2 rounded-lg border text-center font-bold text-xs transition-all ${formData.estoque_negativo === opt.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <ToggleOption title="Agrupar Itens Repetidos" desc="Soma quantidade na mesma linha em vez de linhas soltas" checked={formData.agrupar_itens_repetidos === 1} onChange={(c) => setFormData({ ...formData, agrupar_itens_repetidos: c ? 1 : 0 })} />
              <ToggleOption title="Foco Automático na Balança" desc="Prioriza e decodifica etiquetas EAN de balança" checked={formData.foco_balanca_automatico === 1} onChange={(c) => setFormData({ ...formData, foco_balanca_automatico: c ? 1 : 0 })} />
            </div>
          )}

          {activeTab === 'FINALIZACAO' && (
            <div className="space-y-2.5">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">Comportamento da Impressão de Cupom</div>
                <div className="grid grid-cols-3 gap-2">
                  {[ { id: 'SEMPRE', label: 'Sempre' }, { id: 'PERGUNTAR', label: 'Perguntar' }, { id: 'NAO_IMPRIMIR', label: 'Não Imprimir' } ].map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setFormData({ ...formData, comportamento_impressao: opt.id as any })} className={`p-2 rounded-lg border text-center font-bold text-xs transition-all ${formData.comportamento_impressao === opt.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl flex items-center justify-between">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">Forma de Pagamento Padrão (F10)</div>
                <select value={formData.pagamento_padrao} onChange={(e) => setFormData({ ...formData, pagamento_padrao: e.target.value as MetodoPagamento })} className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-lg text-slate-800 dark:text-white font-semibold text-xs">
                  <option value="DINHEIRO">1 - Dinheiro</option>
                  <option value="PIX">2 - PIX</option>
                  <option value="CARTAO_DEBITO">3 - Cartão Débito</option>
                  <option value="CARTAO_CREDITO">4 - Cartão Crédito</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'INTERFACE' && (
            <div className="space-y-2.5">
              {onOpenVisualCustomizer && (
                <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-blue-900 dark:text-blue-200 text-xs sm:text-sm">Identidade Visual & Marca da Loja</div>
                    <div className="text-[11px] text-blue-700/80 dark:text-blue-300/80">Nome fantasia, logotipo, slogan, cores da marca e nicho</div>
                  </div>
                  <button type="button" onClick={() => { onClose(); onOpenVisualCustomizer(); }} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <Palette className="w-3.5 h-3.5" /> Personalizar Loja
                  </button>
                </div>
              )}
              <ToggleOption title="Exibir Fotos no Dropdown de Busca" desc="Miniaturas no Omnibox (desative para velocidade extrema)" checked={formData.exibir_fotos_busca === 1} onChange={(c) => setFormData({ ...formData, exibir_fotos_busca: c ? 1 : 0 })} />
              <ToggleOption title="Sons e Bips do Sistema" desc="Feedback sonoro ao bipar produtos ou registrar erros" checked={formData.som_bip_sistema === 1} onChange={(c) => setFormData({ ...formData, som_bip_sistema: c ? 1 : 0 })} />
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Testar sinal acústico digital (Web Audio)</span>
                <div className="flex gap-2">
                  <button type="button" onClick={tocarBip} className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm"><Play className="w-3 h-3 text-emerald-600" /> Bip</button>
                  <button type="button" onClick={tocarAlerta} className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm"><Play className="w-3 h-3 text-amber-600" /> Alerta</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">Salvo no SQLite local do terminal</div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={salvando} className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold transition-colors">Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando} className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors">
              {sucesso ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              {salvando ? 'Salvando...' : sucesso ? 'Salvo!' : 'Salvar Preferências'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Sliders } from 'lucide-react';
import type { StoreSettings } from '../../context/ConfigProvider.js';

interface RegrasNegocioTabProps {
  formData: StoreSettings;
  setFormData: React.Dispatch<React.SetStateAction<StoreSettings>>;
}

const ToggleRow: React.FC<{
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  badge?: string;
}> = ({ title, desc, checked, onChange, badge }) => (
  <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition">
    <div className="pr-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{title}</span>
        {badge && (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            {badge}
          </span>
        )}
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</div>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
    />
  </label>
);

export const RegrasNegocioTab: React.FC<RegrasNegocioTabProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-4 font-sans select-none">
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-500" />
          <span>Regras de Negócio e Políticas Operacionais</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Controle as validações diárias do PDV, liberação de crédito/fiado e atalhos de comunicação
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="pr-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">Comportamento Fiscal do PDV</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                Fiscal NFC-e
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Escolha se o PDV transmite todas as vendas para a SEFAZ ou permite alternância discreta (PageUp/PageDown)
            </div>
          </div>
          <select
            value={formData.comportamento_fiscal_pdv || 'MANUAL'}
            onChange={(e) => setFormData({ ...formData, comportamento_fiscal_pdv: e.target.value as any })}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none"
          >
            <option value="MANUAL">Alternar Manualmente (PageUp / PageDown)</option>
            <option value="SEMPRE">Sempre Emitir NFC-e (Obrigatório)</option>
          </select>
        </div>

        <ToggleRow
          title="Forçar Fechamento Diário de Caixa"
          desc="Se ativado, bloqueia o PDV se houver caixa aberto de data anterior, exigindo contagem e encerramento antes de abrir o dia"
          checked={formData.forcar_fechamento_diario !== false}
          onChange={(v) => setFormData({ ...formData, forcar_fechamento_diario: v })}
          badge="Segurança"
        />

        <ToggleRow
          title="Controle de Fiado / Convênio"
          desc="Habilita limite de crédito por cliente, cobrança a prazo e forma de pagamento Convênio no PDV"
          checked={Boolean(formData.habilitar_convenio ?? formData.ativar_crediario)}
          onChange={(v) => setFormData({ ...formData, habilitar_convenio: v, ativar_crediario: v })}
          badge="Crédito"
        />

        <ToggleRow
          title="Botão de WhatsApp no Cadastro e PDV"
          desc="Exibe atalho direto para iniciar conversa via WhatsApp Web a partir do telefone do cliente cadastrado"
          checked={formData.habilitar_whatsapp !== false}
          onChange={(v) => setFormData({ ...formData, habilitar_whatsapp: v })}
          badge="Comunicação"
        />

        <ToggleRow
          title="Exigir Senha para Cancelamento de Venda/Item"
          desc="Solicita credencial gerencial ao cancelar itens ou cupons no PDV quando o operador não tem permissão"
          checked={formData.exigir_senha_cancelamento}
          onChange={(v) => setFormData({ ...formData, exigir_senha_cancelamento: v })}
        />

        <ToggleRow
          title="Permitir Venda com Estoque Negativo"
          desc="Libera a venda no caixa mesmo se o produto estiver com saldo zerado no depósito"
          checked={formData.permitir_estoque_negativo}
          onChange={(v) => setFormData({ ...formData, permitir_estoque_negativo: v })}
        />

        <ToggleRow
          title="Agrupamento Inteligente de Itens Repetidos"
          desc="Soma múltiplos itens do mesmo produto na mesma linha (ex: 4x) em vez de linhas soltas no carrinho"
          checked={formData.agrupar_itens}
          onChange={(v) => setFormData({ ...formData, agrupar_itens: v })}
        />

        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Desconto Máximo Livre do Operador (%)</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Descontos maiores no PDV exigem autorização de supervisor</div>
          </div>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.desconto_maximo_operador}
            onChange={(e) => setFormData({ ...formData, desconto_maximo_operador: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-slate-800 dark:text-slate-100 font-mono text-center text-xs"
          />
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldCheck, ShieldAlert, Scale } from 'lucide-react';

interface FiscalConfigStepProps {
  deixarParaDepois: boolean;
  setDeixarParaDepois: (v: boolean) => void;
  idTokenCsc: string;
  setIdTokenCsc: (v: string) => void;
  tokenCsc: string;
  setTokenCsc: (v: string) => void;
  comportamentoFiscal: 'SEMPRE' | 'MANUAL';
  setComportamentoFiscal: (v: 'SEMPRE' | 'MANUAL') => void;
  balancaCheckoutAtiva: boolean;
  setBalancaCheckoutAtiva: (v: boolean) => void;
  balancaModelo: string;
  setBalancaModelo: (v: string) => void;
  balancaPorta: string;
  setBalancaPorta: (v: string) => void;
  nomeLoja: string;
  enderecoFormatado: string;
  telefone: string;
  adminNome: string;
  adminLogin: string;
}

export const FiscalConfigStep: React.FC<FiscalConfigStepProps> = ({
  deixarParaDepois,
  setDeixarParaDepois,
  idTokenCsc,
  setIdTokenCsc,
  tokenCsc,
  setTokenCsc,
  comportamentoFiscal,
  setComportamentoFiscal,
  balancaCheckoutAtiva,
  setBalancaCheckoutAtiva,
  balancaModelo,
  setBalancaModelo,
  balancaPorta,
  setBalancaPorta,
  nomeLoja,
  enderecoFormatado,
  telefone,
  adminNome,
  adminLogin,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        <span>Emissão Fiscal NFC-e & Parâmetros Finais</span>
      </div>

      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deixarParaDepois}
            onChange={(e) => setDeixarParaDepois(e.target.checked)}
            className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
          />
          <span className="text-xs font-semibold text-slate-300">Configurar NFC-e depois (Operar em modo interno/recibo)</span>
        </label>

        {!deixarParaDepois ? (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">ID Token CSC</label>
              <input
                type="text"
                value={idTokenCsc}
                onChange={(e) => setIdTokenCsc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Token CSC (SEFAZ)</label>
              <input
                type="text"
                value={tokenCsc}
                onChange={(e) => setTokenCsc(e.target.value)}
                placeholder="Código alfanumérico SEFAZ"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs font-mono"
              />
            </div>
          </div>
        ) : (
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[11px] text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>O sistema funcionará para vendas e estoque. O CSC e Certificado A1 podem ser incluídos na Retaguarda.</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400">Modo de Emissão Fiscal no PDV:</span>
          <select
            value={comportamentoFiscal}
            onChange={(e) => setComportamentoFiscal(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
          >
            <option value="MANUAL">Alternar Manualmente (PageUp / PageDown)</option>
            <option value="SEMPRE">Sempre Emitir NFC-e</option>
          </select>
        </div>
      </div>

      {/* Card Interativo: Balança de Checkout (Serial / USB) */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={balancaCheckoutAtiva}
            onChange={(e) => setBalancaCheckoutAtiva(e.target.checked)}
            className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
          />
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Este caixa utiliza Balança de Checkout (Serial / USB)</span>
          </div>
        </label>
        <p className="text-[11px] text-slate-400 pl-6">
          Integração automática para produtos pesáveis direto no checkout (Toledo, Filizola, Elgin, Urano).
        </p>

        {balancaCheckoutAtiva && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Modelo da Balança</label>
              <select
                value={balancaModelo}
                onChange={(e) => setBalancaModelo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
              >
                <option value="TOLEDO">Toledo (Prix 3, Fit, Plus, 9094)</option>
                <option value="FILIZOLA">Filizola (BP, Platina, CS)</option>
                <option value="ELGIN">Elgin (DP-15, DP-30)</option>
                <option value="URANO">Urano (Pop Light, Pop-S)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Porta de Comunicação</label>
              <select
                value={balancaPorta}
                onChange={(e) => setBalancaPorta(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs font-mono"
              >
                <option value="AUTO">AUTO (Plug and Play)</option>
                <option value="COM1">COM1</option>
                <option value="COM2">COM2</option>
                <option value="COM3">COM3</option>
                <option value="COM4">COM4</option>
                <option value="COM5">COM5</option>
                <option value="COM6">COM6</option>
                <option value="COM7">COM7</option>
                <option value="COM8">COM8</option>
                <option value="COM9">COM9</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-1">
        <div className="flex justify-between text-slate-400"><span>Loja:</span><span className="font-bold text-white">{nomeLoja}</span></div>
        <div className="flex justify-between text-slate-400"><span>Endereço:</span><span className="font-medium text-slate-300 truncate max-w-xs">{enderecoFormatado}</span></div>
        <div className="flex justify-between text-slate-400"><span>Contato:</span><span className="font-medium text-slate-300">{telefone}</span></div>
        <div className="flex justify-between text-slate-400"><span>Administrador:</span><span className="font-bold text-emerald-400">{adminNome} (@{adminLogin})</span></div>
      </div>
    </div>
  );
};

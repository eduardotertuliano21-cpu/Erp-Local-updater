import React, { useState } from 'react';
import { KeyRound, Unlock, Sparkles, CheckCircle2, Server, CreditCard, DownloadCloud, Activity } from 'lucide-react';
import { masterAdminApi } from '../../services/masterAdminApi.js';
import { CaixaPretaTab } from './CaixaPretaTab.js';

interface MasterDashboardProps {
  statusMaster: any;
  onRefresh: () => void;
  onLogout: () => void;
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({ statusMaster, onRefresh, onLogout }) => {
  const [abaAtiva, setAbaAtiva] = useState<'LICENCA' | 'STRIPE' | 'SISTEMA' | 'CAIXA_PRETA'>('LICENCA');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [diasCustom, setDiasCustom] = useState(7);
  const [planoStripe, setPlanoStripe] = useState<'MENSAL' | 'ANUAL'>('MENSAL');
  const [resultadoStripe, setResultadoStripe] = useState<any>(null);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  const handleDesbloquear = async () => {
    setLoading(true); setErro(null);
    const res = await masterAdminApi.desbloquear();
    setLoading(false);
    if (res.success && res.data) { setSucesso(res.data.mensagem); onRefresh(); }
    else setErro(res.error || 'Falha ao desbloquear');
  };

  const handleBloquear = async () => {
    if (!confirm('Deseja realmente BLOQUEAR imediatamente o sistema desta loja?')) return;
    setLoading(true); setErro(null);
    const res = await masterAdminApi.bloquear();
    setLoading(false);
    if (res.success && res.data) { setSucesso(res.data.mensagem); onRefresh(); }
    else setErro(res.error || 'Falha ao bloquear sistema');
  };

  const handleConcederTeste = async (dias: number) => {
    setLoading(true); setErro(null);
    const res = await masterAdminApi.concederTeste(dias);
    setLoading(false);
    if (res.success && res.data) { setSucesso(res.data.mensagem); onRefresh(); }
    else setErro(res.error || 'Falha ao conceder teste');
  };

  const handleSimularStripe = async () => {
    setLoading(true); setErro(null); setResultadoStripe(null);
    const res = await masterAdminApi.simularStripe(planoStripe);
    setLoading(false);
    if (res.success && res.data) {
      setResultadoStripe(res.data);
      setSucesso('Retorno da API Stripe confirmado com sucesso!');
      onRefresh();
    } else setErro(res.error || 'Falha no teste Stripe');
  };

  const handleChecarUpdates = async () => {
    setLoading(true); setErro(null);
    const res = await masterAdminApi.checarAtualizacoes();
    setLoading(false);
    if (res.success) setUpdateInfo(res.data);
    else setErro(res.error || 'Erro ao checar atualizações');
  };

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => { setAbaAtiva('LICENCA'); setErro(null); setSucesso(null); }} className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${abaAtiva === 'LICENCA' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-slate-800/60'}`}>
            <Unlock className="w-3.5 h-3.5" /><span>Licença & Testes</span>
          </button>
          <button type="button" onClick={() => { setAbaAtiva('STRIPE'); setErro(null); setSucesso(null); }} className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${abaAtiva === 'STRIPE' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-slate-800/60'}`}>
            <CreditCard className="w-3.5 h-3.5" /><span>Sandbox Stripe API</span>
          </button>
          <button type="button" onClick={() => { setAbaAtiva('SISTEMA'); setErro(null); setSucesso(null); }} className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${abaAtiva === 'SISTEMA' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-slate-800/60'}`}>
            <Server className="w-3.5 h-3.5" /><span>Auto-Update & Info</span>
          </button>
          <button type="button" onClick={() => { setAbaAtiva('CAIXA_PRETA'); setErro(null); setSucesso(null); }} className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${abaAtiva === 'CAIXA_PRETA' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-slate-800/60'}`}>
            <Activity className="w-3.5 h-3.5" /><span>Caixa Preta & IA</span>
          </button>
        </div>
        <button type="button" onClick={onLogout} className="text-xs text-rose-400 hover:text-rose-300 font-mono underline cursor-pointer">Sair do Terminal</button>
      </div>

      {sucesso && <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs text-center flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{sucesso}</span></div>}
      {erro && <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs text-center">{erro}</div>}

      {abaAtiva === 'LICENCA' && (
        <div className="space-y-4">
          {statusMaster?.licenca && (
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
              <div><span className="text-slate-500 block text-[10px]">STATUS ATUAL</span><strong className={statusMaster.licenca.status === 'ATIVA' ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>{statusMaster.licenca.status}</strong></div>
              <div><span className="text-slate-500 block text-[10px]">VENCIMENTO</span><strong className="text-white">{statusMaster.licenca.data_vencimento}</strong></div>
              <div><span className="text-slate-500 block text-[10px]">CARÊNCIA</span><strong className="text-amber-400">{statusMaster.licenca.dias_carencia || 0} dias</strong></div>
            </div>
          )}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5"><Unlock className="w-3.5 h-3.5" /><span>Controle Administrativo Imediato</span></h4>
            <p className="text-xs text-slate-400">Ativação ou bloqueio sincronizados em tempo real com a nuvem e o PDV local:</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={handleDesbloquear} disabled={loading} className="py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                <Sparkles className="w-4 h-4" /><span>⚡ Desbloquear (+30d)</span>
              </button>
              <button type="button" onClick={handleBloquear} disabled={loading} className="py-2.5 bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                <span>🚫 Bloquear Imediato</span>
              </button>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /><span>Libertar / Estender Teste Grátis</span></h4>
            <p className="text-xs text-slate-400">Conceda períodos de degustação grátis para clientes ou testes sem cobrança:</p>
            <div className="grid grid-cols-4 gap-2">
              <button type="button" onClick={() => handleConcederTeste(7)} className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer">+7 Dias</button>
              <button type="button" onClick={() => handleConcederTeste(15)} className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer">+15 Dias</button>
              <button type="button" onClick={() => handleConcederTeste(30)} className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer">+30 Dias</button>
              <div className="flex gap-1">
                <input type="number" min="1" max="365" value={diasCustom} onChange={(e) => setDiasCustom(Number(e.target.value))} className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-center font-mono" />
                <button type="button" onClick={() => handleConcederTeste(diasCustom)} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer">OK</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'STRIPE' && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /><span>Sandbox da API Stripe</span></div>
            <p className="text-[11px] text-slate-300">Ambiente de teste movido da tela de assinaturas pública para validação de retorno de pagamento.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div onClick={() => setPlanoStripe('MENSAL')} className={`p-3 rounded-xl border cursor-pointer transition ${planoStripe === 'MENSAL' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-950'}`}>
              <div className="text-xs font-bold text-white">Plano Mensal</div>
              <div className="text-sm font-black font-mono">R$ 99,00</div>
            </div>
            <div onClick={() => setPlanoStripe('ANUAL')} className={`p-3 rounded-xl border cursor-pointer transition ${planoStripe === 'ANUAL' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-950'}`}>
              <div className="text-xs font-bold text-white">Plano Anual</div>
              <div className="text-sm font-black font-mono">R$ 990,00</div>
            </div>
          </div>
          <button type="button" onClick={handleSimularStripe} disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            <Sparkles className="w-4 h-4" /><span>⚡ Simular Pagamento & Confirmar Retorno Stripe</span>
          </button>
          {resultadoStripe && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
              <div className="flex justify-between text-slate-400"><span>Status Retorno:</span><span className="text-emerald-400 font-bold">SUCCEEDED (CONFIRMADO)</span></div>
              <div className="flex justify-between text-slate-400"><span>Valor / Plano:</span><span className="text-white font-bold">{resultadoStripe.detalhes?.valor} ({resultadoStripe.detalhes?.plano})</span></div>
              <div className="flex justify-between text-slate-400"><span>ID Transação:</span><span className="text-slate-300 truncate max-w-[200px]">{resultadoStripe.detalhes?.idTransacao}</span></div>
              <div className="flex justify-between text-slate-400"><span>Data/Hora:</span><span className="text-slate-300">{resultadoStripe.detalhes?.dataAprovacao}</span></div>
            </div>
          )}
        </div>
      )}

      {abaAtiva === 'SISTEMA' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-slate-400"><span>Plataforma:</span><span className="text-white">{statusMaster?.sistema?.plataforma || 'win32'}</span></div>
            <div className="flex justify-between text-slate-400"><span>Node Uptime:</span><span className="text-white">{Math.round(statusMaster?.sistema?.uptime || 0)}s</span></div>
            <div className="flex justify-between text-slate-400"><span>Timestamp Servidor:</span><span className="text-slate-300">{statusMaster?.sistema?.timestamp}</span></div>
          </div>
          <button type="button" onClick={handleChecarUpdates} disabled={loading} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            <DownloadCloud className="w-4 h-4 text-sky-400" /><span>Checar Atualizações GitHub (Auto-Update)</span>
          </button>
          {updateInfo && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between"><span>Versão Local:</span><span className="text-white font-bold">{updateInfo.versaoAtual}</span></div>
              <div className="flex justify-between"><span>Última no GitHub:</span><span className="text-emerald-400 font-bold">{updateInfo.versaoRemota || 'N/A'}</span></div>
              <div className="flex justify-between"><span>Disponível:</span><span className={updateInfo.haAtualizacao ? 'text-amber-400 font-bold' : 'text-slate-400'}>{updateInfo.haAtualizacao ? 'SIM' : 'NÃO'}</span></div>
            </div>
          )}
        </div>
      )}

      {abaAtiva === 'CAIXA_PRETA' && <CaixaPretaTab />}
    </div>
  );
};

import React, { useState } from 'react';

export function TenantEditModal({ tenant, onClose, onSave }) {
  const [editingTenant, setEditingTenant] = useState({ ...tenant });
  const [buscandoCep, setBuscandoCep] = useState(false);

  const handleCepEditChange = async (val) => {
    const num = String(val || '').replace(/\D/g, '').slice(0, 8);
    const cepFmt = num.length > 5 ? `${num.slice(0, 5)}-${num.slice(5)}` : num;
    setEditingTenant((prev) => ({ ...prev, cep: cepFmt }));
    if (num.length === 8) {
      setBuscandoCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${num}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEditingTenant((prev) => ({
            ...prev,
            cep: cepFmt,
            logradouro: data.logradouro || prev.logradouro || '',
            bairro: data.bairro || prev.bairro || '',
            cidade: data.localidade || prev.cidade || '',
            estado: data.uf || prev.estado || '',
          }));
        }
      } catch (_e) {}
      setBuscandoCep(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editingTenant);
  };

  const handleForcarUpdateModal = async () => {
    if (!window.confirm(`Deseja forçar a atualização remota para "${editingTenant.nomeFantasia || editingTenant.razaoSocial}"?\n\nO sistema ERP baixará a versão oficial do GitHub e reinstalará mesmo que esteja na mesma versão.`)) return;
    try {
      const res = await api.forcarAtualizacaoTenant(editingTenant.id);
      alert(res.mensagem || 'Comando de atualização enviado com sucesso!');
    } catch (err) {
      alert('Falha ao enviar comando: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 max-h-[92vh] overflow-y-auto">
        <div>
          <h3 className="text-lg font-bold text-white">Controle Remoto & Dados da Empresa (Sincronizado com o ERP)</h3>
          <p className="text-xs text-slate-400">Qualquer alteração salva aqui será aplicada automaticamente na tela Dados da Empresa do cliente.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Razão Social</label>
              <input type="text" value={editingTenant.razaoSocial || ''} onChange={(e) => setEditingTenant({ ...editingTenant, razaoSocial: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Nome Fantasia (Nome da Loja)</label>
              <input type="text" value={editingTenant.nomeFantasia || ''} onChange={(e) => setEditingTenant({ ...editingTenant, nomeFantasia: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400">CNPJ / CPF do Emitente</label>
              <input type="text" value={editingTenant.cnpj || ''} onChange={(e) => setEditingTenant({ ...editingTenant, cnpj: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Telefone / WhatsApp Comercial</label>
              <input type="text" value={editingTenant.telefone || ''} onChange={(e) => setEditingTenant({ ...editingTenant, telefone: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-cyan-400">Endereço Fiscal Separado (Sincronizado com Primeiro Acesso e ERP)</div>
            <div className="grid grid-cols-12 gap-2.5">
              <div className="col-span-4 sm:col-span-3">
                <label className="text-xs text-slate-400">CEP {buscandoCep ? '(...)' : ''}</label>
                <input type="text" value={editingTenant.cep || ''} onChange={(e) => handleCepEditChange(e.target.value)} placeholder="00000-000" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono" />
              </div>
              <div className="col-span-8 sm:col-span-6">
                <label className="text-xs text-slate-400">Rua / Logradouro</label>
                <input type="text" value={editingTenant.logradouro || ''} onChange={(e) => setEditingTenant({ ...editingTenant, logradouro: e.target.value })} placeholder="Ex: Rua Diamante" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div className="col-span-4 sm:col-span-3">
                <label className="text-xs text-slate-400">Número</label>
                <input type="text" value={editingTenant.numero || ''} onChange={(e) => setEditingTenant({ ...editingTenant, numero: e.target.value })} placeholder="Ex: 360" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div className="col-span-8 sm:col-span-5">
                <label className="text-xs text-slate-400">Bairro</label>
                <input type="text" value={editingTenant.bairro || ''} onChange={(e) => setEditingTenant({ ...editingTenant, bairro: e.target.value })} placeholder="Ex: Centro" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div className="col-span-8 sm:col-span-5">
                <label className="text-xs text-slate-400">Cidade</label>
                <input type="text" value={editingTenant.cidade || ''} onChange={(e) => setEditingTenant({ ...editingTenant, cidade: e.target.value })} placeholder="Ex: Campo Limpo Paulista" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="text-xs text-slate-400">UF</label>
                <input type="text" maxLength={2} value={editingTenant.estado || ''} onChange={(e) => setEditingTenant({ ...editingTenant, estado: e.target.value.toUpperCase() })} placeholder="SP" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono uppercase" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">URL do Logotipo da Empresa</label>
            <input type="text" value={editingTenant.logoUrl || ''} onChange={(e) => setEditingTenant({ ...editingTenant, logoUrl: e.target.value })} placeholder="https://suaempresa.com/logo.png" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs text-amber-400 font-bold">Ramo de Atuação (Nicho)</label>
              <select value={editingTenant.ramo_atuacao || 'mercado'} onChange={(e) => setEditingTenant({ ...editingTenant, ramo_atuacao: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-medium">
                <option value="mercado">🛒 Mercado / Varejo</option>
                <option value="restaurante">🍽️ Restaurante / Food</option>
                <option value="acougue">🥩 Açougue / Peso</option>
                <option value="autopecas">🚗 Autopeças</option>
                <option value="assistencia">🔧 Assistência Técnica</option>
                <option value="roupas">👕 Vestuário / Roupas</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-cyan-400 font-bold">Status Remoto</label>
              <select value={editingTenant.statusLicenca} onChange={(e) => setEditingTenant({ ...editingTenant, statusLicenca: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                <option value="ATIVA">ATIVA (Liberado)</option>
                <option value="BLOQUEADA">BLOQUEADA (Travar PDV)</option>
                <option value="INADIMPLENTE">INADIMPLENTE</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-cyan-400 font-bold">Vencimento da Licença</label>
              <input type="date" value={editingTenant.dataExpiracao || ''} onChange={(e) => setEditingTenant({ ...editingTenant, dataExpiracao: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono" />
            </div>
            <div>
              <label className="text-xs text-cyan-400 font-bold">Dias de Carência</label>
              <input type="number" value={editingTenant.diasCarencia || 0} onChange={(e) => setEditingTenant({ ...editingTenant, diasCarencia: Number(e.target.value) })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono" />
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">📄 Módulo Fiscal NF-e / DANFE (Sem alterar plano / Sem custo extra)</div>
              <div className="text-[11px] text-slate-400">Habilita ou desabilita NF-e (Modelo 55), DANFE A4 e NFC-e para o cliente final</div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(editingTenant.moduloNfe)}
                onChange={(e) => setEditingTenant({ ...editingTenant, moduloNfe: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 text-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold">{editingTenant.moduloNfe ? <span className="text-emerald-400">LIBERADO</span> : <span className="text-slate-500">DESABILITADO</span>}</span>
            </label>
          </div>
          <div className="flex items-center justify-between gap-3 pt-3">
            <button type="button" onClick={handleForcarUpdateModal} className="px-3.5 py-2 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/40 text-xs font-semibold text-indigo-300 rounded-xl cursor-pointer transition flex items-center gap-1.5" title="Disparar download e reinstalação imediata no PDV">
              <span>🔄</span>
              <span>Atualizar Sistema (GitHub)</span>
            </button>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer">Salvar e Aplicar no ERP</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

import React from 'react';

export function TenantAddressCard({ formData, setFormData, buscandoCep, onCepChange }) {
  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <span>🏪</span>
        <span>Dados da Empresa & Endereço Fiscal</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Nome Fantasia (Loja)</label>
          <input
            type="text"
            value={formData.nomeFantasia || ''}
            onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Razão Social</label>
          <input
            type="text"
            value={formData.razaoSocial || ''}
            onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">CNPJ / CPF</label>
          <input
            type="text"
            value={formData.cnpj || ''}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-800">
        <div className="sm:col-span-3">
          <label className="text-xs text-slate-400 block mb-1">CEP {buscandoCep ? '(...)' : ''}</label>
          <input
            type="text"
            value={formData.cep || ''}
            onChange={(e) => onCepChange(e.target.value)}
            placeholder="00000-000"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono outline-none"
          />
        </div>
        <div className="sm:col-span-6">
          <label className="text-xs text-slate-400 block mb-1">Rua / Logradouro</label>
          <input
            type="text"
            value={formData.logradouro || ''}
            onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs text-slate-400 block mb-1">Número</label>
          <input
            type="text"
            value={formData.numero || ''}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
          />
        </div>
        <div className="sm:col-span-5">
          <label className="text-xs text-slate-400 block mb-1">Bairro</label>
          <input
            type="text"
            value={formData.bairro || ''}
            onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
          />
        </div>
        <div className="sm:col-span-5">
          <label className="text-xs text-slate-400 block mb-1">Cidade</label>
          <input
            type="text"
            value={formData.cidade || ''}
            onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-400 block mb-1">UF</label>
          <input
            type="text"
            maxLength={2}
            value={formData.estado || ''}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono uppercase outline-none"
          />
        </div>
      </div>
    </div>
  );
}

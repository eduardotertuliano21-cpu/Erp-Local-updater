import React from 'react';
import { Building2, Search, Loader2 } from 'lucide-react';
import { formatarCep, formatarTelefone } from './cepHelper.js';

export interface EstabelecimentoFormProps {
  nomeLoja: string;
  setNomeLoja: (v: string) => void;
  razaoSocial: string;
  setRazaoSocial: (v: string) => void;
  cnpj: string;
  setCnpj: (v: string) => void;
  telefone: string;
  setTelefone: (v: string) => void;
  cep: string;
  setCep: (v: string) => void;
  logradouro: string;
  setLogradouro: (v: string) => void;
  numero: string;
  setNumero: (v: string) => void;
  bairro: string;
  setBairro: (v: string) => void;
  cidade: string;
  setCidade: (v: string) => void;
  estado: string;
  setEstado: (v: string) => void;
  segmento: string;
  setSegmento: (v: string) => void;
  carregandoCep: boolean;
  onBuscarCep: (cepVal: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  bloqueado?: boolean;
}

export const EstabelecimentoFormStep: React.FC<EstabelecimentoFormProps> = (props) => {
  return (
    <form id="passo1-form" onSubmit={props.onSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>Dados do Estabelecimento & Endereço Completo</span>
        </div>
        {props.bloqueado && (
          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            Validado pela Nuvem
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2">
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Nome da Loja / Fantasia *</label>
          <input
            type="text"
            required
            autoFocus
            value={props.nomeLoja}
            onChange={(e) => props.setNomeLoja(e.target.value)}
            placeholder="Ex: Supermercado Central"
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Razão Social (Opcional)</label>
          <input
            type="text"
            value={props.razaoSocial}
            onChange={(e) => props.setRazaoSocial(e.target.value)}
            placeholder="Ex: Comercial Silva LTDA"
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">CNPJ (Opcional)</label>
          <input
            type="text"
            value={props.cnpj}
            onChange={(e) => props.setCnpj(e.target.value)}
            placeholder="00.000.000/0001-00"
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs font-mono outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Telefone / WhatsApp de Contato *</label>
          <input
            type="text"
            required
            value={props.telefone}
            onChange={(e) => props.setTelefone(formatarTelefone(e.target.value))}
            placeholder="(11) 99999-9999"
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs font-mono outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">CEP (Busca Automática) *</label>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={props.cep}
              onChange={(e) => {
                const formatted = formatarCep(e.target.value);
                props.setCep(formatted);
                if (formatted.replace(/\D/g, '').length === 8) props.onBuscarCep(formatted);
              }}
              placeholder="00000-000"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 pr-8 text-white text-xs font-mono outline-none"
            />
            <div className="absolute right-2 text-slate-400">
              {props.carregandoCep ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Search className="w-3.5 h-3.5 text-slate-500" />}
            </div>
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-4 gap-2">
          <div className="col-span-3">
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Rua / Logradouro *</label>
            <input
              type="text"
              required
              value={props.logradouro}
              onChange={(e) => props.setLogradouro(e.target.value)}
              placeholder="Ex: Av. Paulista"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Número *</label>
            <input
              type="text"
              required
              value={props.numero}
              onChange={(e) => props.setNumero(e.target.value)}
              placeholder="Ex: 123"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs outline-none"
            />
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Bairro *</label>
            <input
              type="text"
              required
              value={props.bairro}
              onChange={(e) => props.setBairro(e.target.value)}
              placeholder="Ex: Centro"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Cidade *</label>
            <input
              type="text"
              required
              value={props.cidade}
              onChange={(e) => props.setCidade(e.target.value)}
              placeholder="Ex: São Paulo"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">UF (Estado) *</label>
            <input
              type="text"
              required
              maxLength={2}
              value={props.estado}
              onChange={(e) => props.setEstado(e.target.value.toUpperCase())}
              placeholder="SP"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs font-mono uppercase outline-none"
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Ramo de Atuação / Segmento Comercial</label>
          <select
            value={props.segmento}
            onChange={(e) => props.setSegmento(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs outline-none"
          >
            <option value="GERAL">Mercado / Mercearia / Varejo em Geral</option>
            <option value="RESTAURANTE">Restaurante / Lanchonete / Comandas Mobile</option>
            <option value="ACOUQUE">Açougue / Hortifrúti (Balança com Código de Barras)</option>
            <option value="ROUPAS">Vestuário / Roupas & Calçados (Grade de Cores/Tamanhos)</option>
            <option value="AUTOPECAS">Autopeças & Serviços Mecânicos</option>
            <option value="ASSISTENCIA">Assistência Técnica & Ordens de Serviço (OS)</option>
          </select>
        </div>
      </div>
    </form>
  );
};

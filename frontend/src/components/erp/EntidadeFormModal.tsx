import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { FuncionarioFields } from './FuncionarioFields.js';
import { useStoreConfig } from '../../context/ConfigProvider.js';
import { MessageCircle } from 'lucide-react';

interface EntidadeFormModalProps {
  isOpen: boolean;
  entidadeEditando?: any | null;
  tipoInicial?: 'CLIENTE' | 'FORNECEDOR' | 'TRANSPORTADORA' | 'FUNCIONARIO';
  onClose: () => void;
  onSalvo: () => void;
}

export const EntidadeFormModal: React.FC<EntidadeFormModalProps> = ({
  isOpen,
  entidadeEditando,
  tipoInicial = 'CLIENTE',
  onClose,
  onSalvo,
}) => {
  const { featureFlags } = useStoreConfig();
  const [tipo, setTipo] = useState<'CLIENTE' | 'FORNECEDOR' | 'TRANSPORTADORA' | 'FUNCIONARIO'>(tipoInicial);
  const [razaoSocial, setRazaoSocial] = useState(''), [nomeFantasia, setNomeFantasia] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState(''), [ieRg, setIeRg] = useState(''), [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState(''), [endereco, setEndereco] = useState(''), [limiteCredito, setLimiteCredito] = useState('0');
  const [cargo, setCargo] = useState('OPERADOR_CAIXA'), [matricula, setMatricula] = useState(''), [pin, setPin] = useState('1234');
  const [comissaoPercentual, setComissaoPercentual] = useState('0'), [limiteDesconto, setLimiteDesconto] = useState('5');
  const [salvando, setSalvando] = useState(false), [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const e = entidadeEditando;
    setTipo(e?.tipo || tipoInicial);
    setRazaoSocial(e?.razao_social || '');
    setNomeFantasia(e?.nome_fantasia || '');
    setCpfCnpj(e?.cpf_cnpj || '');
    setIeRg(e?.ie_rg || '');
    setEmail(e?.email || '');
    setTelefone(e?.telefone || '');
    setEndereco(e?.endereco || '');
    setLimiteCredito(String(e?.limite_credito || '0'));
    setCargo(e?.cargo || (tipoInicial === 'FUNCIONARIO' ? 'OPERADOR_CAIXA' : 'VENDEDOR'));
    setMatricula(e?.matricula || '');
    setPin(e?.pin || '1234');
    setComissaoPercentual(String(e?.comissao_percentual ?? 0));
    setLimiteDesconto(String(e?.limite_desconto ?? 5));
    setErro(null);
  }, [entidadeEditando, tipoInicial, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial.trim()) {
      setErro('Nome / Razão Social é obrigatório.');
      return;
    }
    if (tipo !== 'FUNCIONARIO' && !cpfCnpj.trim()) {
      setErro('CPF/CNPJ é obrigatório para Clientes, Fornecedores e Transportadoras.');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const res = await api.salvarEntidade({
        id: entidadeEditando?.id,
        tipo,
        razao_social: razaoSocial.trim(),
        nome_fantasia: nomeFantasia.trim() || undefined,
        cpf_cnpj: cpfCnpj.trim() || (tipo === 'FUNCIONARIO' ? matricula.trim() : ''),
        ie_rg: ieRg.trim() || undefined,
        email: email.trim() || undefined,
        telefone: telefone.trim() || undefined,
        endereco: endereco.trim() || undefined,
        limite_credito: parseFloat(limiteCredito.replace(',', '.')) || 0,
        cargo: tipo === 'FUNCIONARIO' ? cargo : undefined,
        matricula: tipo === 'FUNCIONARIO' ? (matricula.trim() || razaoSocial.split(' ')[0].toUpperCase()) : undefined,
        pin: tipo === 'FUNCIONARIO' ? (pin.trim() || '1234') : undefined,
        comissao_percentual: tipo === 'FUNCIONARIO' ? parseFloat(comissaoPercentual.replace(',', '.')) || 0 : 0,
        limite_desconto: tipo === 'FUNCIONARIO' ? parseFloat(limiteDesconto.replace(',', '.')) || 0 : 0,
        ativo: 1,
      });

      if (res.success) {
        onSalvo();
        onClose();
      } else {
        setErro(res.error || 'Erro ao salvar');
      }
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const isFuncionario = tipo === 'FUNCIONARIO';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>{isFuncionario ? '👔' : '👥'}</span>
            <span>
              {entidadeEditando
                ? (isFuncionario ? 'EDITAR COLABORADOR' : 'EDITAR ENTIDADE')
                : (isFuncionario ? 'NOVO COLABORADOR / EQUIPE' : 'NOVO CADASTRO DE ENTIDADE')}
            </span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {erro && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded text-rose-200 text-xs">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Cadastro *</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="CLIENTE">CLIENTE</option>
                <option value="FUNCIONARIO">FUNCIONÁRIO / OPERADOR PDV</option>
                <option value="FORNECEDOR">FORNECEDOR</option>
                <option value="TRANSPORTADORA">TRANSPORTADORA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFuncionario ? 'CPF do Funcionário' : 'CPF / CNPJ *'}
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder={isFuncionario ? '000.000.000-00 (Opcional)' : '000.000.000-00 ou CNPJ'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isFuncionario ? 'Nome Completo do Colaborador *' : 'Nome / Razão Social *'}
            </label>
            <input
              type="text"
              required
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder={isFuncionario ? 'Ex: Carlos Alberto da Silva' : 'Ex: João da Silva ME'}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Seção Especial para Funcionários & Operadores de Caixa */}
          {isFuncionario && (
            <FuncionarioFields
              cargo={cargo}
              setCargo={setCargo}
              matricula={matricula}
              setMatricula={setMatricula}
              pin={pin}
              setPin={setPin}
              comissaoPercentual={comissaoPercentual}
              setComissaoPercentual={setComissaoPercentual}
              limiteDesconto={limiteDesconto}
              setLimiteDesconto={setLimiteDesconto}
            />
          )}

          {!isFuncionario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Ex: ABC Alimentos"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Inscrição Estadual / RG</label>
                <input
                  type="text"
                  value={ieRg}
                  onChange={(e) => setIeRg(e.target.value)}
                  placeholder="Isento ou número"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Telefone / WhatsApp</label>
                {featureFlags.whatsapp && telefone.replace(/\D/g, '') && (
                  <button
                    type="button"
                    onClick={() => window.open(`https://wa.me/55${telefone.replace(/\D/g, '')}`, '_blank')}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                )}
              </div>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {!isFuncionario && tipo === 'CLIENTE' && featureFlags.convenio && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Limite de Crédito (R$)</label>
                <input
                  type="text"
                  value={limiteCredito}
                  onChange={(e) => setLimiteCredito(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Endereço Completo</label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              {salvando ? 'Salvando...' : (isFuncionario ? 'Salvar Colaborador' : 'Salvar Entidade')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

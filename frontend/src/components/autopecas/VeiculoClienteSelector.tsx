import React, { useState } from 'react';
import { Car, Save, CheckCircle2 } from 'lucide-react';
import { enterpriseApi, type VeiculoCliente } from '../../services/enterpriseApi.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';

interface VeiculoClienteSelectorProps {
  clienteId?: string;
  onSelectVeiculo?: (veiculo: VeiculoCliente) => void;
}

export const VeiculoClienteSelector: React.FC<VeiculoClienteSelectorProps> = ({
  clienteId,
  onSelectVeiculo,
}) => {
  const { isAutoPecas, isAssistencia } = useBusinessMode();
  if (!isAutoPecas && !isAssistencia) return null;
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [encontrado, setEncontrado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);

  const formatarPlaca = (val: string) => {
    return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  };

  const buscarPlaca = async (valPlaca: string) => {
    const clean = formatarPlaca(valPlaca);
    if (clean.length < 7) return;

    try {
      const v = await enterpriseApi.buscarVeiculoPlaca(clean);
      if (v) {
        setMarca(v.marca || '');
        setModelo(v.modelo || '');
        setAno(v.ano ? String(v.ano) : '');
        setKmAtual(v.km_atual ? String(v.km_atual) : '');
        setEncontrado(true);
        onSelectVeiculo?.(v);
      } else {
        setEncontrado(false);
      }
    } catch {
      setEncontrado(false);
    }
  };

  const handleSalvar = async () => {
    if (!placa.trim()) return;
    setSalvando(true);
    setMsgSucesso(null);
    try {
      const v = await enterpriseApi.salvarVeiculo({
        cliente_id: clienteId || 'CLIENTE_PADRAO',
        placa: formatarPlaca(placa),
        marca,
        modelo,
        ano: ano ? parseInt(ano, 10) : undefined,
        km_atual: kmAtual ? parseFloat(kmAtual) : 0,
      });
      setEncontrado(true);
      setMsgSucesso('Veículo e KM salvos com sucesso!');
      onSelectVeiculo?.(v);
      setTimeout(() => setMsgSucesso(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar veículo:', err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 font-sans text-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Memória de Frota Local (Autopeças / Oficina)
          </h3>
        </div>
        {encontrado && (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" />
            Cadastrado
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Placa (Mercosul/Antiga)</label>
          <input
            type="text"
            placeholder="ABC1D23"
            value={placa}
            onChange={(e) => {
              const fmt = formatarPlaca(e.target.value);
              setPlaca(fmt);
              if (fmt.length === 7) buscarPlaca(fmt);
            }}
            onBlur={() => buscarPlaca(placa)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 font-mono text-center font-bold text-white uppercase focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Marca</label>
          <input
            type="text"
            placeholder="Ex: Fiat, VW, Ford"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Modelo</label>
          <input
            type="text"
            placeholder="Ex: Palio, Gol"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Ano</label>
          <input
            type="number"
            placeholder="2020"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-center font-mono text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">KM Atual</label>
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="75000"
              value={kmAtual}
              onChange={(e) => setKmAtual(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-center font-mono text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleSalvar}
              disabled={salvando || !placa}
              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Salvar Veículo e KM"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {msgSucesso && (
        <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{msgSucesso}</span>
        </div>
      )}
    </div>
  );
};

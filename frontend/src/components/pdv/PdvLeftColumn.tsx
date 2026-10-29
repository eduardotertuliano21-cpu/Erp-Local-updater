import React from 'react';
import { PdvHeader } from './PdvHeader.js';
import { BarcodeInput } from './BarcodeInput.js';
import { CartItemsList } from './CartItemsList.js';
import { RestaurantTablesBar, type Mesa } from '../restaurant/RestaurantTablesBar.js';
import { RestaurantTablesGrid } from '../restaurant/RestaurantTablesGrid.js';
import { AssistenciaOsBar } from '../assistencia/AssistenciaOsBar.js';
import { AssistenciaOsGrid } from '../assistencia/AssistenciaOsGrid.js';
import { assistenciaApi, type OrdemDeServico } from '../../services/assistenciaApi.js';
import type { ItemCarrinho } from '../../types/pdv.js';

interface PdvLeftColumnProps {
  config: any;
  isDark: boolean;
  toggleTheme: () => void;
  onAbrirRetaguarda: () => void;
  onAbrirConfig: () => void;
  modoRestaurante: boolean;
  isAssistencia: boolean;
  mesaAtiva: number | null;
  osAtiva: OrdemDeServico | null;
  isMapExpanded: boolean;
  onToggleExpand: () => void;
  onSelectMesa: (numero: number | null, mesa?: Mesa) => void;
  onSelectOs: (os: OrdemDeServico | null) => void;
  onAbrirQrModal: (tipo?: 'mobile' | 'kds') => void;
  mesasRestaurante: Mesa[];
  setMesasRestaurante: (m: Mesa[]) => void;
  ordensAssistencia: OrdemDeServico[];
  setOrdensAssistencia: (o: OrdemDeServico[]) => void;
  onScanBarcode: (code: string) => void;
  isModalOpen: boolean;
  isCarregando: boolean;
  mensagemStatus: string;
  itens: ItemCarrinho[];
  selectedIndex: number;
  onSelectItem: (idx: number) => void;
  onCloseExpanded: () => void;
}

export const PdvLeftColumn: React.FC<PdvLeftColumnProps> = ({
  config,
  isDark,
  toggleTheme,
  onAbrirRetaguarda,
  onAbrirConfig,
  modoRestaurante,
  isAssistencia,
  mesaAtiva,
  osAtiva,
  isMapExpanded,
  onToggleExpand,
  onSelectMesa,
  onSelectOs,
  onAbrirQrModal,
  mesasRestaurante,
  setMesasRestaurante,
  ordensAssistencia,
  setOrdensAssistencia,
  onScanBarcode,
  isModalOpen,
  isCarregando,
  mensagemStatus,
  itens,
  selectedIndex,
  onSelectItem,
  onCloseExpanded,
}) => {
  return (
    <div className="w-full lg:w-[68%] xl:w-[70%] flex-1 lg:h-full min-h-[380px] lg:min-h-0 flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <PdvHeader
        nomeLoja={config.nome_loja}
        slogan={config.slogan}
        logoUrl={config.logo_url}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onAbrirRetaguarda={onAbrirRetaguarda}
        onAbrirConfig={onAbrirConfig}
      />

      {modoRestaurante && (
        <RestaurantTablesBar
          mesaAtiva={mesaAtiva}
          isMapExpanded={isMapExpanded}
          onToggleExpandMap={onToggleExpand}
          onSelectMesa={onSelectMesa}
          onAbrirQrModal={onAbrirQrModal}
          onMesasChange={setMesasRestaurante}
        />
      )}

      {isAssistencia && (
        <AssistenciaOsBar
          osAtiva={osAtiva}
          isExpanded={isMapExpanded}
          onToggleExpand={onToggleExpand}
          onSelectOs={onSelectOs}
          onOrdensChange={setOrdensAssistencia}
        />
      )}

      {isMapExpanded ? (
        modoRestaurante ? (
          <RestaurantTablesGrid
            mesas={mesasRestaurante}
            mesaAtiva={mesaAtiva}
            onSelectMesa={(num, m) => {
              onSelectMesa(num, m);
              onCloseExpanded();
            }}
            onClose={onCloseExpanded}
          />
        ) : (
          <AssistenciaOsGrid
            ordens={ordensAssistencia}
            osAtiva={osAtiva}
            onSelectOs={(os) => {
              onSelectOs(os);
              onCloseExpanded();
            }}
            onClose={onCloseExpanded}
            onAtualizarLista={() => {
              assistenciaApi.listarOrdens().then((res) => {
                if (res.success && res.data) setOrdensAssistencia(res.data);
              });
            }}
          />
        )
      ) : (
        <>
          <BarcodeInput
            onScan={onScanBarcode}
            isModalOpen={isModalOpen}
            isCarregando={isCarregando}
            mensagemStatus={mensagemStatus}
            itensCount={itens.length}
          />
          <CartItemsList itens={itens} selectedIndex={selectedIndex} onSelectItem={onSelectItem} />
        </>
      )}
    </div>
  );
};

import React from 'react';
import type { ErpTabType } from './ErpLayout.js';
import { ProdutosView } from './ProdutosView.js';
import { EntidadesView } from './EntidadesView.js';
import { FinanceiroView } from './FinanceiroView.js';
import { EstoqueView } from './EstoqueView.js';
import { PcpView } from './PcpView.js';
import { RelatoriosView } from './RelatoriosView.js';
import { SettingsPanel } from './SettingsPanel.js';
import { SubscriptionManagerView } from './SubscriptionManagerView.js';
import { AssistenciaErpView } from './AssistenciaErpView.js';
import { MesasErpView } from './MesasErpView.js';
import { PromocoesView } from './PromocoesView.js';
import { AuditoriaView } from './AuditoriaView.js';
import { CurvaAbcView } from './CurvaAbcView.js';
import { EtiquetasView } from './EtiquetasView.js';
import { KdsScreen } from '../restaurant/KdsScreen.js';
import { ComprasEntradaTab } from './ComprasEntradaTab.js';
import { NfeDanfeView } from './NfeDanfeView.js';
import { DesossaAcougueTab } from './DesossaAcougueTab.js';
import { HelpCenterView } from '../help/HelpCenterView.js';
import { ProtectedRoute } from '../auth/ProtectedRoute.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';

interface ErpContentProps {
  currentTab: ErpTabType;
  onSelectTab?: (tab: ErpTabType) => void;
  onVoltarPdv?: () => void;
}

export const ErpContent: React.FC<ErpContentProps> = ({
  currentTab,
  onSelectTab,
  onVoltarPdv = () => {},
}) => {
  const { isRestaurante, isAcougue, isAssistencia } = useBusinessMode();

  switch (currentTab) {
    case 'AJUDA':
      return <HelpCenterView onSelectTab={onSelectTab} onVoltarPdv={onVoltarPdv} />;

    case 'DASHBOARD':
    case 'RELATORIOS':
      return (
        <ProtectedRoute permissao="pode_ver_relatorios" onVoltarPdv={onVoltarPdv} motivo="Seu perfil não possui permissão para visualizar relatórios e indicadores gerenciais.">
          <RelatoriosView />
        </ProtectedRoute>
      );

    case 'PRODUTOS':
      return (
        <ProtectedRoute permissao="acessa_estoque" onVoltarPdv={onVoltarPdv} motivo="Seu perfil não possui permissão para gerenciar catálogo de produtos.">
          <ProdutosView />
        </ProtectedRoute>
      );

    case 'PROMOCOES':
      return (
        <ProtectedRoute permissao="pode_dar_desconto" onVoltarPdv={onVoltarPdv}>
          <PromocoesView />
        </ProtectedRoute>
      );

    case 'MESAS':
      if (!isRestaurante) return null;
      return <MesasErpView />;

    case 'ORDENS_SERVICO':
      if (!isAssistencia) return null;
      return <AssistenciaErpView />;

    case 'ENTIDADES':
      return <EntidadesView />;

    case 'FINANCEIRO':
      return (
        <ProtectedRoute permissao="acessa_financeiro" onVoltarPdv={onVoltarPdv} motivo="Seu perfil não possui permissão para acessar o módulo financeiro e fluxo de caixa.">
          <FinanceiroView />
        </ProtectedRoute>
      );

    case 'ESTOQUE':
      return (
        <ProtectedRoute permissao="acessa_estoque" onVoltarPdv={onVoltarPdv} motivo="Seu perfil não possui permissão para acessar a gestão de estoque e inventário.">
          <EstoqueView />
        </ProtectedRoute>
      );

    case 'COMPRAS_ENTRADA':
      return (
        <ProtectedRoute permissao="acessa_estoque" onVoltarPdv={onVoltarPdv} motivo="Seu perfil não possui permissão para efetivar entrada de compras e NFe.">
          <ComprasEntradaTab />
        </ProtectedRoute>
      );

    case 'NFE_DANFE':
      return <NfeDanfeView />;

    case 'DESOSSA':
      if (!isAcougue) return null;
      return (
        <ProtectedRoute permissao="acessa_estoque" onVoltarPdv={onVoltarPdv} motivo="Seu perfil não possui permissão para gerenciar desossa de carnes.">
          <DesossaAcougueTab />
        </ProtectedRoute>
      );

    case 'PCP':
      return (
        <ProtectedRoute permissao="acessa_estoque" onVoltarPdv={onVoltarPdv}>
          <PcpView />
        </ProtectedRoute>
      );

    case 'CONFIGURACOES':
      return (
        <ProtectedRoute permissao="acessa_configuracoes" onVoltarPdv={onVoltarPdv} motivo="Seu perfil não possui permissão para alterar as configurações do sistema.">
          <SettingsPanel />
        </ProtectedRoute>
      );

    case 'ASSINATURA':
      return (
        <ProtectedRoute permissao="acessa_configuracoes" onVoltarPdv={onVoltarPdv}>
          <SubscriptionManagerView />
        </ProtectedRoute>
      );

    case 'CURVA_ABC':
      return (
        <ProtectedRoute permissao="pode_ver_relatorios" onVoltarPdv={onVoltarPdv} motivo="Seu perfil não possui permissão para visualizar indicadores da Curva ABC.">
          <CurvaAbcView />
        </ProtectedRoute>
      );

    case 'ETIQUETAS':
      return (
        <ProtectedRoute permissao="acessa_estoque" onVoltarPdv={onVoltarPdv}>
          <EtiquetasView />
        </ProtectedRoute>
      );

    case 'AUDITORIA':
      return (
        <ProtectedRoute permissao="acessa_configuracoes" onVoltarPdv={onVoltarPdv} motivo="Trilha de auditoria restrita a administradores e gerentes autorizados.">
          <AuditoriaView />
        </ProtectedRoute>
      );

    case 'KDS':
      if (!isRestaurante) return null;
      return <KdsScreen />;

    default:
      return <RelatoriosView />;
  }
};

import React from 'react';
import { Navbar } from './components/Navbar.jsx';
import { HeroSection } from './components/HeroSection.jsx';
import { DoresSection } from './components/DoresSection.jsx';
import { SolucaoSection } from './components/SolucaoSection.jsx';
import { NichosSection } from './components/NichosSection.jsx';
import { RecursosSection } from './components/RecursosSection.jsx';
import FaqSection from './components/FaqSection.jsx';
import FooterSection from './components/FooterSection.jsx';
import AdminPanel from './admin/AdminPanel.jsx';

export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isAdminRoute = path === '/admin' || path.startsWith('/admin/');

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Barra de Navegação Fixa */}
      <Navbar />

      {/* Hero Principal com Prova Visual de Latência */}
      <HeroSection />

      {/* Seção das Dores Mais Comuns dos Comerciantes */}
      <DoresSection />

      {/* Apresentação da Solução Offline-First e Leveza */}
      <SolucaoSection />

      {/* Segmentos e Nichos com Comportamento Interativo */}
      <NichosSection />

      {/* Recursos de Confiança + Gráfico Dinâmico de Crescimento */}
      <RecursosSection />

      {/* FAQ com Respostas Práticas para Dúvidas Comuns */}
      <FaqSection />

      {/* CTA Final e Rodapé Institucional */}
      <FooterSection />
    </div>
  );
}

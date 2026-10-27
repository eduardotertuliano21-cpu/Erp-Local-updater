import { CatalogoSyncRepository } from '../repositories/CatalogoSyncRepository.js';
import { OperacaoRepository } from '../repositories/OperacaoRepository.js';
import crypto from 'node:crypto';

console.log('🌱 Populando dados de catálogo (catalogo_sync.db)...');

const catalogoSyncRepo = new CatalogoSyncRepository();
const operacaoRepo = new OperacaoRepository();

const produtosMock = [
  {
    id: crypto.randomUUID(),
    codigo_barras: '7891000100103',
    sku: 'BEV-001',
    descricao: 'REFRIGERANTE COCA-COLA LATA 350ML',
    preco_venda: 5.50,
    unidade_medida: 'UN',
    ncm: '22021000',
    cfop: '5102',
    aliquota_icms: 18.0,
    ativo: 1,
    atualizado_em: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    codigo_barras: '7891000100110',
    sku: 'BEV-002',
    descricao: 'AGUA MINERAL CRISTAL SEM GAS 500ML',
    preco_venda: 3.00,
    unidade_medida: 'UN',
    ncm: '22011000',
    cfop: '5102',
    aliquota_icms: 0.0,
    ativo: 1,
    atualizado_em: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    codigo_barras: '7891000100127',
    sku: 'SNK-001',
    descricao: 'BATATA FRITA LAYS CLASSICA 80G',
    preco_venda: 9.90,
    unidade_medida: 'UN',
    ncm: '20052000',
    cfop: '5102',
    aliquota_icms: 12.0,
    ativo: 1,
    atualizado_em: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    codigo_barras: '7891000100134',
    sku: 'BAK-001',
    descricao: 'CHOCOLATE BIS AO LEITE LACTA 126G',
    preco_venda: 6.49,
    unidade_medida: 'UN',
    ncm: '18063210',
    cfop: '5102',
    aliquota_icms: 18.0,
    ativo: 1,
    atualizado_em: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    codigo_barras: '7891000100141',
    sku: 'DAI-001',
    descricao: 'LEITE INTEGRAL PIRACANJUBA 1L',
    preco_venda: 4.89,
    unidade_medida: 'UN',
    ncm: '04012010',
    cfop: '5102',
    aliquota_icms: 7.0,
    ativo: 1,
    atualizado_em: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    codigo_barras: '7891000100158',
    sku: 'BAK-002',
    descricao: 'BISCOITO RECHEADO OREO ORIGINAL 90G',
    preco_venda: 4.25,
    unidade_medida: 'UN',
    ncm: '19053100',
    cfop: '5102',
    aliquota_icms: 18.0,
    ativo: 1,
    atualizado_em: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    codigo_barras: '7891000100165',
    sku: 'CLH-001',
    descricao: 'CAFE TORRADO E MOIDO PILAO 500G',
    preco_venda: 18.90,
    unidade_medida: 'UN',
    ncm: '09012100',
    cfop: '5102',
    aliquota_icms: 7.0,
    ativo: 1,
    atualizado_em: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    codigo_barras: '123',
    sku: 'TST-001',
    descricao: 'PRODUTO TESTE RAPIDO BALCAO',
    preco_venda: 10.00,
    unidade_medida: 'UN',
    ncm: '99999999',
    cfop: '5102',
    aliquota_icms: 0.0,
    ativo: 1,
    atualizado_em: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    codigo_barras: '0142',
    sku: 'HOR-0142',
    descricao: 'MACA NACIONAL FUJI KG',
    preco_venda: 10.00,
    unidade_medida: 'KG',
    ncm: '08081000',
    cfop: '5102',
    aliquota_icms: 0.0,
    ativo: 1,
    atualizado_em: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    codigo_barras: '0250',
    sku: 'PAD-0250',
    descricao: 'PAO FRANCES TRADICIONAL KG',
    preco_venda: 18.00,
    unidade_medida: 'KG',
    ncm: '19059090',
    cfop: '5102',
    aliquota_icms: 0.0,
    ativo: 1,
    atualizado_em: new Date().toISOString(),
  },
];

catalogoSyncRepo.aplicarLoteProdutos(produtosMock);

console.log(`✅ ${produtosMock.length} produtos populados no catálogo.`);

// Verifica se há caixa aberto; se não houver, abre um padrão para testes
const caixaAberto = operacaoRepo.obterCaixaAberto();
if (!caixaAberto) {
  console.log('🏦 Abrindo Caixa #01 inicial com fundo de troco R$ 100,00...');
  operacaoRepo.abrirCaixa(crypto.randomUUID(), 1, 'OPERADOR_PADRAO', 100.0);
  console.log('✅ Caixa #01 aberto.');
} else {
  console.log(`ℹ️  Caixa #${caixaAberto.numero} já está aberto.`);
}

console.log('🎉 Seed finalizado com sucesso!');

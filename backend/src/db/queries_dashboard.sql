-- ==============================================================================
-- CLICKSTORM ERP - MOTOR ANALÍTICO & QUERIES DO DASHBOARD EXECUTIVO
-- Banco de Dados: SQLite (local_operacao.db + catalogo_sync.db)
-- ==============================================================================

-- 1. FECHAMENTO POR FORMA DE PAGAMENTO (DIA ATUAL)
-- Consolida o total recebido em Dinheiro, Pix, Cartão Crédito, Cartão Débito, etc.
SELECT 
  p.metodo, 
  COALESCE(SUM(p.valor), 0) AS total_recebido,
  COUNT(p.id) AS quantidade_transacoes,
  ROUND(COALESCE(SUM(p.valor), 0) * 100.0 / NULLIF((
    SELECT SUM(valor) FROM pagamentos_venda pv 
    JOIN vendas vx ON vx.id = pv.venda_id 
    WHERE DATE(vx.criado_em) = DATE('now', 'localtime') AND vx.status = 'CONCLUIDA'
  ), 0), 1) AS percentual_participacao
FROM pagamentos_venda p
JOIN vendas v ON v.id = p.venda_id
WHERE DATE(v.criado_em) = DATE('now', 'localtime') 
  AND v.status = 'CONCLUIDA'
GROUP BY p.metodo
ORDER BY total_recebido DESC;


-- 2. TICKET MÉDIO E INDICADORES DO TOPO (FATURAMENTO, QUANTIDADE, DESCONTOS)
SELECT 
  COUNT(DISTINCT v.id) AS total_cupons_emitidos,
  COALESCE(SUM(v.total_liquido), 0) AS faturamento_bruto,
  COALESCE(SUM(v.desconto), 0) AS total_descontos,
  CASE 
    WHEN COUNT(DISTINCT v.id) > 0 THEN ROUND(SUM(v.total_liquido) / COUNT(DISTINCT v.id), 2)
    ELSE 0.00 
  END AS ticket_medio
FROM vendas v
WHERE DATE(v.criado_em) = DATE('now', 'localtime')
  AND v.status = 'CONCLUIDA';


-- 3. ELETROCARDIOGRAMA DE VENDAS (FATURAMENTO DOS ÚLTIMOS 7 DIAS)
-- Projeta a evolução diária para alimentação do AreaChart com curva monotone
SELECT 
  DATE(v.criado_em) AS data_dia,
  strftime('%d/%m', v.criado_em) AS data_label,
  COUNT(DISTINCT v.id) AS cupons,
  COALESCE(SUM(v.total_liquido), 0) AS faturamento
FROM vendas v
WHERE v.criado_em >= DATE('now', '-6 days', 'localtime')
  AND v.status = 'CONCLUIDA'
GROUP BY DATE(v.criado_em)
ORDER BY DATE(v.criado_em) ASC;


-- 4. MAPA DE CALOR DE VENDAS (VENDAS POR HORA - PICO DE MOVIMENTO)
-- Agrupa por faixa horária (08h, 09h, 10h...) para identificar horários de pico
SELECT 
  strftime('%H', v.criado_em) || 'h' AS faixa_horario,
  CAST(strftime('%H', v.criado_em) AS INTEGER) AS hora_num,
  COUNT(DISTINCT v.id) AS quantidade_vendas,
  COALESCE(SUM(v.total_liquido), 0) AS faturamento_faixa
FROM vendas v
WHERE DATE(v.criado_em) = DATE('now', 'localtime')
  AND v.status = 'CONCLUIDA'
GROUP BY strftime('%H', v.criado_em)
ORDER BY hora_num ASC;


-- 5. CURVA ABC (TOP 5 CATEGORIAS / PRODUTOS DE MAIOR VOLUME FINANCEIRO)
-- Aponta onde está concentrado o faturamento para o PieChart Donut
SELECT 
  iv.descricao AS nome,
  COALESCE(SUM(iv.quantidade), 0) AS quantidade_vendida,
  ROUND(COALESCE(SUM(iv.subtotal), 0), 2) AS total_financeiro,
  ROUND(COALESCE(SUM(iv.subtotal), 0) * 100.0 / NULLIF((
    SELECT SUM(subtotal) FROM itens_venda iv2
    JOIN vendas v2 ON v2.id = iv2.venda_id
    WHERE v2.status = 'CONCLUIDA'
  ), 0), 1) AS percentual_curva
FROM itens_venda iv
JOIN vendas v ON v.id = iv.venda_id
WHERE v.status = 'CONCLUIDA'
GROUP BY iv.descricao
ORDER BY total_financeiro DESC
LIMIT 5;


-- 6. AUDITORIA DE CAIXA ANTI-FRAUDE (RANKING POR OPERADOR)
-- Monitora anomalias de cancelamentos de venda e concessão de descontos
SELECT 
  v.operador_id,
  COUNT(CASE WHEN v.status = 'CANCELADA' THEN 1 END) AS total_cancelamentos,
  COALESCE(SUM(CASE WHEN v.status = 'CANCELADA' THEN v.total_liquido ELSE 0 END), 0) AS valor_total_cancelado,
  COALESCE(SUM(CASE WHEN v.status = 'CONCLUIDA' THEN v.desconto ELSE 0 END), 0) AS descontos_concedidos,
  COUNT(CASE WHEN v.status = 'CONCLUIDA' THEN 1 END) AS vendas_concluidas
FROM vendas v
GROUP BY v.operador_id
ORDER BY total_cancelamentos DESC, descontos_concedidos DESC;


-- 7. AUDITORIA DE MOVIMENTAÇÕES CRÍTICAS (SANGRIA, CANCELAMENTOS, ALERTAS)
-- Feed cronológico para tabela de auditoria de segurança da retaguarda
SELECT 
  m.id,
  m.tipo AS tipo_evento,
  COALESCE(m.motivo, 'Movimentação manual de caixa') AS descricao,
  m.valor,
  m.operador_id,
  m.criado_em
FROM caixa_movimentacoes m
WHERE m.tipo IN ('SANGRIA', 'SUPRIMENTO')
UNION ALL
SELECT 
  v.id,
  'CANCELAMENTO' AS tipo_evento,
  'Cancelamento de Venda #' || COALESCE(v.numero_sequencial, 0) AS descricao,
  v.total_liquido AS valor,
  v.operador_id,
  v.criado_em
FROM vendas v
WHERE v.status = 'CANCELADA'
ORDER BY criado_em DESC
LIMIT 15;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import PDFDocument from 'pdfkit';
import type { Request, Response } from 'express';
import { createClientRow, createMaterialRow, createQuoteItemRow, createQuoteMaterialRow, createQuoteRow, getClientRows, getMaterialRows, getQuoteById, getQuoteItems, getQuoteMaterials, getQuoteRows, updateQuoteRow } from './db.js';
import { calculateArea, calculateDiscount, calculateItemSaleValue, calculateMaterialPurchase, calculateRequiredGrossForNet } from '../src/core/business.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors({ origin: process.env.CLIENT_URL ?? '*' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'impacto-orcamento' });
});

app.get('/api/clients', (_req, res) => {
  const clients = getClientRows();
  res.json(clients);
});

app.post('/api/clients', (req: Request, res: Response) => {
  const record = {
    id: randomUUID(),
    name: String(req.body.name ?? '').trim(),
    cpfCnpj: req.body.cpfCnpj ?? '',
    phone: req.body.phone ?? '',
    whatsapp: req.body.whatsapp ?? '',
    email: req.body.email ?? '',
    address: req.body.address ?? '',
    city: req.body.city ?? '',
    state: req.body.state ?? '',
    observations: req.body.observations ?? '',
    createdAt: new Date().toISOString(),
  };

  if (!record.name) {
    return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });
  }

  createClientRow(record);
  res.status(201).json(record);
});

app.get('/api/materials', (_req, res) => {
  const materials = getMaterialRows();
  res.json(materials);
});

app.post('/api/materials', (req: Request, res: Response) => {
  const record = {
    id: randomUUID(),
    code: String(req.body.code ?? '').trim(),
    name: String(req.body.name ?? '').trim(),
    category: String(req.body.category ?? '').trim(),
    supplier: req.body.supplier ?? '',
    brand: req.body.brand ?? '',
    model: req.body.model ?? '',
    color: req.body.color ?? '',
    finish: req.body.finish ?? '',
    thickness: req.body.thickness ?? '',
    dimensions: req.body.dimensions ?? '',
    purchaseUnit: req.body.purchaseUnit ?? 'unidade',
    consumptionUnit: req.body.consumptionUnit ?? 'unidade',
    packageContent: Number(req.body.packageContent ?? 0),
    purchasePrice: Number(req.body.purchasePrice ?? 0),
    active: req.body.active === false ? 0 : 1,
    updatedAt: new Date().toISOString(),
    observations: req.body.observations ?? '',
  };

  if (!record.name || !record.category) {
    return res.status(400).json({ error: 'Nome e categoria do material são obrigatórios.' });
  }

  createMaterialRow(record);
  res.status(201).json(record);
});

app.get('/api/quotes', (_req, res) => {
  const quotes = getQuoteRows();
  res.json(quotes.map((quote) => ({
    ...quote,
    items: getQuoteItems(quote.id),
    materials: getQuoteMaterials(quote.id),
  })));
});

app.get('/api/quotes/:id', (req: Request, res: Response) => {
  const quote = getQuoteById(req.params.id);
  if (!quote) {
    return res.status(404).json({ error: 'Orçamento não encontrado.' });
  }

  res.json({
    ...quote,
    items: getQuoteItems(quote.id),
    materials: getQuoteMaterials(quote.id),
  });
});

app.post('/api/quotes', (req: Request, res: Response) => {
  const quoteId = randomUUID();
  const subtotal = Number(req.body.subtotal ?? 0);
  const discount = Number(req.body.discount ?? 0);
  const total = subtotal - discount;

  const quote = {
    id: quoteId,
    clientId: req.body.clientId,
    projectName: req.body.projectName ?? 'Projeto novo',
    responsible: req.body.responsible ?? 'Operador',
    status: req.body.status ?? 'Em elaboração',
    creationDate: new Date().toISOString(),
    validUntil: req.body.validUntil ?? '',
    estimatedDeadline: req.body.estimatedDeadline ?? '',
    commercialTerms: req.body.commercialTerms ?? '',
    observations: req.body.observations ?? '',
    subtotal,
    discount,
    total,
    approvedAt: null,
    approvedVersion: null,
    paymentMethod: req.body.paymentMethod ?? 'Pix',
    metadata: JSON.stringify({ pricingMethod: req.body.pricingMethod ?? 'Metro quadrado' }),
  };

  createQuoteRow(quote);

  const items = Array.isArray(req.body.items) ? req.body.items : [];
  for (const item of items) {
    const result = calculateItemSaleValue({
      width: Number(item.width ?? 0),
      height: Number(item.height ?? 0),
      quantity: Number(item.quantity ?? 1),
      pricePerSqm: Number(item.pricePerSqm ?? 0),
      unit: item.unit ?? 'm',
    });

    createQuoteItemRow({
      id: randomUUID(),
      quoteId,
      name: item.name ?? 'Item',
      environment: item.environment ?? 'Geral',
      width: Number(item.width ?? 0),
      height: Number(item.height ?? 0),
      depth: Number(item.depth ?? 0),
      quantity: Number(item.quantity ?? 1),
      pricePerSqm: Number(item.pricePerSqm ?? 0),
      method: item.method ?? 'Metro quadrado',
      unit: item.unit ?? 'm',
      area: result.area,
      unitValue: result.unitValue,
      total: result.total,
      observations: item.observations ?? '',
    });
  }

  const materials = Array.isArray(req.body.materials) ? req.body.materials : [];
  for (const material of materials) {
    createQuoteMaterialRow({
      id: randomUUID(),
      quoteId,
      materialId: material.materialId ?? '',
      name: material.name ?? 'Material',
      specification: material.specification ?? '',
      color: material.color ?? '',
      thickness: material.thickness ?? '',
      quantityNeeded: Number(material.quantityNeeded ?? 0),
      consumptionUnit: material.consumptionUnit ?? 'unidade',
      purchaseQuantity: Number(material.purchaseQuantity ?? 0),
      purchaseUnit: material.purchaseUnit ?? 'unidade',
      purchasePrice: Number(material.purchasePrice ?? 0),
      estimatedCost: Number(material.estimatedCost ?? 0),
      supplier: material.supplier ?? '',
      observations: material.observations ?? '',
    });
  }

  res.status(201).json({ ...quote, items: getQuoteItems(quoteId), materials: getQuoteMaterials(quoteId) });
});

app.patch('/api/quotes/:id', (req: Request, res: Response) => {
  const quote = getQuoteById(req.params.id);
  if (!quote) {
    return res.status(404).json({ error: 'Orçamento não encontrado.' });
  }

  const subtotal = Number(req.body.subtotal ?? quote.subtotal ?? 0);
  const discount = Number(req.body.discount ?? quote.discount ?? 0);
  const total = subtotal - discount;

  const updated = {
    id: quote.id,
    subtotal,
    discount,
    total,
    status: req.body.status ?? quote.status,
    paymentMethod: req.body.paymentMethod ?? quote.paymentMethod,
    metadata: JSON.stringify({ pricingMethod: req.body.pricingMethod ?? 'Metro quadrado' }),
    approvedAt: req.body.approvedAt ?? quote.approvedAt,
    approvedVersion: req.body.approvedVersion ?? quote.approvedVersion,
  };

  updateQuoteRow(updated);
  res.json({ ...quote, ...updated });
});

app.post('/api/quotes/:id/approve', (req: Request, res: Response) => {
  const quote = getQuoteById(req.params.id);
  if (!quote) {
    return res.status(404).json({ error: 'Orçamento não encontrado.' });
  }

  const approvedAt = new Date().toISOString();
  updateQuoteRow({
    ...quote,
    status: 'Aprovado',
    approvedAt,
    approvedVersion: 'v1',
  });

  res.json({ ok: true, status: 'Aprovado', approvedAt });
});

app.get('/api/quotes/:id/pdf', (req, res) => {
  const quote = getQuoteById(req.params.id);
  if (!quote) {
    return res.status(404).json({ error: 'Orçamento não encontrado.' });
  }

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const filename = `orcamento-${quote.projectName || 'projeto'}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);
  doc.fontSize(20).text('IMPACTO ORÇAMENTO', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Projeto: ${quote.projectName}`);
  doc.text(`Número: ${quote.id.slice(0, 8)}`);
  doc.text(`Status: ${quote.status}`);
  doc.text(`Total: R$ ${Number(quote.total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  doc.moveDown();
  doc.text('--- Itens do orçamento ---');

  const items = getQuoteItems(quote.id);
  for (const item of items) {
    doc.text(`${item.name} - ${item.environment} - total R$ ${Number(item.total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  }

  doc.end();
});

app.post('/api/simulate-payment', (req: Request, res: Response) => {
  const input = req.body ?? {};
  const amount = Number(input.amount ?? 0);
  const feePercent = Number(input.feePercent ?? 0);
  const fixedFee = Number(input.fixedFee ?? 0);
  const net = Number(input.net ?? 0);

  const gross = calculateRequiredGrossForNet({ amount, feePercent, fixedFee, desiredNet: net || undefined });
  const feeValue = gross - amount;
  const liquid = amount * (1 - feePercent / 100) - fixedFee;

  res.json({
    gross,
    feeValue,
    liquid: Number(liquid.toFixed(2)),
    net: net || 0,
  });
});

app.post('/api/calculate-discount', (req: Request, res: Response) => {
  const total = Number(req.body.total ?? 0);
  const value = Number(req.body.value ?? 0);
  const type = req.body.type === 'fixed' ? 'fixed' : 'percent';
  const discount = calculateDiscount({ total, value, type });

  res.json({ discount, finalTotal: total - discount });
});

app.get('/api/summary', (_req, res) => {
  const quotes = getQuoteRows();
  const total = quotes.reduce((sum, item) => sum + Number(item.total ?? 0), 0);
  const approved = quotes.filter((item) => item.status === 'Aprovado').length;
  const drafting = quotes.filter((item) => item.status === 'Em elaboração' || item.status === 'Rascunho').length;
  const waiting = quotes.filter((item) => item.status === 'Aguardando aprovação').length;

  res.json({ total, approved, drafting, waiting, count: quotes.length });
});

const server = app.listen(PORT, () => {
  console.log(`Servidor Impacto Orçamento rodando na porta ${PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

export default app;

import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export const dataDir = path.resolve(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'impacto.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpfCnpj TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    observations TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    supplier TEXT,
    brand TEXT,
    model TEXT,
    color TEXT,
    finish TEXT,
    thickness TEXT,
    dimensions TEXT,
    purchaseUnit TEXT NOT NULL,
    consumptionUnit TEXT NOT NULL,
    packageContent REAL,
    purchasePrice REAL NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    updatedAt TEXT NOT NULL,
    observations TEXT
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    clientId TEXT NOT NULL,
    projectName TEXT NOT NULL,
    responsible TEXT,
    status TEXT NOT NULL,
    creationDate TEXT NOT NULL,
    validUntil TEXT,
    estimatedDeadline TEXT,
    commercialTerms TEXT,
    observations TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    approvedAt TEXT,
    approvedVersion TEXT,
    paymentMethod TEXT,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS quote_items (
    id TEXT PRIMARY KEY,
    quoteId TEXT NOT NULL,
    name TEXT NOT NULL,
    environment TEXT,
    width REAL,
    height REAL,
    depth REAL,
    quantity REAL,
    pricePerSqm REAL,
    method TEXT,
    unit TEXT,
    area REAL,
    unitValue REAL,
    total REAL,
    observations TEXT
  );

  CREATE TABLE IF NOT EXISTS quote_materials (
    id TEXT PRIMARY KEY,
    quoteId TEXT NOT NULL,
    materialId TEXT,
    name TEXT NOT NULL,
    specification TEXT,
    color TEXT,
    thickness TEXT,
    quantityNeeded REAL,
    consumptionUnit TEXT,
    purchaseQuantity REAL,
    purchaseUnit TEXT,
    purchasePrice REAL,
    estimatedCost REAL,
    supplier TEXT,
    observations TEXT
  );
`);

export const getClientRows = () => db.prepare('SELECT * FROM clients ORDER BY createdAt DESC').all();
export const createClientRow = (client: Record<string, string>) => db.prepare('INSERT INTO clients (id, name, cpfCnpj, phone, whatsapp, email, address, city, state, observations, createdAt) VALUES (@id, @name, @cpfCnpj, @phone, @whatsapp, @email, @address, @city, @state, @observations, @createdAt)').run(client);

export const getMaterialRows = () => db.prepare('SELECT * FROM materials ORDER BY name ASC').all();
export const createMaterialRow = (material: Record<string, any>) => db.prepare('INSERT INTO materials (id, code, name, category, supplier, brand, model, color, finish, thickness, dimensions, purchaseUnit, consumptionUnit, packageContent, purchasePrice, active, updatedAt, observations) VALUES (@id, @code, @name, @category, @supplier, @brand, @model, @color, @finish, @thickness, @dimensions, @purchaseUnit, @consumptionUnit, @packageContent, @purchasePrice, @active, @updatedAt, @observations)').run(material);

export const getQuoteRows = () => db.prepare('SELECT * FROM quotes ORDER BY creationDate DESC').all();
export const getQuoteById = (id: string) => db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
export const createQuoteRow = (quote: Record<string, any>) => db.prepare('INSERT INTO quotes (id, clientId, projectName, responsible, status, creationDate, validUntil, estimatedDeadline, commercialTerms, observations, subtotal, discount, total, approvedAt, approvedVersion, paymentMethod, metadata) VALUES (@id, @clientId, @projectName, @responsible, @status, @creationDate, @validUntil, @estimatedDeadline, @commercialTerms, @observations, @subtotal, @discount, @total, @approvedAt, @approvedVersion, @paymentMethod, @metadata)').run(quote);
export const createQuoteItemRow = (item: Record<string, any>) => db.prepare('INSERT INTO quote_items (id, quoteId, name, environment, width, height, depth, quantity, pricePerSqm, method, unit, area, unitValue, total, observations) VALUES (@id, @quoteId, @name, @environment, @width, @height, @depth, @quantity, @pricePerSqm, @method, @unit, @area, @unitValue, @total, @observations)').run(item);
export const getQuoteItems = (quoteId: string) => db.prepare('SELECT * FROM quote_items WHERE quoteId = ?').all(quoteId);
export const createQuoteMaterialRow = (item: Record<string, any>) => db.prepare('INSERT INTO quote_materials (id, quoteId, materialId, name, specification, color, thickness, quantityNeeded, consumptionUnit, purchaseQuantity, purchaseUnit, purchasePrice, estimatedCost, supplier, observations) VALUES (@id, @quoteId, @materialId, @name, @specification, @color, @thickness, @quantityNeeded, @consumptionUnit, @purchaseQuantity, @purchaseUnit, @purchasePrice, @estimatedCost, @supplier, @observations)').run(item);
export const getQuoteMaterials = (quoteId: string) => db.prepare('SELECT * FROM quote_materials WHERE quoteId = ?').all(quoteId);
export const updateQuoteRow = (quote: Record<string, any>) => db.prepare('UPDATE quotes SET subtotal = @subtotal, discount = @discount, total = @total, status = @status, approvedAt = @approvedAt, approvedVersion = @approvedVersion, paymentMethod = @paymentMethod, metadata = @metadata WHERE id = @id').run(quote);

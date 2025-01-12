import { Database, open } from 'sqlite'
import sqlite3 from 'sqlite3'

let db: Database | null = null;

async function openDb(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: './restaurant.sqlite',
      driver: sqlite3.Database
    });
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        stock INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        quantity INTEGER,
        total_price REAL,
        date TEXT,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `);
  }
  return db;
}

export async function getProducts() {
  const db = await openDb();
  return db.all('SELECT * FROM products');
}

export async function addProduct(name: string, price: number, stock: number) {
  const db = await openDb();
  return db.run('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', [name, price, stock]);
}

export async function updateProduct(id: number, name: string, price: number, stock: number) {
  const db = await openDb();
  return db.run('UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?', [name, price, stock, id]);
}

export async function deleteProduct(id: number) {
  const db = await openDb();
  return db.run('DELETE FROM products WHERE id = ?', [id]);
}

export async function getSales() {
  const db = await openDb();
  return db.all(`
    SELECT sales.*, products.name as product_name 
    FROM sales 
    JOIN products ON sales.product_id = products.id
  `);
}

export async function addSale(productId: number, quantity: number, totalPrice: number, date: string) {
  const db = await openDb();
  return db.run('INSERT INTO sales (product_id, quantity, total_price, date) VALUES (?, ?, ?, ?)', [productId, quantity, totalPrice, date]);
}

export async function getStatistics(fechaInicio: string, fechaFin: string) {
  const db = await openDb();
  const totalSales = await db.get('SELECT COALESCE(SUM(total_price), 0) as total FROM sales WHERE date BETWEEN ? AND ?', [fechaInicio, fechaFin]);
  const topProducts = await db.all(`
    SELECT products.name, SUM(sales.quantity) as total_quantity
    FROM sales
    JOIN products ON sales.product_id = products.id
    WHERE sales.date BETWEEN ? AND ?
    GROUP BY products.id
    ORDER BY total_quantity DESC
    LIMIT 5
  `, [fechaInicio, fechaFin]);
  return { totalSales: { total: totalSales?.total || 0 }, topProducts };
}

export async function getLowStockProducts(threshold: number = 10) {
  const db = await openDb();
  return db.all('SELECT * FROM products WHERE stock < ?', [threshold]);
}


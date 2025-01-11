import { Database } from 'sqlite3'
import { open } from 'sqlite'

let db: any = null;

async function openDb() {
  if (!db) {
    db = await open({
      filename: './restaurant.sqlite',
      driver: Database
    });
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        stock INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS raw_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        stock INTEGER,
        unit TEXT
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

export async function getRawMaterials() {
  const db = await openDb();
  return db.all('SELECT * FROM raw_materials');
}

export async function addRawMaterial(name: string, stock: number, unit: string) {
  const db = await openDb();
  return db.run('INSERT INTO raw_materials (name, stock, unit) VALUES (?, ?, ?)', [name, stock, unit]);
}

export async function updateRawMaterial(id: number, name: string, stock: number, unit: string) {
  const db = await openDb();
  return db.run('UPDATE raw_materials SET name = ?, stock = ?, unit = ? WHERE id = ?', [name, stock, unit, id]);
}

export async function deleteRawMaterial(id: number) {
  const db = await openDb();
  return db.run('DELETE FROM raw_materials WHERE id = ?', [id]);
}

export async function addSale(productId: number, quantity: number, totalPrice: number, date: string) {
  const db = await openDb();
  return db.run('INSERT INTO sales (product_id, quantity, total_price, date) VALUES (?, ?, ?, ?)', [productId, quantity, totalPrice, date]);
}

export async function getSales() {
  const db = await openDb();
  return db.all(`
    SELECT sales.*, products.name as product_name 
    FROM sales 
    JOIN products ON sales.product_id = products.id
  `);
}

export async function getStatistics() {
  const db = await openDb();
  const totalSales = await db.get('SELECT SUM(total_price) as total FROM sales');
  const topProducts = await db.all(`
    SELECT products.name, SUM(sales.quantity) as total_quantity
    FROM sales
    JOIN products ON sales.product_id = products.id
    GROUP BY products.id
    ORDER BY total_quantity DESC
    LIMIT 5
  `);
  return { totalSales, topProducts };
}


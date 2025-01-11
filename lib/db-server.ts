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

export async function getProducts() {
  const db = await openDb();
  return db.all('SELECT * FROM products');
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
  return { totalSales: { total: totalSales.total || 0 }, topProducts };
}


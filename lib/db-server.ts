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
      CREATE TABLE IF NOT EXISTS raw_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        stock INTEGER,
        unit TEXT,
        min_stock INTEGER
      );

      CREATE TABLE IF NOT EXISTS dishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        category TEXT
      );

      CREATE TABLE IF NOT EXISTS dish_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id INTEGER,
        raw_material_id INTEGER,
        quantity REAL,
        FOREIGN KEY (dish_id) REFERENCES dishes (id),
        FOREIGN KEY (raw_material_id) REFERENCES raw_materials (id)
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id INTEGER,
        quantity INTEGER,
        total_price REAL,
        date TEXT,
        FOREIGN KEY (dish_id) REFERENCES dishes (id)
      );
    `);
  }
  return db;
}

// Raw Materials
export async function getRawMaterials() {
  const db = await openDb();
  return db.all('SELECT * FROM raw_materials');
}

export async function addRawMaterial(name: string, price: number, stock: number, unit: string, minStock: number) {
  const db = await openDb();
  return db.run('INSERT INTO raw_materials (name, price, stock, unit, min_stock) VALUES (?, ?, ?, ?, ?)', [name, price, stock, unit, minStock]);
}

export async function updateRawMaterial(id: number, name: string, price: number, stock: number, unit: string, minStock: number) {
  const db = await openDb();
  return db.run('UPDATE raw_materials SET name = ?, price = ?, stock = ?, unit = ?, min_stock = ? WHERE id = ?', [name, price, stock, unit, minStock, id]);
}

export async function deleteRawMaterial(id: number) {
  const db = await openDb();
  return db.run('DELETE FROM raw_materials WHERE id = ?', [id]);
}

export async function getLowStockRawMaterials() {
  const db = await openDb();
  return db.all('SELECT * FROM raw_materials WHERE stock < min_stock');
}

// Dishes
export async function getDishes() {
  const db = await openDb();
  return db.all('SELECT * FROM dishes');
}

export async function addDish(name: string, price: number, category: string) {
  const db = await openDb();
  return db.run('INSERT INTO dishes (name, price, category) VALUES (?, ?, ?)', [name, price, category]);
}

export async function updateDish(id: number, name: string, price: number, category: string) {
  const db = await openDb();
  return db.run('UPDATE dishes SET name = ?, price = ?, category = ? WHERE id = ?', [name, price, category, id]);
}

export async function deleteDish(id: number) {
  const db = await openDb();
  await db.run('DELETE FROM dish_ingredients WHERE dish_id = ?', [id]);
  return db.run('DELETE FROM dishes WHERE id = ?', [id]);
}

export async function getDishIngredients(dishId: number) {
  const db = await openDb();
  return db.all(`
    SELECT di.*, rm.name as raw_material_name, rm.unit
    FROM dish_ingredients di
    JOIN raw_materials rm ON di.raw_material_id = rm.id
    WHERE di.dish_id = ?
  `, [dishId]);
}

export async function addDishIngredient(dishId: number, rawMaterialId: number, quantity: number) {
  const db = await openDb();
  return db.run('INSERT INTO dish_ingredients (dish_id, raw_material_id, quantity) VALUES (?, ?, ?)', [dishId, rawMaterialId, quantity]);
}

export async function updateDishIngredient(id: number, quantity: number) {
  const db = await openDb();
  return db.run('UPDATE dish_ingredients SET quantity = ? WHERE id = ?', [quantity, id]);
}

export async function deleteDishIngredient(id: number) {
  const db = await openDb();
  return db.run('DELETE FROM dish_ingredients WHERE id = ?', [id]);
}

// Sales
export async function addSale(dishId: number, quantity: number, totalPrice: number, date: string) {
  const db = await openDb();
  return db.run('INSERT INTO sales (dish_id, quantity, total_price, date) VALUES (?, ?, ?, ?)', [dishId, quantity, totalPrice, date]);
}

export async function getSales() {
  const db = await openDb();
  return db.all(`
    SELECT s.*, d.name as dish_name 
    FROM sales s
    JOIN dishes d ON s.dish_id = d.id
  `);
}

export async function getStatistics(startDate: string, endDate: string) {
  const db = await openDb();
  const totalSales = await db.get('SELECT COALESCE(SUM(total_price), 0) as total FROM sales WHERE date BETWEEN ? AND ?', [startDate, endDate]);
  const topDishes = await db.all(`
    SELECT d.name, SUM(s.quantity) as total_quantity
    FROM sales s
    JOIN dishes d ON s.dish_id = d.id
    WHERE s.date BETWEEN ? AND ?
    GROUP BY d.id
    ORDER BY total_quantity DESC
    LIMIT 5
  `, [startDate, endDate]);
  
  const rawMaterialsUsed = await db.all(`
    SELECT rm.name, rm.unit, SUM(di.quantity * s.quantity) as total_used
    FROM sales s
    JOIN dish_ingredients di ON s.dish_id = di.dish_id
    JOIN raw_materials rm ON di.raw_material_id = rm.id
    WHERE s.date BETWEEN ? AND ?
    GROUP BY rm.id
    ORDER BY total_used DESC
  `, [startDate, endDate]);

  return { totalSales: { total: totalSales?.total || 0 }, topDishes, rawMaterialsUsed };
}

export async function getProducts() {
  const db = await openDb();
  return db.all('SELECT * FROM products') || [];
}


import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'

let db: Database | null = null;

async function openDb() {
  if (!db) {
    db = await open({
      filename: './restaurant.sqlite',
      driver: sqlite3.Database
    });
    await db.exec(`
      CREATE TABLE IF NOT EXISTS raw_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        quantity REAL,
        unit TEXT
      );
      
      CREATE TABLE IF NOT EXISTS dishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        price REAL
      );
      
      CREATE TABLE IF NOT EXISTS dish_ingredients (
        dish_id INTEGER,
        raw_material_id INTEGER,
        quantity REAL,
        unit TEXT,
        FOREIGN KEY (dish_id) REFERENCES dishes (id),
        FOREIGN KEY (raw_material_id) REFERENCES raw_materials (id),
        PRIMARY KEY (dish_id, raw_material_id)
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

// Raw Materials (Inventory) Functions
export async function getRawMaterials() {
  const db = await openDb();
  return db.all('SELECT * FROM raw_materials');
}

export async function addRawMaterial(name: string, quantity: number, unit: string) {
  const db = await openDb();
  try {
    await db.run('INSERT INTO raw_materials (name, quantity, unit) VALUES (?, ?, ?)', [name, quantity, unit]);
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Error adding raw material to database');
  }
}

export async function updateRawMaterial(id: number, name: string, quantity: number, unit: string) {
  const db = await openDb();
  return db.run('UPDATE raw_materials SET name = ?, quantity = ?, unit = ? WHERE id = ?', [name, quantity, unit, id]);
}

export async function deleteRawMaterial(id: number) {
  const db = await openDb();
  return db.run('DELETE FROM raw_materials WHERE id = ?', [id]);
}

// Dishes Functions
export async function getDishes() {
  const db = await openDb();
  const dishes = await db.all('SELECT * FROM dishes');
  for (const dish of dishes) {
    dish.ingredients = await db.all(`
      SELECT raw_materials.name, dish_ingredients.quantity, dish_ingredients.unit
      FROM dish_ingredients
      JOIN raw_materials ON dish_ingredients.raw_material_id = raw_materials.id
      WHERE dish_ingredients.dish_id = ?
    `, [dish.id]);
  }
  return dishes;
}

export async function addDish(name: string, price: number, ingredients: {id: number, quantity: number, unit: string}[]) {
  const db = await openDb();
  await db.run('BEGIN TRANSACTION');
  try {
    const result = await db.run('INSERT INTO dishes (name, price) VALUES (?, ?)', [name, price]);
    const dishId = result.lastID;
    for (const ingredient of ingredients) {
      await db.run('INSERT INTO dish_ingredients (dish_id, raw_material_id, quantity, unit) VALUES (?, ?, ?, ?)', 
        [dishId, ingredient.id, ingredient.quantity, ingredient.unit]);
    }
    await db.run('COMMIT');
    return dishId;
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

export async function updateDish(id: number, name: string, price: number, ingredients: {id: number, quantity: number, unit: string}[]) {
  const db = await openDb();
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('UPDATE dishes SET name = ?, price = ? WHERE id = ?', [name, price, id]);
    await db.run('DELETE FROM dish_ingredients WHERE dish_id = ?', [id]);
    for (const ingredient of ingredients) {
      await db.run('INSERT INTO dish_ingredients (dish_id, raw_material_id, quantity, unit) VALUES (?, ?, ?, ?)', 
        [id, ingredient.id, ingredient.quantity, ingredient.unit]);
    }
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

export async function deleteDish(id: number) {
  const db = await openDb();
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM dish_ingredients WHERE dish_id = ?', [id]);
    await db.run('DELETE FROM dishes WHERE id = ?', [id]);
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

// Sales Functions
export async function addSale(dishId: number, quantity: number, totalPrice: number, date: string) {
  const db = await openDb();
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('INSERT INTO sales (dish_id, quantity, total_price, date) VALUES (?, ?, ?, ?)', [dishId, quantity, totalPrice, date]);
    const ingredients = await db.all('SELECT raw_material_id, quantity, unit FROM dish_ingredients WHERE dish_id = ?', [dishId]);
    for (const ingredient of ingredients) {
      await db.run('UPDATE raw_materials SET quantity = quantity - ? WHERE id = ?', 
        [ingredient.quantity * quantity, ingredient.raw_material_id]);
    }
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

export async function getSales() {
  const db = await openDb();
  return db.all(`
    SELECT sales.*, dishes.name as dish_name 
    FROM sales 
    JOIN dishes ON sales.dish_id = dishes.id
  `);
}

export async function getStatistics(fechaInicio: string, fechaFin: string) {
  const db = await openDb();
  const totalSales = await db.get('SELECT COALESCE(SUM(total_price), 0) as total FROM sales WHERE date BETWEEN ? AND ?', [fechaInicio, fechaFin]);
  const topDishes = await db.all(`
    SELECT dishes.name, SUM(sales.quantity) as total_quantity
    FROM sales
    JOIN dishes ON sales.dish_id = dishes.id
    WHERE sales.date BETWEEN ? AND ?
    GROUP BY dishes.id
    ORDER BY total_quantity DESC
    LIMIT 5
  `, [fechaInicio, fechaFin]);
  return { totalSales: { total: totalSales.total || 0 }, topDishes };
}


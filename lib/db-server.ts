import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import moment from 'moment-timezone';

let db: Database | null = null;

function utcToZonedTime(date: Date, timeZone: string): Date {
  return moment.tz(date, timeZone).toDate();
}

function zonedTimeToUtc(date: Date, timeZone: string): Date {
  return moment.tz(date, timeZone).utc().toDate();
}

// Ejemplo de uso:
const now = new Date();
const timeZone = 'America/Argentina/Buenos_Aires'; // Ajusta esto a tu zona horaria

const zonedDate = utcToZonedTime(now, timeZone);
console.log('Fecha en zona horaria local:', zonedDate);

const utcDate = zonedTimeToUtc(zonedDate, timeZone);
console.log('Fecha en UTC:', utcDate);

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
export async function getStatistics(fechaInicio: string, fechaFin: string) {
  const db = await openDb();
  
  // Get total sales
  const totalSales = await db.get(
    'SELECT COALESCE(SUM(total_price), 0) as total FROM sales WHERE date BETWEEN ? AND ?', 
    [fechaInicio, fechaFin]
  );

  // Get top dishes
  const topDishes = await db.all(`
    SELECT dishes.name, SUM(sales.quantity) as total_quantity
    FROM sales
    JOIN dishes ON sales.dish_id = dishes.id
    WHERE sales.date BETWEEN ? AND ?
    GROUP BY dishes.id
    ORDER BY total_quantity DESC
    LIMIT 5
  `, [fechaInicio, fechaFin]);

  // Get raw materials usage
  const rawMaterialsUsed = await db.all(`
    WITH sales_ingredients AS (
      SELECT 
        raw_material_id,
        di.quantity as ingredient_quantity,
        di.unit,
        s.quantity as sales_quantity
      FROM sales s
      JOIN dish_ingredients di ON s.dish_id = di.dish_id
      WHERE s.date BETWEEN ? AND ?
    )
    SELECT 
      rm.name,
      rm.unit,
      ROUND(SUM(si.ingredient_quantity * si.sales_quantity), 2) as total_used
    FROM sales_ingredients si
    JOIN raw_materials rm ON si.raw_material_id = rm.id
    GROUP BY rm.id
    ORDER BY total_used DESC
  `, [fechaInicio, fechaFin]);

  return { 
    totalSales: { total: totalSales.total || 0 }, 
    topDishes,
    rawMaterialsUsed
  };
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

export async function getLowStockProducts(threshold: number = 10) {
  const db = await openDb();
  return db.all('SELECT * FROM raw_materials WHERE quantity < ?', [threshold]);
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
export async function getSales(date: string) {
  const db = await openDb();
  const startOfDay = zonedTimeToUtc(new Date(`${date}T00:00:00`), 'America/Argentina/Buenos_Aires').toISOString();
  const endOfDay = zonedTimeToUtc(new Date(`${date}T23:59:59`), 'America/Argentina/Buenos_Aires').toISOString();

  const sales = await db.all(`
    SELECT sales.*, dishes.name as dish_name 
    FROM sales 
    JOIN dishes ON sales.dish_id = dishes.id
    WHERE sales.date BETWEEN ? AND ?
    ORDER BY sales.date DESC, sales.id DESC
  `, [startOfDay, endOfDay]);

  return sales.map(sale => ({
    ...sale,
    date: utcToZonedTime(sale.date, 'America/Argentina/Buenos_Aires').toISOString(),
  }));
}

export async function addSale(dishId: number, quantity: number, totalPrice: number, date: string) {
  const db = await openDb();
  const dateUtc = zonedTimeToUtc(new Date(date), 'America/Argentina/Buenos_Aires').toISOString();

  await db.run('INSERT INTO sales (dish_id, quantity, total_price, date) VALUES (?, ?, ?, ?)', [
    dishId,
    quantity,
    totalPrice,
    dateUtc,
  ]);
}

export async function deleteSale(id: number) {
  const db = await openDb();
  await db.run('BEGIN TRANSACTION');
  try {
    // Primero, obtenemos la información de la venta
    const sale = await db.get('SELECT dish_id, quantity FROM sales WHERE id = ?', [id]);
    
    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    // Obtenemos los ingredientes del plato
    const ingredients = await db.all(
      'SELECT raw_material_id, quantity FROM dish_ingredients WHERE dish_id = ?', 
      [sale.dish_id]
    );

    // Devolvemos los ingredientes al inventario
    for (const ingredient of ingredients) {
      await db.run(
        'UPDATE raw_materials SET quantity = quantity + ? WHERE id = ?', 
        [ingredient.quantity * sale.quantity, ingredient.raw_material_id]
      );
    }

    // Eliminamos la venta
    await db.run('DELETE FROM sales WHERE id = ?', [id]);
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

/*export async function getStatistics(fechaInicio: string, fechaFin: string) {
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
}*/

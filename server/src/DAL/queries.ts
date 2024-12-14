export const createTable = `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT,
category_name TEXT, date TEXT,
product_views INTEGER, revenue INTEGER, units_sold INTEGER, brand TEXT)`;

export const insertData = `INSERT INTO products (category_name, date, product_views, revenue, units_sold, brand) VALUES (?, ?, ?, ?, ?, ?)`;
export const getCategories = "SELECT category_name from products";

import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { Database } from "sqlite3";
import { createTable, getCategories, insertData } from "./queries";

const FILE_PATH = path.join(__dirname, "data.csv");
const db = new Database("db.sqlite");
db.run(createTable);

fs.createReadStream(FILE_PATH)
  .pipe(csv())
  .on("data", (row) => {
    console.log(row, "row");

    db.run(insertData, [
      row.category,
      row.date,
      row.product_views,
      row.revenue,
      row.units_sold,
      row.brand,
    ]).on("end", () => "CSV file successfully upload");
  });

export const getAllCategories = async () => {
  try {
    return new Promise((resolve, reject) => {
      db.all(getCategories, [], (err, rows) => {
        if (err) { reject(err); }
        resolve(rows.map((row) => row));
      });
    });
  } catch (err) {
    console.log(err);
    return null;
  }
};

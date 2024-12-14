import csv from "csv-parser";
import fs from "fs";
import { User } from "../models/url";

export const extractNameFromLinkedIn = (link: string): string => {
  const match = link.match(/https:\/\/linkedin\.com\/in\/([a-zA-Z-]+)/);
  if (match && match[1]) {
    return match[1]
      .replace(/-/g, " ") // Replace dashes with spaces
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Split camel case
      .trim();
  }
  return "";
};
export const parseCsv = (filePath: string): Promise<User[]> => {
  const users: User[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const userName = extractNameFromLinkedIn(row.Linkedin || "");
        users.push({
          name: userName,
          email: row.Email || "",
          phone: parseInt(row["Phone Number"]) || 0,
          linkedin: row.Linkedin || "",
        });
      })
      .on("end", () => {
        resolve(users);
      })
      .on("error", (err: Error) => {
        reject(err.message);
      });
  });
};
export const getGapBetween2Dates = (date1: string, date2: string) => {
  console.log(date1, "date1", date2, "date2");

  const startDate = new Date(date1).getTime();
  const endDate = new Date(date2).getTime();

  if (isNaN(startDate) || isNaN(endDate)) {
    throw new Error("Invalid date format. Please provide valid date strings");
  }

  const diff = Math.abs(startDate - endDate);
  const timeDiffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return timeDiffDays;
};

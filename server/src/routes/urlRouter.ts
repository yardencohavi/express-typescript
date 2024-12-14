import { Router, Request, Response } from "express";
import axios from "axios";
import path from "path";
import { getGapBetween2Dates, parseCsv } from "../utils/helpers";
import { Writable } from "stream";
import fs from "fs/promises";
const router = Router();
const FILE_PATH = path.join(__dirname, "../../data.csv");
const WORD_COUNT_FILE = path.resolve(__dirname, "word_counts.json");

export let wordsMap: Record<string, number> = {}; // Accumulated word counts

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const url = req.body.url;
  if (!url) {
    res.status(400).json({ error: "URL is required as a query parameter." });
    return;
  }
  try {
    const [response, users] = await Promise.all([
      axios.get(url),
      parseCsv(FILE_PATH),
    ]);
    console.log(users, "users");

    const updateUsers = users.map((user) => {
      const findUser = response.data.find(
        (jsonUser: any) =>
          (jsonUser.contact_info.name.formatted_name.toLowerCase() ||
            jsonUser.contact_info.email.toLowerCase()) ===
          user.name.toLowerCase()
      );

      if (findUser) {
        user.experiences = findUser.experience.map((exp: any) => ({
          endDate: exp.end_date,
          startDate: exp.start_date,
          title: exp.title,
        }));

        console.log(user.name, "-", user.linkedin);
        if (user.experiences) {
          for (let i = 0; i < user.experiences.length; i++) {
            const exp = user.experiences[i];
            console.log(
              `Worked as: ${exp.title}, From ${exp.startDate} To ${exp.endDate}`
            );
            if (
              i !== user.experiences.length - 1 &&
              exp.startDate !== user.experiences[i + 1].endDate
            ) {
              const gap = getGapBetween2Dates(
                exp.startDate,
                user.experiences[i + 1].endDate
              );
              console.log(gap, "days");
            }
          }
        }
      }
      return user;
    });

    res.json(updateUsers);
  } catch (error: any) {
    console.error("Error fetching JSON:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch JSON data. Please check the URL." });
  }
});

// Helper function to process a chunk of text
function processChunk(
  chunk: string,
  localCounts: Record<string, number>
): void {
  const words = chunk
    .toLowerCase()
    .replace(/[-,]/g, " ") // Replace mid-word dashes and commas with spaces
    .replace(/[^a-z\s]/g, "") // Remove non-alphabetic characters
    .split(/\s+/); // Split by whitespace

  for (const word of words) {
    if (word.trim() !== "") {
      localCounts[word] = (localCounts[word] || 0) + 1;
    }
  }
}

// Ensure the directory and file exist
export async function ensureFileExists() {

  try {
    const dir = path.dirname(WORD_COUNT_FILE);
    await fs.mkdir(dir, { recursive: true }); // Ensure directory exists

    try {
      await fs.access(WORD_COUNT_FILE);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        await fs.writeFile(WORD_COUNT_FILE, JSON.stringify({}, null, 2));
        console.log("File created:", WORD_COUNT_FILE);
      } else {
        throw error;
      }
    }
  } catch (error) {
    throw error;
  }
}
// Load data from the file into memory
export async function loadWordCounts() {
  try {
    const data = await fs.readFile(WORD_COUNT_FILE, "utf-8");
    wordsMap = JSON.parse(data);
    console.log("Word counts loaded successfully.");
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log("File not found, initializing empty data.");
      wordsMap = {};
    } else {
      console.error("Error loading word counts:", error.message);
      throw error;
    }
  }
}
async function saveWordCounts() {

  try {
    await fs.writeFile(WORD_COUNT_FILE, JSON.stringify(wordsMap, null, 2));
    console.log("Word counts saved successfully.");
  } catch (error: any) {
    console.error("Error saving word counts:", error.message);
  }
}

// POST /words
router.post("/words", async (req: Request, res: Response): Promise<void> => {
  // const data = await fs.readFile("", "utf-8");

  const { url }: { url: string } = req.body;

  if (!url) {
    res.status(400).json({ error: "URL is required." });
    return;
  }

  try {
    const response = await axios.get(url, { responseType: "stream" });

    if (!response.data || typeof response.data.pipe !== "function") {
      res.status(500).json({ error: "Response is not a valid stream." });
      return;
    }

    const localCounts: Record<string, number> = {};

    const writable = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        processChunk(chunk.toString(), localCounts);
        callback();
      },
    });

    response.data.pipe(writable);

    writable.on("finish", async () => {
      for (const word in localCounts) {
        wordsMap[word] = (wordsMap[word] || 0) + localCounts[word];
      }

      await saveWordCounts();

      res.status(200).json({
        wordCounts: localCounts,
      });
    });

    writable.on("error", (error: Error) => {
      console.error("Error processing the file:", error.message);
    });
  } catch (error) {
    console.error(
      "Failed to fetch or process the URL:",
      (error as Error).message
    );
  }
});

// GET /words/:word
router.get("/words/:word", (req: Request, res: Response): void => {
  const word = req.params.word.toLowerCase();

  if (!Object.keys(wordsMap).length) {
    res
      .status(400)
      .json({ error: "No word data available. POST to /words first." });
    return;
  }

  const count = wordsMap[word];
  if (count !== undefined) {
    res.status(200).json({ word, count });
  } else {
    res.status(404).json({ error: `The word '${word}' was not found.` });
  }
});
export default router;

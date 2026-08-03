/**
 * db.js
 * ---------------------------------------------------------------------------
 * A deliberately tiny "database" for the portfolio project.
 *
 * Why not a real database?
 *   For a portfolio ATS you don't need Postgres/Mongo to prove you understand
 *   the workflow — you need something any reviewer can open and read in two
 *   minutes. This module persists two collections ("jobs" and "candidates")
 *   to a single JSON file on disk and exposes simple, synchronous helpers.
 *
 *   Swapping this for a real database later only means rewriting this one
 *   file — every route calls these same functions (getAll, getById, insert,
 *   update, remove), so the rest of the app never has to change.
 * ---------------------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "data", "db.json");

// Make sure we always start from a valid file so the server never crashes
// on a fresh checkout.
function ensureDbFile() {
  if (!fs.existsSync(DB_FILE)) {
    const seed = { jobs: [], candidates: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
  }
}

function readDb() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function nextId(collection) {
  if (collection.length === 0) return 1;
  return Math.max(...collection.map((row) => row.id)) + 1;
}

const db = {
  getAll(collectionName) {
    const data = readDb();
    return data[collectionName] || [];
  },

  getById(collectionName, id) {
    const data = readDb();
    return (data[collectionName] || []).find((row) => row.id === Number(id));
  },

  insert(collectionName, row) {
    const data = readDb();
    if (!data[collectionName]) data[collectionName] = [];
    const record = { id: nextId(data[collectionName]), ...row };
    data[collectionName].push(record);
    writeDb(data);
    return record;
  },

  update(collectionName, id, patch) {
    const data = readDb();
    const collection = data[collectionName] || [];
    const index = collection.findIndex((row) => row.id === Number(id));
    if (index === -1) return null;
    collection[index] = { ...collection[index], ...patch };
    writeDb(data);
    return collection[index];
  },

  remove(collectionName, id) {
    const data = readDb();
    const collection = data[collectionName] || [];
    const filtered = collection.filter((row) => row.id !== Number(id));
    data[collectionName] = filtered;
    writeDb(data);
    return filtered.length !== collection.length;
  },
};

module.exports = db;

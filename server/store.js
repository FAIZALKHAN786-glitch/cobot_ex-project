/*
 * Emergency Response & Operations — JSON file store
 * Zero-dependency replacement for MongoDB/Mongoose.
 * Data persists in server/data/db.json.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const COLLECTIONS = ["incidents", "units", "personnel", "hospitals"];

/* ------------------------------------------------------------------ */
/*  Internal state                                                    */
/* ------------------------------------------------------------------ */

let db = {};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDir();
  let data = {};
  if (fs.existsSync(DB_FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    } catch (e) {
      data = {};
    }
  }
  // Mutate the existing db object (don't reassign) so exported ref stays valid
  Object.keys(db).forEach((k) => delete db[k]);
  COLLECTIONS.forEach((c) => {
    db[c] = data[c] || [];
  });
  return db;
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* ------------------------------------------------------------------ */
/*  Filter matching                                                   */
/* ------------------------------------------------------------------ */

function matches(item, filter) {
  return Object.entries(filter).every(([key, value]) => {
    // $or: match if any sub-condition matches
    if (key === "$or" && Array.isArray(value)) {
      return value.some((sub) => matches(item, sub));
    }
    if (value === null || value === undefined) {
      return item[key] == null;
    }
    if (value instanceof RegExp) {
      return value.test(String(item[key]));
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      // MongoDB operators: $ne, $in
      return Object.entries(value).every(([op, opVal]) => {
        if (op === "$ne") return item[key] !== opVal;
        if (op === "$in") return Array.isArray(opVal) && opVal.includes(item[key]);
        return item[key] === opVal;
      });
    }
    return item[key] === value;
  });
}

/* ------------------------------------------------------------------ */
/*  CRUD                                                              */
/* ------------------------------------------------------------------ */

function find(collection, filter = {}) {
  return (db[collection] || []).filter((item) => matches(item, filter));
}

function findOne(collection, filter) {
  const items = find(collection, filter);
  return items[0] || null;
}

function insertOne(collection, doc) {
  const items = db[collection] || [];
  items.push(doc);
  save();
  return doc;
}

function updateOne(collection, filter, update) {
  const items = db[collection] || [];
  const idx = items.findIndex((item) => matches(item, filter));
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...update };
  save();
  return items[idx];
}

function deleteOne(collection, filter) {
  const items = db[collection] || [];
  const idx = items.findIndex((item) => matches(item, filter));
  if (idx === -1) return null;
  const removed = items.splice(idx, 1)[0];
  save();
  return removed;
}

function count(collection, filter = {}) {
  return find(collection, filter).length;
}

function aggregate(collection, pipeline) {
  // Minimal aggregation: supports $group with _id and $sum: 1
  let items = db[collection] || [];
  const groupStage = pipeline.find((p) => p && p.$group);
  if (!groupStage) return items;
  const { _id, count } = groupStage.$group;
  const groups = {};
  items.forEach((item) => {
    const key = item[_id.slice(1)]; // strip leading "$"
    if (!groups[key]) groups[key] = 0;
    groups[key] += count && count.$sum === 1 ? 1 : 0;
  });
  return Object.entries(groups).map(([key, cnt]) => ({ _id: key, count: cnt }));
}

module.exports = {
  load,
  save,
  db,
  find,
  findOne,
  insertOne,
  updateOne,
  deleteOne,
  count,
  aggregate,
  COLLECTIONS,
  DB_FILE,
};

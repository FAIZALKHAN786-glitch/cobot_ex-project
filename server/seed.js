/*
 * Emergency Response & Operations — seed runner (JSON store)
 * Seeds server/data/db.json with illustrative sample data.
 * Run:  cd server && npm run seed
 */

const { load, save, db, COLLECTIONS } = require("./store");

const INCIDENTS = [
  {
    id: "IRN-2026-012",
    title: "Structure fire — multi-unit residential",
    address: "1420 Oakridge Ave, Unit C",
    severity: "severe",
    category: "fire",
    status: "on-scene",
    reportedAt: new Date("2026-11-09T22:14:00").toISOString(),
    updatedAt: new Date("2026-11-10T01:38:00").toISOString(),
    units: ["BC-1", "ENG-1", "MED-5"],
    location: { lat: 40.7580, lng: -73.9855 },
    description:
      "Smoke visible from second floor. All units accounted for. Search in progress.",
    timeline: [
      { t: "22:14", e: "Call received", d: "Resident reported smoke and activated alarm.", s: "active" },
      { t: "22:18", e: "Units dispatched", d: "Engine 1, Medic 5, Battalion 1 assigned.", s: "dispatched" },
      { t: "22:31", e: "First unit on scene", d: "Engine 1 arrived; smoke confirmed on floor 2.", s: "enroute" },
      { t: "01:12", e: "All units on scene", d: "Rescue and medical units staged.", s: "on-scene" },
      { t: "01:38", e: "Search underway", d: "Interior search in progress; all occupants accounted for.", s: "on-scene" },
    ],
  },
  {
    id: "IRN-2026-014",
    title: "Motor vehicle collision — I-80 West",
    address: "I-80 West near mile marker 47",
    severity: "high",
    category: "traffic",
    status: "enroute",
    reportedAt: new Date("2026-11-10T03:02:00").toISOString(),
    updatedAt: new Date("2026-11-10T03:41:00").toISOString(),
    units: ["RESC-2"],
    location: { lat: 40.7850, lng: -74.0100 },
    description: "Two-vehicle collision, lane blocked. Rescue unit en route.",
    timeline: [
      { t: "03:02", e: "Call received", d: "911 call from passing motorist.", s: "active" },
      { t: "03:06", e: "Units dispatched", d: "Rescue 2 assigned to scene.", s: "dispatched" },
      { t: "03:41", e: "Unit en route", d: "Rescue 2 responding with lights and siren.", s: "enroute" },
    ],
  },
  {
    id: "IRN-2026-013",
    title: "Gas leak — commercial",
    address: "318 Commerce Pl, Suite 4",
    severity: "high",
    category: "hazard",
    status: "active",
    reportedAt: new Date("2026-11-10T05:55:00").toISOString(),
    updatedAt: new Date("2026-11-10T05:55:00").toISOString(),
    units: [],
    location: { lat: 40.7484, lng: -73.9857 },
    description: "Odor of natural gas reported inside suite. Building evacuated.",
    timeline: [
      { t: "05:55", e: "Call received", d: "Business owner reported strong gas odor.", s: "active" },
    ],
  },
  {
    id: "IRN-2026-011",
    title: "Medical emergency — assist",
    address: "890 Riverview Dr",
    severity: "medium",
    category: "medical",
    status: "resolved",
    reportedAt: new Date("2026-11-09T18:02:00").toISOString(),
    updatedAt: new Date("2026-11-09T18:57:00").toISOString(),
    units: ["MED-5"],
    location: { lat: 40.7600, lng: -73.9900 },
    description: "Fall victim assessed and transported. Scene cleared.",
    timeline: [
      { t: "18:02", e: "Call received", d: "Medical assist requested.", s: "active" },
      { t: "18:15", e: "Unit on scene", d: "Medic 5 assessed patient.", s: "on-scene" },
      { t: "18:57", e: "Resolved", d: "Patient transported; scene cleared.", s: "resolved" },
    ],
  },
  {
    id: "IRN-2026-010",
    title: "Vegetation fire — roadside",
    address: "Old Mill Rd & County Line",
    severity: "low",
    category: "fire",
    status: "resolved",
    reportedAt: new Date("2026-11-09T14:20:00").toISOString(),
    updatedAt: new Date("2026-11-09T15:03:00").toISOString(),
    units: ["ENG-3"],
    location: { lat: 40.7700, lng: -74.0000 },
    description: "Small brush fire extinguished. No structures threatened.",
    timeline: [
      { t: "14:20", e: "Call received", d: "Roadside smoke reported.", s: "active" },
      { t: "15:03", e: "Resolved", d: "Fire extinguished; scene cleared.", s: "resolved" },
    ],
  },
];

const UNITS = [
  { id: "ENG-1", name: "Engine 1", type: "Fire Engine", status: "available", location: "Central Station" },
  { id: "ENG-3", name: "Engine 3", type: "Fire Engine", status: "available", location: "North Station" },
  { id: "RESC-2", name: "Rescue 2", type: "Rescue", status: "enroute", location: "Incident IRN-2026-014" },
  { id: "MED-5", name: "Medic 5", type: "Ambulance", status: "on-scene", location: "Incident IRN-2026-012" },
  { id: "MED-8", name: "Medic 8", type: "Ambulance", status: "available", location: "East Station" },
  { id: "BC-1", name: "Battalion 1", type: "Chief", status: "on-scene", location: "Incident IRN-2026-012" },
];

const PERSONNEL = [
  { id: "P-101", name: "A. Reyes", role: "Captain", status: "on-scene", unit: "BC-1" },
  { id: "P-104", name: "J. Okafor", role: "Paramedic", status: "on-scene", unit: "MED-5" },
  { id: "P-109", name: "S. Chen", role: "Firefighter", status: "enroute", unit: "RESC-2" },
  { id: "P-112", name: "M. Delgado", role: "EMT", status: "available", unit: "MED-8" },
  { id: "P-118", name: "T. Briggs", role: "Firefighter", status: "available", unit: "ENG-3" },
  { id: "P-121", name: "N. Al-Farsi", role: "Dispatcher", status: "available", unit: null },
];

const HOSPITALS = [
  {
    id: "H-001",
    name: "St. Luke's Regional Medical Center",
    address: "500 Mercy Blvd",
    location: { lat: 40.7500, lng: -73.9700 },
    bedCapacity: 300,
    bedAvailable: 89,
    icuAvailable: 12,
    traumaCenter: true,
    emergencyDept: true,
  },
  {
    id: "H-002",
    name: "University General Hospital",
    address: "1200 Campus Drive",
    location: { lat: 40.7700, lng: -73.9600 },
    bedCapacity: 400,
    bedAvailable: 120,
    icuAvailable: 18,
    traumaCenter: true,
    emergencyDept: true,
  },
  {
    id: "H-003",
    name: "Mercy Medical Center",
    address: "850 Westside Ave",
    location: { lat: 40.7300, lng: -74.0000 },
    bedCapacity: 150,
    bedAvailable: 12,
    icuAvailable: 3,
    traumaCenter: false,
    emergencyDept: true,
  },
  {
    id: "H-004",
    name: "Community Care Hospital",
    address: "210 Oak Street",
    location: { lat: 40.7900, lng: -73.9900 },
    bedCapacity: 90,
    bedAvailable: 4,
    icuAvailable: 1,
    traumaCenter: false,
    emergencyDept: false,
  },
  {
    id: "H-005",
    name: "Northside General Hospital",
    address: "775 River Road",
    location: { lat: 40.8000, lng: -73.9500 },
    bedCapacity: 220,
    bedAvailable: 61,
    icuAvailable: 9,
    traumaCenter: true,
    emergencyDept: true,
  },
];

const seed = () => {
  load();
  COLLECTIONS.forEach((c) => {
    // eslint-disable-next-line no-param-reassign
    db[c] = [];
  });
  db.incidents = INCIDENTS;
  db.units = UNITS;
  db.personnel = PERSONNEL;
  db.hospitals = HOSPITALS;
  save();

  console.log("[seed] database seeded successfully");
  console.log(`   incidents: ${INCIDENTS.length}`);
  console.log(`   units: ${UNITS.length}`);
  console.log(`   personnel: ${PERSONNEL.length}`);
  console.log(`   hospitals: ${HOSPITALS.length}`);
  console.log(`   file: ${require("./store").DB_FILE}`);
  process.exit(0);
};

seed();

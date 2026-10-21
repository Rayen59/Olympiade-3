import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_PROBLEMS } from './problemsData.js';
import { COURSES_DATA } from './coursesData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = __dirname;
const DB_FILE = path.join(DATA_DIR, 'mk_store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getVirginStore() {
  const now = new Date().toISOString();
  return {
    // VIRGIN PROJECT: NO virtual or mock users to ensure 100% accurate leaderboard
    users: [
      {
        id: "usr-admin-1",
        username: "Admin MK",
        email: "admin12@gmail.com",
        password: "admin12",
        role: "admin",
        points: 0,
        solvedProblems: [],
        solvedCount: 0,
        banned: false,
        banUntil: null,
        banReason: null,
        createdAt: now,
        avatarColor: "#0056b3",
        bio: "Administrateur officiel de la plateforme MK Olympiades."
      }
    ],
    submissions: [],
    forumTopics: [],
    // OLYMPIADS MODULE
    olympiads: [
      {
        id: "oly-1",
        title: "Olympiade Mathématique MK - Session Officielle",
        description: "Épreuve générale d'olympiades de haut niveau. Durée : 4 heures (240 minutes). 4 problèmes notés sur 7 points (Total 28 pts).",
        durationHours: 4,
        durationMinutes: 0,
        totalDurationMinutes: 240,
        problemCount: 4,
        pointsPerProblem: 7,
        totalPoints: 28,
        goldCutoff: 24,
        silverCutoff: 18,
        bronzeCutoff: 12,
        honorableMentionCutoff: 7,
        // PDF document: can be downloaded or viewed
        pdfUrl: "/assets/olympiade_mk_sujet_officiel.pdf",
        pdfTitle: "Sujet_Officiel_Olympiade_MK.pdf",
        status: "active", // 'active', 'grading', 'closed'
        resultsPublished: false, // Locked: Only admin can open access to final rankings and awards!
        createdAt: now
      }
    ],
    olympiadSubmissions: [],
    problems: INITIAL_PROBLEMS,
    courses: COURSES_DATA
  };
}

let store = null;

export function loadStore() {
  if (store) return store;
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      store = JSON.parse(data);

      // Make sure admin exists
      const hasAdmin = store.users.some(u => u.email === "admin12@gmail.com");
      if (!hasAdmin) {
        store.users.unshift(getVirginStore().users[0]);
      }

      // Ensure olympiads array exists
      if (!store.olympiads) store.olympiads = getVirginStore().olympiads;
      if (!store.olympiadSubmissions) store.olympiadSubmissions = [];

      // Always keep problems up to date with transcribed screenshots
      store.problems = INITIAL_PROBLEMS;
      store.courses = COURSES_DATA;

      return store;
    } catch (e) {
      console.warn("Failed to load store, initializing virgin defaults:", e);
    }
  }
  store = getVirginStore();
  saveStore();
  return store;
}

export function saveStore() {
  if (!store) return;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error("Error writing store to disk:", e);
  }
}

export function resetToVirgin() {
  store = getVirginStore();
  saveStore();
  return store;
}

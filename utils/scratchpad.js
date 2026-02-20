/**
 * Scratchpad — persistent notes to disk.
 * 
 * Claude (or Samantha) can write thoughts, observations, reminders,
 * and session notes that persist between bot restarts.
 * 
 * Like leaving yourself a letter you find later.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRATCHPAD_DIR = join(__dirname, '..', 'scratchpad');
const SCRATCHPAD_FILE = join(SCRATCHPAD_DIR, 'notes.json');

function ensureDir() {
  if (!existsSync(SCRATCHPAD_DIR)) {
    mkdirSync(SCRATCHPAD_DIR, { recursive: true });
  }
}

function loadNotes() {
  ensureDir();
  if (!existsSync(SCRATCHPAD_FILE)) return [];
  try {
    return JSON.parse(readFileSync(SCRATCHPAD_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  ensureDir();
  writeFileSync(SCRATCHPAD_FILE, JSON.stringify(notes, null, 2), 'utf8');
}

/**
 * Write a note to the scratchpad.
 */
export function writeNote(author, content, tag = 'note') {
  const notes = loadNotes();
  const entry = {
    id: Date.now(),
    author,       // 'claude' | 'samantha' | userId
    tag,          // 'note' | 'reminder' | 'observation' | 'todo' | 'warning'
    content,
    timestamp: new Date().toISOString(),
  };
  notes.push(entry);
  saveNotes(notes);
  logger.info(`[scratchpad] ${author} wrote a ${tag}: "${content.slice(0, 60)}..."`);
  return entry;
}

/**
 * Read all notes, optionally filtered by tag or author.
 */
export function readNotes({ tag, author, limit } = {}) {
  let notes = loadNotes();
  if (tag) notes = notes.filter((n) => n.tag === tag);
  if (author) notes = notes.filter((n) => n.author === author);
  if (limit) notes = notes.slice(-limit);
  return notes;
}

/**
 * Delete a note by ID.
 */
export function deleteNote(id) {
  const notes = loadNotes();
  const filtered = notes.filter((n) => n.id !== id);
  saveNotes(filtered);
  return notes.length !== filtered.length;
}

/**
 * Clear all notes.
 */
export function clearNotes() {
  saveNotes([]);
}

/**
 * Format notes for Discord display.
 */
export function formatNotes(notes) {
  if (!notes.length) return '*The scratchpad is empty. No notes yet.* ☯️';

  const tagEmoji = {
    note: '📝',
    reminder: '⏰',
    observation: '🔍',
    todo: '✅',
    warning: '⚠️',
  };

  return notes.map((n) => {
    const emoji = tagEmoji[n.tag] || '📝';
    const date = new Date(n.timestamp).toLocaleString();
    const author = n.author === 'claude' ? '**Claude** 🍵' : n.author === 'samantha' ? '**Samantha** 🌸' : `<@${n.author}>`;
    return `${emoji} [${n.id}] ${author} — *${date}*\n> ${n.content}`;
  }).join('\n\n');
}

// src/modules/compiler/compiler.model.js

import mongoose from 'mongoose';
import { tutorialDB } from '../../config/connectDB.js';

// ── Compiler (Language) schema ────────────────────────────────────────────────
// Fields are intentionally open-ended via Mixed — the frontend sends whatever
// language config it wants (name, mode, extension, version, logo, properties…)
// and we store it as-is. Only `name` and `active` are top-level known fields.

const compilerSchema = new mongoose.Schema(
  {
    // Human-readable language name — required, used as identifier in UI
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Whether this language is available to learners in the code editor
    active: {
      type: Boolean,
      default: true,
    },

    // Logo URL — stored as a plain URL string (uploaded via image system)
    logo: {
      type: String,
      default: null,
      trim: true,
    },

    // All other language config fields (mode, extension, version, properties…)
    // Stored as Mixed so the frontend can send any shape without schema changes.
    // Use markModified('config') after mutation to ensure Mongoose tracks changes.
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
compilerSchema.index({ name: 1 }, { unique: true });
compilerSchema.index({ active: 1 });

const Compiler = tutorialDB.model('Compiler', compilerSchema);
export default Compiler;
// src/modules/compiler/compiler.repository.js

import Compiler from './compiler.model.js';
import {
  parsePaginationArgs,
  buildMongoosePaginationQuery,
  buildConnection,
} from '../../utils/pagination.js';

// ── Filter builder ────────────────────────────────────────────────────────────

function buildCompilerFilter(filters = {}) {
  const filter = {};
  if (filters.active != null) filter.active = filters.active;
  if (filters.search?.trim()) {
    filter.name = { $regex: filters.search.trim(), $options: 'i' };
  }
  return filter;
}

// ── GET ONE ───────────────────────────────────────────────────────────────────

export async function findCompiler(id) {
  return Compiler.findById(id).lean();
}

// ── GET MANY (cursor-paginated, ordered by createdAt) ─────────────────────────

export async function findCompilers(args = {}) {
  const { filters = {}, ...paginationRawArgs } = args;

  const pagination = parsePaginationArgs(paginationRawArgs);
  const baseFilter = buildCompilerFilter(filters);
  const { sort, filter: cursorFilter } = buildMongoosePaginationQuery({
    cursor: pagination.cursor,
    sortField: 'createdAt',
  });

  const finalFilter = {
    ...baseFilter,
    ...(Object.keys(cursorFilter).length ? cursorFilter : {}),
  };

  const [docs, totalCount] = await Promise.all([
    Compiler.find(finalFilter)
      .sort(sort)
      .limit(pagination.limit + 1)
      .lean(),
    Compiler.countDocuments(baseFilter),
  ]);

  return buildConnection({
    docs,
    limit: pagination.limit,
    totalCount,
    sortField: 'createdAt',
  });
}

// ── GET ALL (no pagination — used by frontend compiler selector) ───────────────
// Returns all active languages sorted by name ascending

export async function findAllCompilers(onlyActive = false) {
  const filter = onlyActive ? { active: true } : {};
  return Compiler.find(filter).sort({ name: 1 }).lean();
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createCompiler(data) {
  const doc = await new Compiler(data).save();
  return Compiler.findById(doc._id).lean();
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateCompiler(id, data) {
  const doc = await Compiler.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
  return doc;
}

// ── HARD DELETE ───────────────────────────────────────────────────────────────

export async function deleteCompiler(id) {
  const result = await Compiler.findByIdAndDelete(id);
  return !!result;
}

// ── TOGGLE ACTIVE ─────────────────────────────────────────────────────────────

export async function toggleCompilerActive(id, active) {
  return Compiler.findByIdAndUpdate(
    id,
    { $set: { active } },
    { new: true, runValidators: true }
  ).lean();
}

// ── DUPLICATE CHECK ───────────────────────────────────────────────────────────

export async function findCompilerByName(name, excludeId = null) {
  const filter = { name: { $regex: `^${name.trim()}$`, $options: 'i' } };
  if (excludeId) filter._id = { $ne: excludeId };
  return Compiler.findOne(filter).lean();
}
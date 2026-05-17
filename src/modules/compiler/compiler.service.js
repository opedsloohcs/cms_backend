// src/modules/compiler/compiler.service.js

import {
    findCompiler,
    findCompilers,
    findAllCompilers,
    createCompiler,
    updateCompiler,
    deleteCompiler,
    toggleCompilerActive,
    findCompilerByName,
  } from './compiler.repository.js';
  
  // ── Validation ────────────────────────────────────────────────────────────────
  
  function validateCompilerInput({ name, logo }) {
    if (!name?.trim()) {
      throw new Error('Language name is required');
    }
    if (name.trim().length > 100) {
      throw new Error('Language name must be 100 characters or fewer');
    }
    if (logo && !/^https?:\/\/.+/.test(logo.trim())) {
      throw new Error('Logo must be a valid http/https URL');
    }
  }
  
  // ── Build DB payload ──────────────────────────────────────────────────────────
  // Separates known top-level fields (name, active, logo) from the rest,
  // which all go into the Mixed `config` field.
  
  function buildPayload(input) {
    const { name, active, logo, ...rest } = input;
  
    const payload = {};
  
    if (name     !== undefined) payload.name   = name.trim();
    if (active   !== undefined) payload.active = active;
    if (logo     !== undefined) payload.logo   = logo?.trim() ?? null;
  
    // Everything else goes into config (mode, extension, version, properties…)
    if (Object.keys(rest).length > 0) {
      payload.config = rest;
    }
  
    return payload;
  }
  
  // ── Queries ───────────────────────────────────────────────────────────────────
  
  export async function getCompiler(id) {
    const compiler = await findCompiler(id);
    if (!compiler) throw new Error('Language not found');
    return compiler;
  }
  
  export async function getCompilers(args) {
    return findCompilers(args);
  }
  
  export async function getAllCompilers(onlyActive = false) {
    return findAllCompilers(onlyActive);
  }
  
  // ── Mutations ─────────────────────────────────────────────────────────────────
  
  export async function createCompilerService(input) {
    const { name, logo } = input;
  
    validateCompilerInput({ name, logo });
  
    // Duplicate name check
    const existing = await findCompilerByName(name);
    if (existing) {
      throw new Error(`A language named "${name.trim()}" already exists`);
    }
  
    const payload = buildPayload(input);
  
    return createCompiler(payload);
  }
  
  export async function updateCompilerService(id, input) {
    const existing = await findCompiler(id);
    if (!existing) throw new Error('Language not found');
  
    const name = input.name ?? existing.name;
    const logo = input.logo !== undefined ? input.logo : existing.logo;
  
    validateCompilerInput({ name, logo });
  
    // Duplicate name check — exclude self
    if (input.name && input.name.trim() !== existing.name) {
      const duplicate = await findCompilerByName(input.name, id);
      if (duplicate) {
        throw new Error(`A language named "${input.name.trim()}" already exists`);
      }
    }
  
    const payload = buildPayload(input);
  
    // Deep-merge config — incoming config fields override existing ones,
    // but existing keys not mentioned in input are preserved.
    if (payload.config) {
      payload.config = { ...(existing.config ?? {}), ...payload.config };
    }
  
    const updated = await updateCompiler(id, payload);
    if (!updated) throw new Error('Language not found');
    return updated;
  }
  
  export async function deleteCompilerService(id) {
    const existing = await findCompiler(id);
    if (!existing) throw new Error('Language not found');
  
    const deleted = await deleteCompiler(id);
    if (!deleted) throw new Error('Failed to delete language');
  
    return { success: true, message: 'Language deleted successfully', id };
  }
  
  export async function toggleCompilerActiveService(id, active) {
    const existing = await findCompiler(id);
    if (!existing) throw new Error('Language not found');
  
    const updated = await toggleCompilerActive(id, active);
    if (!updated) throw new Error('Language not found');
    return updated;
  }
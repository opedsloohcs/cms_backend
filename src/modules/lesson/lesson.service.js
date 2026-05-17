// src/modules/lesson/lesson.service.js
// CHANGED:
//   1. createLessonService — passes section through (null = root level)
//   2. getSidebarLessons — updated to use new sidebar repo function
//   3. createLessonService — safe auto-save draft creation:
//      - if course is missing, skip fullSlug generation and save without it
//      - if slug is missing, generate a unique temp slug from title or uuid
//      - fullSlug is only built when both course and slug are present

import {
  findLesson,
  findLessons,
  findSidebarLessons,
  findRecentLessons,
  createLesson,
  updateLesson,
  softDeleteLesson,
  restoreLesson,
  publishLesson,
  unpublishLesson,
} from './lesson.repository.js';

import { findCourse } from '../course/course.repository.js';

export async function getLesson({ id, slug }) {
  const lesson = await findLesson({ id, slug });
  if (!lesson) throw new Error('Lesson not found');
  return lesson;
}

export async function getLessons(args) {
  return findLessons(args);
}

export async function getSidebarLessons(courseId) {
  if (!courseId) throw new Error('courseId is required');
  return findSidebarLessons(courseId);
}

export async function getRecentLessons(limit) {
  return findRecentLessons(limit);
}

export async function createLessonService(input) {
  // ── Slug ───────────────────────────────────────────────────────────────────
  // If no slug provided (auto-save fires before user fills the field),
  // generate a unique temp slug from title or a random id so the unique
  // index on { course, slug } never clashes with an empty string.
  const slug =
    input.slug?.trim() ||
    (input.title
      ? `${input.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}-${Date.now()}`
      : `draft-${Date.now()}`);

  // ── fullSlug ───────────────────────────────────────────────────────────────
  // Only build fullSlug when we actually have a course — otherwise leave it
  // undefined so Mongoose does not store an empty / malformed value that
  // would collide with the sparse unique index.
  let fullSlug;
  if (input.course) {
    const course = await findCourse({ id: input.course });
    if (course) {
      fullSlug = `${course.slug}/${slug}`;
    }
  }

  const payload = {
    title: input.title,
    slug,
    ...(fullSlug !== undefined ? { fullSlug } : {}),
    description: input.description,
    course: input.course ?? null,
    section: input.section ?? null,
    type: input.type ?? 'single',
    order: input.order ?? 'a0',
    content: input.content ?? '',
    isPublished: input.isPublished ?? false,
    meta: {
      title: input.meta?.title ?? input.title,
      description: input.meta?.description ?? input.description ?? '',
      keywords: input.meta?.keywords ?? [],
    },
  };

  try {
    return await createLesson(payload);
  } catch (err) {
    if (err.code === 11000) {
      console.log('DUPLICATE KEY ERROR:', err.keyValue);
      throw new Error(
        `A lesson with the slug "${slug}" already exists in this course`
      );
    }
    throw err;
  }
}

export async function updateLessonService(id, input) {
  const payload = {};

  if (input.title !== undefined) payload.title = input.title;
  if (input.slug !== undefined) payload.slug = input.slug;
  if (input.fullSlug !== undefined) payload.fullSlug = input.fullSlug;
  if (input.description !== undefined) payload.description = input.description;
  if (input.course !== undefined) payload.course = input.course;
  if (input.type !== undefined) payload.type = input.type;
  if (input.order !== undefined) payload.order = input.order;
  if (input.content !== undefined) payload.content = input.content;
  if (input.isPublished !== undefined) payload.isPublished = input.isPublished;

  // Explicitly handle section:
  // undefined in input → don't touch section field
  // null in input      → move lesson to root level
  // string id in input → move lesson to that section
  if ('section' in input) {
    payload.section = input.section ?? null;
  }

  // ── fullSlug — rebuild if course or slug changed ───────────────────────────
  if (input.course && input.slug) {
    const course = await findCourse({ id: input.course });
    if (course) payload.fullSlug = `${course.slug}/${input.slug}`;
  }

  if (input.meta) {
    if (input.meta.title !== undefined) payload['meta.title'] = input.meta.title;
    if (input.meta.description !== undefined) payload['meta.description'] = input.meta.description;
    if (input.meta.keywords !== undefined) payload['meta.keywords'] = input.meta.keywords;
  }

  return updateLesson(id, payload);
}

export async function deleteLessonService(id) {
  const deleted = await softDeleteLesson(id);
  return {
    success: true,
    message: 'Lesson deleted successfully',
    id: deleted._id.toString(),
  };
}

export async function restoreLessonService(id) {
  return restoreLesson(id);
}

export async function publishLessonService(id) {
  return publishLesson(id);
}

export async function unpublishLessonService(id) {
  return unpublishLesson(id);
}
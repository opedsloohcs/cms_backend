// src/modules/lesson/lesson.model.js
// CHANGED:
//   1. order: Number → String (fractional index)
//   2. Added section field (ObjectId ref to Section, nullable — null = root level)
//   3. Removed parentId (replaced by Section for grouping)
//   4. Updated indexes

import mongoose from 'mongoose';
import { tutorialDB } from '../../config/connectDB.js';

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      // required: true,
      lowercase: true,
      trim: true,
    },
    fullSlug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      // required: true,
      ref: 'Course',
    },
    // Optional section reference.
    // null  = lesson lives directly under the course (root level)
    // ObjectId = lesson belongs to this section
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,

    },
    type: {
      type: String,
      enum: ['single', 'grouped'],
      default: 'single',
    },
    // Fractional index string — ordered within section (or root level)
    order: {
      type: String,
      default: 'a0',
    },
    content: {
      type: String,
    },
    isPublished: {
      type: Boolean,
      default: false,
    
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
     
    },
    meta: {
      title: {
        type: String,
        // required: true,
        trim: true,
      },
      description: {
        type: String,
        // required: true,
      },
      keywords: [String],
    },
  },
  { timestamps: true }
);

// Unique slug per course
lessonSchema.index(
  { course: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false }
  }
);

// Ordering within a section (or root level when section is null)
lessonSchema.index({ course: 1, section: 1, order: 1 });

// Published filter
lessonSchema.index({ course: 1, section: 1, isPublished: 1, order: 1 });

// Full slug lookup
lessonSchema.index({ fullSlug: 1 }, { unique: true, sparse: true });

// Auto-set publishedAt on update
lessonSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();
  if (update?.$set?.isPublished === true && !update?.$set?.publishedAt) {
    update.$set.publishedAt = new Date();
  }
});

const Lesson = tutorialDB.model('Lesson', lessonSchema);
export default Lesson;

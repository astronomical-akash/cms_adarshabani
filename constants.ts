
import { BloomsLevel, CurriculumTree } from './types';

export const BLOOMS_LEVELS = [
  BloomsLevel.LEVEL_0,
  BloomsLevel.LEVEL_1,
  BloomsLevel.LEVEL_2
];

export const BLOOMS_DESCRIPTIONS = {
  [BloomsLevel.LEVEL_0]: "Student Readiness",
  [BloomsLevel.LEVEL_1]: "Remember & Understand",
  [BloomsLevel.LEVEL_2]: "Derive, Apply & Analyze"
};

// Initial state for the hierarchy manager
export const INITIAL_CURRICULUM: CurriculumTree = {
  'Class 9': {
    'Science': {
      'Physics': {
        'Motion': ['Speed and Velocity', 'Acceleration', 'Laws of Motion'],
        'Force': ['Types of Force', 'Newton Laws', 'Friction'],
      },
      'Biology': {
        'Life Processes': ['Nutrition', 'Respiration', 'Transportation'],
      }
    },
    'Mathematics': {
      'Algebra': {
        'Linear Equations': ['One Variable', 'Two Variables'],
        'Polynomials': ['Introduction', 'Factorization']
      }
    }
  },
  'Class 10': {
    'Science': {
      'Chemistry': {
        'Acids Bases and Salts': ['Properties of Acids', 'Properties of Bases', 'pH Scale']
      }
    }
  }
};

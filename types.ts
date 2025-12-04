
export enum BloomsLevel {
  LEVEL_0 = 'Level 0 (Readiness)',
  LEVEL_1 = 'Level 1 (Remember & Understand)',
  LEVEL_2 = 'Level 2 (Apply & Analyze)'
}

export enum MaterialType {
  VIDEO = 'mp4',
  PDF = 'pdf',
  DOC = 'docx',
  IMAGE = 'image',
  OTHER = 'other'
}

export enum MaterialStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum UserRole {
  CONTRIBUTOR = 'contributor',
  MODERATOR = 'moderator'
}

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  role: UserRole;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  url: string;
  fileSize?: string;
  uploadDate: string;

  // Hierarchy
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  subtopic: string;
  bloomsLevel: BloomsLevel;

  // Moderation
  status: MaterialStatus;
  contributorId?: string;
  contributorName?: string;
}

// Tree Structure: Class -> Subject -> Chapter -> Topic -> Subtopics[]
export interface CurriculumTree {
  [className: string]: {
    [subject: string]: {
      [chapter: string]: {
        [topic: string]: string[] // Array of subtopics
      }
    }
  }
}

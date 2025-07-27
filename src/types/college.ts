export interface CollegeData {
  id: string;
  srNo: number;
  collegeName: string;
  branch: string;
  cutoff: number;
  numberOutsideBracket: number;
  numberInsideBracket: number;
  order: number;
  originalOrder?: number; // Store original position when deleted
}

export interface UserSession {
  id: string;
  colleges: CollegeData[];
  deletedColleges: CollegeData[];
  lastAction: 'delete' | 'reorder' | 'restore' | null;
  lastActionData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeacherData {
  name: string;
  nip: string;
  school: string;
  schoolAddress: string;
  academicYear: string;
}

export interface Student {
  id: string;
  photo: string;
  name: string;
  className: string;
  address: string;
  phone: string;
  notes: string;
}

export type CounselingType = 'Klasikal' | 'Individual';
export type CounselingAspect = 'Akademik' | 'Karakter' | 'Sosial-Emosional' | 'Kedisiplinan' | 'Bakat dan Minat';
export type CounselingStatus = 'baik' | 'perlu perhatian' | 'butuh bantuan';

export interface CounselingLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  academicYear: string;
  studentId: string;
  studentName: string;
  className: string;
  type: CounselingType;
  aspect: CounselingAspect;
  result: string;
  status: CounselingStatus;
  followUp: string;
  notes: string;
}

export enum ViewMode {
  WELCOME = 'WELCOME',
  HOME = 'HOME',
  STUDENT_LIST = 'STUDENT_LIST',
  STUDENT_INPUT = 'STUDENT_INPUT',
  COUNSELING_INPUT = 'COUNSELING_INPUT',
  COUNSELING_DATA = 'COUNSELING_DATA',
  LPJ_MANAGEMENT = 'LPJ_MANAGEMENT',
  SETTINGS = 'SETTINGS'
}

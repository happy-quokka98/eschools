import { ObjectId } from "mongodb";

export interface Student {
  _id?: ObjectId;
  name: string;
  surname: string;
  password: string;
  user_ID: string;
  class_id: ObjectId;
}

export interface CalendarEntry {
  teacher_id: ObjectId;
  subject_id: ObjectId;
}

export interface Teacher {
  _id?: ObjectId;
  name: string;
  surname: string;
  password: string;
  user_ID: string;
  classes?: string[];
  homeroom_class?: string;
  gradeEntryStartDate?: string;
  calendar: CalendarEntry[][];
}

export interface Admin {
  _id?: ObjectId;
  name: string;
  surname: string;
  password: string;
  user_ID: string;
}

export interface ClassSubject {
  subject_id: ObjectId;
  teacher_id: ObjectId;
}

export interface Class {
  _id?: ObjectId;
  classname: string;
  tutor_id?: ObjectId;
  subjects: ClassSubject[];
  calendar: CalendarEntry[][];
}

export interface Subject {
  _id?: ObjectId;
  name: string;
}

export interface Grade {
  _id?: ObjectId;
  teacher_id: ObjectId;
  student_id: ObjectId;
  subject_id: ObjectId;
  class_id: ObjectId;
  pointType: number;
  point: number;
  date: string;
  time: string;
  comment: string;
  checked: boolean;
}

export interface SemesterStats {
  average: number;
  total_points: number;
  count: number;
  valid_grades: number;
  attendance: number;
}

export interface AnnualStats {
  average: number;
  total_points: number;
  count: number;
  valid_grades: number;
  attendance: number;
}

export interface SubjectStats {
  first_semester: SemesterStats;
  second_semester: SemesterStats;
  annual: AnnualStats;
}

export interface Statistics {
  student_id: string;
  class_id: string;
  subject_id?: string;
  first_semester: SemesterStats;
  second_semester: SemesterStats;
  annual: AnnualStats;
  subject_breakdown: Record<string, SubjectStats>;
}

export interface Message {
  _id?: ObjectId;
  sender_id: string;
  sender_name: string;
  sender_role: 'admin' | 'teacher' | 'student';
  receiver_id: string;
  receiver_name: string;
  receiver_role: 'admin' | 'teacher' | 'student';
  content: string;
  date: string;
  time: string;
}

export interface Announcement {
  _id?: ObjectId;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  date: string;
  time: string;
}

export interface Behavior {
  _id?: ObjectId;
  student_id: string;
  teacher_id: string;
  teacher_name: string;
  class_id: string;
  type: 'positive' | 'negative';
  points: number;
  category: string;
  comment?: string;
  date: string;
  time: string;
}


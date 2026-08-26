import { ObjectId } from "mongodb";

export interface Student {
  _id?: ObjectId;
  ID: string;
  user_ID?: string;
  name: string;
  surname: string;
  role?: string;
  image?: string;
  password: string;
  class_id: ObjectId;
  points?: ObjectId[];
}

export interface CalendarEntry {
  teacher_id: ObjectId;
  subject_id: ObjectId;
}

export interface CalendarEvent {
  _id?: ObjectId;
  date: string; // ISO format "YYYY-MM-DD"
  type: 'holiday' | 'makeup';
  title: string;
  replacementDayOfWeek?: number; // 0=ორშაბათი, 1=სამშაბათი, 2=ოთხშაბათი, 3=ხუთშაბათი, 4=პარასკევი
  academicYear?: string; // e.g. "2025-2026", "2026-2027"
}

export interface Teacher {
  _id?: ObjectId;
  user_ID: string;
  name: string;
  surname: string;
  role?: string;
  phone?: string;
  password: string;
  classes?: string[];
  homeroom_class?: string;
  gradeEntryStartDate?: string;
  calendar?: CalendarEntry[][];
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
  ID?: string;
  classname: string;
  damrigebeli?: ObjectId;
  tutor_id?: ObjectId;
  subjects: ClassSubject[];
  students?: ObjectId[];
  calendar: CalendarEntry[][];
}

export interface Subject {
  _id?: ObjectId;
  name: string;
  is_project?: boolean;
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
  is_excused?: boolean;
  excuse_reason?: 'olympiad' | 'sports' | 'art' | 'medical' | 'general_excused';
  is_formative?: boolean;
  is_locked?: boolean;
  confirmed_at?: string;
}

export interface CorrectionRequest {
  _id?: ObjectId;
  teacher_id: string;
  teacher_name: string;
  student_id: string;
  student_name: string;
  class_id: string;
  subject_id: string;
  grade_id?: string;
  request_type: 'grade_correction' | 'grade_deletion' | 'attendance_correction';
  current_point?: number;
  new_point?: number;
  current_pointType?: number;
  new_pointType?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Assignment {
  _id?: ObjectId;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  description: string;
  deadline: string;
  created_at: string;
}

export interface AssignmentSubmission {
  _id?: ObjectId;
  assignment_id: string;
  student_id: string;
  student_name: string;
  file_name?: string;
  file_url?: string;
  comment?: string;
  status: 'submitted' | 'approved' | 'needs_resubmission';
  feedback?: string;
  submitted_at: string;
}

export interface Exam {
  _id?: ObjectId;
  type: 'annual' | 'semester' | 'autumn' | 'extern_30' | 'make_up';
  title: string;
  class_id: string;
  subject_id: string;
  date: string;
  time: string;
  location?: string;
  student_ids?: string[];
  results?: Record<string, number>; // student_id -> mark
}

export interface ExternRegistration {
  _id?: ObjectId;
  student_name: string;
  student_surname: string;
  personal_id: string;
  phone?: string;
  email?: string;
  subjects: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Infraction {
  _id?: ObjectId;
  student_id: string;
  student_name: string;
  class_id: string;
  mandaturi_ref_id: string;
  infraction_date: string;
  category: string;
  description: string;
  principal_response_doc?: string;
  principal_response_notes?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

export interface MakeUpTask {
  _id?: ObjectId;
  student_id: string;
  student_name: string;
  subject_id: string;
  class_id: string;
  original_task_date: string;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'missed';
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
  class_id?: ObjectId | null;
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



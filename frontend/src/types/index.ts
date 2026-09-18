export interface EnrollmentRecord {
  id: number | string;
  student_nim: string;
  student_name: string;
  student_email: string;
  course_code: string;
  course_name: string;
  credits: number;
  semester: 'GANJIL' | 'GENAP';
  academic_year: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface FilterCondition {
  column: string;
  operator: 'contains' | 'startsWith' | 'equal' | 'between' | 'in';
  value: string;
}

export interface AdvancedFilterPayload {
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface CreateKrsForm {
  nim: string;
  studentName: string;
  studentEmail: string;
  courseCode: string;
  courseName: string;
  credits: number;
  academicYear: string;
  semester: 'GANJIL' | 'GENAP';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

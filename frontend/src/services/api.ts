import { CreateBatchKrsForm, CreateKrsForm, AdvancedFilterPayload, CourseCatalogItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface FetchParams {
  page: number;
  pageSize: number;
  search?: string;
  quickStatus?: string;
  quickSemester?: string;
  sort?: string;
  advancedFilter?: AdvancedFilterPayload | null;
}

export const api = {
  async getEnrollments(params: FetchParams) {
    const url = new URL(`${API_BASE_URL}/enrollments`);
    url.searchParams.set('page', params.page.toString());
    url.searchParams.set('pageSize', params.pageSize.toString());

    if (params.search) url.searchParams.set('search', params.search);
    if (params.quickStatus && params.quickStatus !== 'ALL') url.searchParams.set('quickStatus', params.quickStatus);
    if (params.quickSemester && params.quickSemester !== 'ALL') url.searchParams.set('quickSemester', params.quickSemester);
    if (params.sort) url.searchParams.set('sort', params.sort);
    if (params.advancedFilter && params.advancedFilter.conditions.length > 0) {
      url.searchParams.set('advancedFilter', JSON.stringify(params.advancedFilter));
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Gagal memuat data: ${res.statusText}`);
    }
    return res.json();
  },

  async createEnrollment(form: CreateBatchKrsForm | CreateKrsForm) {
    let coursesPayload: any[] = [];

    if ('courses' in form && Array.isArray(form.courses) && form.courses.length > 0) {
      coursesPayload = form.courses.map((c) => {
        if (c.id && !c.isCustom) {
          return { id: c.id };
        }
        return {
          code: c.code.trim().toUpperCase(),
          name: c.name.trim(),
          credits: Number(c.credits)
        };
      });
    } else if ('courseCode' in form && form.courseCode) {
      coursesPayload = [
        {
          code: form.courseCode.trim().toUpperCase(),
          name: form.courseName?.trim() || '',
          credits: Number(form.credits || 3)
        }
      ];
    }

    const payload = {
      student: {
        nim: form.nim.trim(),
        name: form.studentName.trim(),
        email: form.studentEmail.trim()
      },
      academic_year: form.academicYear,
      semester: form.semester,
      status: form.status,
      courses: coursesPayload
    };

    const res = await fetch(`${API_BASE_URL}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal menyimpan KRS');
    }
    return data;
  },

  async updateEnrollment(id: string | number, updates: any) {
    const res = await fetch(`${API_BASE_URL}/enrollments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal memperbarui KRS');
    }
    return data;
  },

  async deleteEnrollment(id: string | number) {
    const res = await fetch(`${API_BASE_URL}/enrollments/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal menghapus KRS');
    }
    return data;
  },

  async getCourses(search?: string): Promise<{ success: boolean; data: CourseCatalogItem[] }> {
    const url = new URL(`${API_BASE_URL}/courses`);
    if (search && search.trim()) {
      url.searchParams.set('search', search.trim());
    }
    url.searchParams.set('limit', '100');

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error('Gagal memuat katalog mata kuliah');
    }
    return res.json();
  },

  async getStudentByNim(nim: string) {
    const res = await fetch(`${API_BASE_URL}/students/${encodeURIComponent(nim.trim())}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error('Gagal memeriksa data mahasiswa');
    }
    const data = await res.json();
    return data.data || null;
  },

  getExportUrl(params: FetchParams) {
    const url = new URL(`${API_BASE_URL}/enrollments/export`);
    if (params.search) url.searchParams.set('search', params.search);
    if (params.quickStatus && params.quickStatus !== 'ALL') url.searchParams.set('quickStatus', params.quickStatus);
    if (params.quickSemester && params.quickSemester !== 'ALL') url.searchParams.set('quickSemester', params.quickSemester);
    if (params.sort) url.searchParams.set('sort', params.sort);
    if (params.advancedFilter && params.advancedFilter.conditions.length > 0) {
      url.searchParams.set('advancedFilter', JSON.stringify(params.advancedFilter));
    }
    return url.toString();
  }
};

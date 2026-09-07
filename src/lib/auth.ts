"use client";

/**
 * Clears all authentication and session data stored in localStorage.
 */
export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('login');
    localStorage.removeItem('studentId');
    localStorage.removeItem('classId');
    localStorage.removeItem('authToken');
    localStorage.removeItem('seen_incoming_messages_count');
    localStorage.removeItem('seen_notices_count');
    localStorage.removeItem('seen_incoming_messages_count_teacher');
    localStorage.removeItem('seen_notices_count_teacher');
  } catch (e) {
    console.error('Error clearing auth session:', e);
  }
}

/**
 * Validates if the current stored session in localStorage is valid and complete.
 * @param requiredRole Optional role to check against ('student' | 'teacher' | 'admin' | 'superadmin' | 'resource_center')
 */
export function validateSession(requiredRole?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const loginDataStr = localStorage.getItem('login');
    if (!loginDataStr) return false;

    const loginData = JSON.parse(loginDataStr);
    if (!loginData || typeof loginData !== 'object' || !loginData.role) {
      return false;
    }

    if (requiredRole) {
      if (requiredRole === 'admin') {
        if (
          loginData.role !== 'admin' &&
          loginData.role !== 'superadmin' &&
          loginData.role !== 'resource_center'
        ) {
          return false;
        }
      } else if (loginData.role !== requiredRole) {
        return false;
      }
    }

    if (loginData.role === 'student') {
      const studentId = localStorage.getItem('studentId');
      const classId = localStorage.getItem('classId');
      if (!studentId || !classId) return false;
    } else if (
      loginData.role === 'teacher' ||
      loginData.role === 'admin' ||
      loginData.role === 'superadmin' ||
      loginData.role === 'resource_center'
    ) {
      if (!loginData.user_ID) return false;
    } else {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

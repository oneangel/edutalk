export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  name: string;
  lastname: string;
  email: string;
  password: string;
  type: 'student';
  grade: string;
}

export interface AuthResponse {
  message: string;
  token: string;
}
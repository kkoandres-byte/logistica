export type UserRole = 'admin' | 'coordinador' | 'conductor' | 'personal';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  fechaCreacion: string;
}

export interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
}

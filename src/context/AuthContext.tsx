import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Usuario, LoginCredentials, RegisterData, AuthState } from '../data/authTypes';

import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (usuario: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    usuario: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Escuchar cambios de estado en Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Encontrar datos extras en Firestore
        try {
          const docRef = doc(db, 'usuarios', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data() as Usuario;
            
            // Si el usuario está desactivado no lo dejamos entrar
            if (!userData.activo) {
              await signOut(auth);
              setAuthState({ usuario: null, isAuthenticated: false, isLoading: false });
              return;
            }

            setAuthState({
              usuario: userData,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            // Documento no existe (caso raro, pero por si aca cerramos)
            await signOut(auth);
            setAuthState({ usuario: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          console.error("Error cargando el rol de usuario:", error);
          setAuthState({ usuario: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        // No hay usuario logeado
        setAuthState({
          usuario: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; message?: string }> => {
    try {
      // Login estricto contra Firebase Auth
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      // El estado se actualizará automáticamente via onAuthStateChanged
      return { success: true };
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Email o contraseña incorrectos';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Las credenciales no coinciden en nuestro sistema de Firebase.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Credenciales inválidas.';
      }
      return { success: false, message: errorMessage };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; message?: string }> => {
    // Validación de dominios de correo permitidos
    const allowedDomains = ['@munifutrono.cl', '@gmail.com'];
    const emailLower = data.email.toLowerCase();
    const isValidDomain = allowedDomains.some(domain => emailLower.endsWith(domain));

    if (!isValidDomain) {
      return { 
        success: false, 
        message: 'Acceso denegado: Solo se permiten correos de @munifutrono.cl o @gmail.com' 
      };
    }

    try {
      // 1. Crear el usuario en Firebase Authentication (Email y Contraseña)
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Guardar sus datos especiales (rol, nombre, activo) en la base de datos Firestore
      const newUserProfile: Usuario = {
        id: user.uid,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        activo: true, // Siempre activo al registrarse inicialmente
        fechaCreacion: new Date().toISOString()
      };

      await setDoc(doc(db, 'usuarios', user.uid), newUserProfile);
      
      // El onAuthStateChanged manejará ponerlo en el estado general
      return { success: true };
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Error al registrar usuario';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El correo ya está siendo utilizado por otra cuenta.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil (mínimo 6 caracteres).';
      }
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  const updateUser = async (usuario: Partial<Usuario>) => {
    if (!authState.usuario) return;

    try {
      const updatedUser = { ...authState.usuario, ...usuario };
      await updateDoc(doc(db, 'usuarios', updatedUser.id), usuario);
      
      setAuthState({
        ...authState,
        usuario: updatedUser
      });
    } catch (error) {
       console.error("No se pudo actualizar la informacion en firebase:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

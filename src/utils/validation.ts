/**
 * Sistema de validación de formularios
 * Funciones utilitarias para validación de campos
 */

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'min' | 'max' | 'custom';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Valida que un campo no esté vacío
 */
export const required = (value: string | number | null | undefined, fieldName: string): ValidationError | null => {
  if (value === null || value === undefined || value === '') {
    return {
      field: fieldName,
      message: `${fieldName} es requerido`,
      type: 'required'
    };
  }
  return null;
};

/**
 * Valida que un string tenga una longitud mínima
 */
export const minLength = (value: string, min: number, fieldName: string): ValidationError | null => {
  if (value.length < min) {
    return {
      field: fieldName,
      message: `${fieldName} debe tener al menos ${min} caracteres`,
      type: 'min'
    };
  }
  return null;
};

/**
 * Valida que un string tenga una longitud máxima
 */
export const maxLength = (value: string, max: number, fieldName: string): ValidationError | null => {
  if (value.length > max) {
    return {
      field: fieldName,
      message: `${fieldName} no puede exceder ${max} caracteres`,
      type: 'max'
    };
  }
  return null;
};

/**
 * Valida formato de email
 */
export const email = (value: string, fieldName: string): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} debe ser un email válido`,
      type: 'format'
    };
  }
  return null;
};

/**
 * Valida formato de patente chilena (ABCD-12 o AB-1234)
 */
export const patente = (value: string, fieldName: string): ValidationError | null => {
  const cleaned = value.replace(/-/g, '').trim().toUpperCase();
  const patenteRegex = /^[A-Z]{4}\d{2}$|^[A-Z]{2}\d{4}$/;
  if (!patenteRegex.test(cleaned)) {
    return {
      field: fieldName,
      message: `${fieldName} debe tener formato válido (ej: ABCD-12 o AB-1234)`,
      type: 'format'
    };
  }
  return null;
};

/**
 * Valida formato de coordenadas geográficas
 */
export const coordenadas = (value: string, fieldName: string): ValidationError | null => {
  const parts = value.split(',').map(c => c.trim());
  if (parts.length !== 2) {
    return {
      field: fieldName,
      message: `${fieldName} debe tener formato "latitud, longitud"`,
      type: 'format'
    };
  }
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) {
    return {
      field: fieldName,
      message: `${fieldName} debe contener números válidos`,
      type: 'format'
    };
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      field: fieldName,
      message: `${fieldName}: latitud debe estar entre -90 y 90, longitud entre -180 y 180`,
      type: 'format'
    };
  }
  return null;
};

/**
 * Valida que un número esté dentro de un rango
 */
export const numberRange = (value: number, min: number, max: number, fieldName: string): ValidationError | null => {
  if (value < min || value > max) {
    return {
      field: fieldName,
      message: `${fieldName} debe estar entre ${min} y ${max}`,
      type: 'min'
    };
  }
  return null;
};

/**
 * Valida formato de hora (HH:MM)
 */
export const time = (value: string, fieldName: string): ValidationError | null => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} debe tener formato HH:MM`,
      type: 'format'
    };
  }
  return null;
};

/**
 * Valida que la hora de inicio sea menor a la hora de fin
 */
export const timeRange = (startTime: string, endTime: string, fieldName: string): ValidationError | null => {
  if (startTime >= endTime) {
    return {
      field: fieldName,
      message: 'La hora de inicio debe ser anterior a la hora de fin',
      type: 'custom'
    };
  }
  return null;
};

/**
 * Valida formato de teléfono chileno
 */
export const telefono = (value: string, fieldName: string): ValidationError | null => {
  const phoneRegex = /^(\+569|9)\d{8}$/;
  if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
    return {
      field: fieldName,
      message: `${fieldName} debe tener formato válido (ej: +56912345678)`,
      type: 'format'
    };
  }
  return null;
};

/**
 * Valida que un valor sea mayor o igual a otro
 */
export const minNumber = (value: number, min: number, fieldName: string): ValidationError | null => {
  if (value < min) {
    return {
      field: fieldName,
      message: `${fieldName} debe ser al menos ${min}`,
      type: 'min'
    };
  }
  return null;
};

/**
 * Valida que un valor sea menor o igual a otro
 */
export const maxNumber = (value: number, max: number, fieldName: string): ValidationError | null => {
  if (value > max) {
    return {
      field: fieldName,
      message: `${fieldName} no puede exceder ${max}`,
      type: 'max'
    };
  }
  return null;
};

/**
 * Valida una colección de errores y retorna el resultado
 */
export const validate = (...validations: (ValidationError | null)[]): ValidationResult => {
  const errors = validations.filter((v): v is ValidationError => v !== null);
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Hook personalizado para manejo de validaciones en formularios
 */
export const createFormValidator = <T extends Record<string, any>>() => {
  return {
    errors: {} as Record<keyof T, string>,
    touched: {} as Record<keyof T, boolean>,

    setTouched: (_field: keyof T) => {
      return { touched: true };
    },

    hasError: (_field: keyof T) => {
      return false; // Será implementado en el componente
    },

    getError: (_field: keyof T) => {
      return ''; // Será implementado en el componente
    }
  };
};

/**
 * Formatea un campo para mostrarlo en mensajes de error
 */
export const formatFieldName = (field: string): string => {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

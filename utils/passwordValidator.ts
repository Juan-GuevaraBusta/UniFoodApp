export interface PasswordValidation {
    isValid: boolean;
    errors: string[];
    requirements: {
        minLength: boolean;
        hasUppercase: boolean;
        hasLowercase: boolean;
        hasNumber: boolean;
        hasSpecialChar: boolean;
    };
}

export const validatePassword = (password: string): PasswordValidation => {
    const requirements = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const errors: string[] = [];

    if (!requirements.minLength) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    if (!requirements.hasUppercase) {
        errors.push('Debe contener al menos una letra mayúscula');
    }
    if (!requirements.hasLowercase) {
        errors.push('Debe contener al menos una letra minúscula');
    }
    if (!requirements.hasNumber) {
        errors.push('Debe contener al menos un número');
    }
    if (!requirements.hasSpecialChar) {
        errors.push('Debe contener al menos un carácter especial');
    }

    return {
        isValid: errors.length === 0,
        errors,
        requirements,
    };
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    const validation = validatePassword(password);
    const validCount = Object.values(validation.requirements).filter(Boolean).length;

    if (validCount <= 2) return 'weak';
    if (validCount <= 4) return 'medium';
    return 'strong';
  };
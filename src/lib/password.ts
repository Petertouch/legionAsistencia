// Política de contraseñas centralizada para el staff (tabla `equipo`) y resets.
// Se aplica al CREAR o CAMBIAR una contraseña; no afecta a las ya existentes.

export const PASSWORD_MIN = 10;

// Devuelve un mensaje de error si la contraseña no cumple, o null si es válida.
export function validatePassword(pw: unknown): string | null {
  if (typeof pw !== "string" || pw.length === 0) return "La contraseña es requerida";
  if (pw.length < PASSWORD_MIN) return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  if (!/[a-zA-Z]/.test(pw)) return "La contraseña debe incluir al menos una letra";
  if (!/[0-9]/.test(pw)) return "La contraseña debe incluir al menos un número";
  return null;
}

import "server-only";

// Throttle de inicio de sesión por usuario (defensa básica contra fuerza bruta).
// Nota: es en memoria por instancia del servidor. En producción a gran escala
// conviene respaldarlo en un store durable (Redis/Upstash); para el demo,
// frena ráfagas de intentos en una misma instancia.

const VENTANA_MS = 15 * 60 * 1000; // 15 minutos
const MAX_INTENTOS = 8;

type Registro = { fallos: number[] };
const memoria = new Map<string, Registro>();

function limpiar(ahora: number, reg: Registro) {
  reg.fallos = reg.fallos.filter((t) => ahora - t < VENTANA_MS);
}

/** ¿Está bloqueado este usuario por demasiados intentos fallidos? */
export function loginBloqueado(username: string): { bloqueado: boolean; minutos: number } {
  const reg = memoria.get(username);
  if (!reg) return { bloqueado: false, minutos: 0 };
  const ahora = Date.now();
  limpiar(ahora, reg);
  if (reg.fallos.length < MAX_INTENTOS) return { bloqueado: false, minutos: 0 };
  const masAntiguo = reg.fallos[0];
  const restante = VENTANA_MS - (ahora - masAntiguo);
  return { bloqueado: true, minutos: Math.max(1, Math.ceil(restante / 60000)) };
}

/** Registra un intento fallido. */
export function registrarFallo(username: string) {
  const ahora = Date.now();
  const reg = memoria.get(username) ?? { fallos: [] };
  limpiar(ahora, reg);
  reg.fallos.push(ahora);
  memoria.set(username, reg);
  // Poda defensiva del mapa para no crecer sin límite.
  if (memoria.size > 5000) {
    for (const [k, v] of memoria) {
      limpiar(ahora, v);
      if (v.fallos.length === 0) memoria.delete(k);
    }
  }
}

/** Limpia el contador tras un login exitoso. */
export function limpiarThrottle(username: string) {
  memoria.delete(username);
}

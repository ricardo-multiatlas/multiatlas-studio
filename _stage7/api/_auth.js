/* Multiatlas Studio — verificación de sesión Clerk en el servidor.
 * El frontend manda el token de Clerk en `Authorization: Bearer <token>`.
 * Devuelve el userId de Clerk (user_...) o null si no hay sesión válida.
 * CLERK_SECRET_KEY va SOLO en variables de entorno, nunca en el cliente. */
import { verifyToken } from "@clerk/backend";

export async function getUserId(req) {
  try {
    const h = req.headers.authorization || req.headers.Authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token || !process.env.CLERK_SECRET_KEY) return null;
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    return payload && payload.sub ? payload.sub : null;
  } catch (_) {
    return null;
  }
}

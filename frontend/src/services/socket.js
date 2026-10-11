import { io } from "socket.io-client";

/** Uses Vite dev proxy to backend; in production serve app behind same origin as API or set VITE_SOCKET_URL */
export function connectSocket(token) {
  if (!token) return null;
  const url = import.meta.env.VITE_SOCKET_URL || undefined;
  return io(url, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token },
  });
}

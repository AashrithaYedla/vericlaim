let ioRef = null;

export function setIO(io) {
  ioRef = io;
}

export function getIO() {
  return ioRef;
}

export function emitToUser(userId, event, payload) {
  if (!ioRef || !userId) return;
  ioRef.to(`user:${userId}`).emit(event, payload);
}

export function emitToComplaint(complaintId, event, payload) {
  if (!ioRef || !complaintId) return;
  ioRef.to(`complaint:${complaintId}`).emit(event, payload);
}

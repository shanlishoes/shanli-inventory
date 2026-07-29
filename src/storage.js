const STORAGE_KEY = "shanli_inventory_sessions";
const OFFLINE_QUEUE_KEY = "shanli_offline_queue";
/**
 * همه شمارش‌ها
 */
export function getSessions() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * ذخیره همه شمارش‌ها
 */
export function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * ایجاد شمارش جدید
 */
export function createSession(session) {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
}

/**
 * آخرین شمارش باز برای یک انباردار
 */
export function getOpenSession() {
  const sessions = getSessions();

  return sessions.find(
    s => s.status === "open"
  ) || null;
}

/**
 * بروزرسانی یک شمارش
 */
export function updateSession(updatedSession) {
  const sessions = getSessions();

  const index = sessions.findIndex(s => s.id === updatedSession.id);

  if (index !== -1) {
    sessions[index] = updatedSession;
    saveSessions(sessions);
  }
}

/**
 * بستن شمارش
 */
export function closeSession(id) {

  const sessions = getSessions();

  const index = sessions.findIndex(s => s.id === id);

  if (index !== -1) {

    sessions[index].status = "closed";
    sessions[index].endTime = new Date().toISOString();

    saveSessions(sessions);

  }

}

/**
 * حذف همه اطلاعات (فقط برای تست)
 */
export function clearAllSessions() {
  localStorage.removeItem(STORAGE_KEY);
}
// ===== Offline Queue =====

export function getOfflineQueue() {
  return JSON.parse(
    localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]"
  );
}

export function saveOfflineQueue(queue) {
  localStorage.setItem(
    OFFLINE_QUEUE_KEY,
    JSON.stringify(queue)
  );
}

export function addOfflineItem(item) {
  const queue = getOfflineQueue();

  queue.push(item);

  saveOfflineQueue(queue);
}

export function removeOfflineItem(index = 0) {
  const queue = getOfflineQueue();

  queue.splice(index, 1);

  saveOfflineQueue(queue);
}

export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export function offlineCount() {
  return getOfflineQueue().length;
}
const KEY = "shanli_offline_queue";

export function getQueue() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function saveQueue(queue) {
  localStorage.setItem(KEY, JSON.stringify(queue));
}

export function addToQueue(item) {
  const queue = getQueue();
  queue.push(item);
  saveQueue(queue);
}

export function removeFirst() {
  const queue = getQueue();

  queue.shift();

  saveQueue(queue);
}

export function queueCount() {
  return getQueue().length;
}

export function clearQueue() {
  localStorage.removeItem(KEY);
}

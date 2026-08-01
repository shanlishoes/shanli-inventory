import { sendToGoogle } from "./api";
import {
addOfflineItem,
getOfflineQueue,
removeOfflineItem
} from "./storage";

export async function syncItem(session, barcode, qty, itemId) {

const item = {

itemId,

sessionId: session.id,

time: new Date().toLocaleString("fa-IR"),

branch: session.branch,

user: session.user,

supervisor: session.supervisor,

barcode,

qty: Number(qty)

};

// اگر اینترنت قطع بود
if (!navigator.onLine) {

addOfflineItem(item);

return false;

}

try {

const result = await sendToGoogle(item);

if (result.success) {

return true;

}

addOfflineItem(item);

return false;

} catch (e) {

addOfflineItem(item);

return false;

}

}

let isSyncing = false;

export async function syncPending() {

if (!navigator.onLine) return;

// جلوگیری از اجرای همزمان چند syncPending که باعث ارسال تکراری می‌شود
if (isSyncing) return;

isSyncing = true;

try {

let queue = getOfflineQueue();

while (queue.length > 0) {

const item = queue[0];

try {

const result = await sendToGoogle(item);

if (result.success) {

removeOfflineItem(0);
queue = getOfflineQueue();

// بروزرسانی لحظه‌ای تعداد
window.dispatchEvent(new Event("queueChanged"));

} else {

break;

}

} catch {

break;

}

}

} finally {

isSyncing = false;

}

}
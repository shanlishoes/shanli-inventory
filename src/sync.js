import { sendToGoogle } from "./api";
import {
  addOfflineItem,
  getOfflineQueue,
  removeOfflineItem
} from "./storage";

export async function syncItem(session, barcode, qty) {

  const item = {

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

    addToQueue(item);

    return false;

  } catch (e) {

    addToQueue(item);

    return false;

  }

}

export async function syncPending() {

  if (!navigator.onLine) return;

 let queue = getOfflineQueue();

while (queue.length > 0) {

  const item = queue[0];

    try {

      const result = await sendToGoogle(item);

      if (result.success) {

        removeOfflineItem(0);
        queue = getOfflineQueue();

      } else {

        break;

      }

    } catch {

      break;

    }

  }

}
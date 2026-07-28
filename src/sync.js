import { sendToGoogle } from "./api";
import {
  addToQueue,
  getQueue,
  removeFirst
} from "./offline";

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

    addToQueue(item);

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

  while (getQueue().length > 0) {

    const item = getQueue()[0];

    try {

      const result = await sendToGoogle(item);

      if (result.success) {

        removeFirst();

      } else {

        break;

      }

    } catch {

      break;

    }

  }

}
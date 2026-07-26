import { sendToGoogle } from "./api";

export async function syncItem(session, barcode, qty) {

  const result = await sendToGoogle({

    sessionId: session.id,

    time: new Date().toLocaleString("fa-IR"),

    branch: session.branch,

    user: session.user,

    supervisor: session.supervisor,

    barcode: barcode,

    qty: Number(qty)

  });

  return result.success === true;

}
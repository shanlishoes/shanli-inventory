import {
  createSession,
  getOpenSession,
  updateSession,
  closeSession
} from "./storage";

export function startNewSession(user, supervisor, branch) {

  const open = getOpenSession();

  if (open) {
    closeSession(open.id);
  }

  const session = {
    id: "INV-" + Date.now(),

    user,
    supervisor,
    branch,

    startTime: new Date().toISOString(),
    endTime: null,

    status: "open",

    count: 0,

    items: []
  };

  createSession(session);

  return session;

}

export function continueSession() {

  return getOpenSession();

}

export function addItem(barcode, qty) {

  const session = getOpenSession();

  if (!session) return null;

  session.items.push({

    barcode,
    qty,

    time: new Date().toISOString(),

    synced: false

  });

  session.count++;

  updateSession(session);

  return session;

}

export function finishSession() {

  const session = getOpenSession();

  if (!session) return;

  closeSession(session.id);

}
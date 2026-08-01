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

const itemId =
"IT" + Date.now() + "" + Math.floor(Math.random() * 1000);

session.items.push({

itemId,

barcode,
qty,

time: new Date().toISOString(),

synced: false

});

session.count++;

updateSession(session);

return { ...session, itemId };

}

export function removeItem(itemId) {

const session = getOpenSession();

if (!session) return null;

const index = session.items.findIndex(
item => item.itemId === itemId
);

if (index === -1) return null;

const removed = session.items[index];

session.items.splice(index, 1);

session.count = Math.max(0, session.count - 1);

updateSession(session);

return { session, removed };

}

export function updateItemQty(itemId, newQty) {

const session = getOpenSession();

if (!session) return null;

const item = session.items.find(
it => it.itemId === itemId
);

if (!item) return null;

const oldQty = item.qty;

item.qty = newQty;

updateSession(session);

return {
session,
barcode: item.barcode,
oldQty,
newQty
};

}

export function finishSession() {

const session = getOpenSession();

if (!session) return;

closeSession(session.id);

}
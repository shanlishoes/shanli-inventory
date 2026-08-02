const API_URL =
  "https://script.google.com/macros/s/AKfycbzvpGuv7smZKleGDjhHvIh-bM86Mc4eqre8g57WMQC5rzuHuMwyrUMAXJR4YPTg6nZEQA/exec";

async function request(data) {

  try {

    const response = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(data)
    });

    return await response.json();

  } catch (err) {

    console.error(err);

    return {
      success: false
    };

  }

}

export async function startSessionApi(data) {

  return await request({
    action: "startSession",
    ...data
  });

}

export async function sendToGoogle(data) {

  return await request({
    action: "saveItem",
    ...data
  });

}

export async function finishSessionApi(sessionId) {

  return await request({

    action: "finishSession",

    sessionId,

    end: new Date().toLocaleString("fa-IR")

  });

}

export async function getSummary(barcode) {

  return await request({

    action: "getSummary",

    barcode

  });

}

export async function getOpenSession(user) {

  return await request({

    action: "getOpenSession",

    user

  });

}

export async function login(name, password) {

  return await request({

    action: "login",

    name,

    password

  });

}

export async function register(name, password) {

  return await request({

    action: "register",

    name,

    password

  });

}

export async function deleteItemApi(itemId, sessionId, barcode, qty) {

  return await request({

    action: "deleteItem",

    itemId,

    sessionId,

    barcode,

    qty

  });

}

export async function updateItemApi(itemId, sessionId, barcode, oldQty, newQty) {

  return await request({

    action: "updateItem",

    itemId,

    sessionId,

    barcode,

    oldQty,

    newQty

  });

}

export async function getUsers() {

  return await request({

    action: "getUsers"

  });

}

export async function getSessions() {

  return await request({

    action: "getSessions"

  });

}

export async function getSessionItems(sessionId) {

  return await request({

    action: "getSessionItems",

    sessionId

  });

}

export async function updateUserApi(id, { status, role, active, password } = {}) {

  return await request({

    action: "updateUser",

    id,

    status,

    role,

    active,

    password

  });

}

export async function heartbeat(sessionId) {

  return await request({

    action: "heartbeat",

    sessionId

  });

}

export async function forceFinishSessionApi(sessionId) {

  return await request({

    action: "forceFinishSession",

    sessionId

  });

}
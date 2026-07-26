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
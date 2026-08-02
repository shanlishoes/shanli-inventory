import "./style.css";

import { startScanner } from "./scanner";
import { offlineCount } from "./storage";
import {
  startNewSession,
  continueSession,
  finishSession,
  addItem,
  removeItem,
  updateItemQty
} from "./session";

import {
  startSessionApi,
  finishSessionApi,
  getSummary,
  login,
  register,
  deleteItemApi,
  updateItemApi,
  getUsers,
  getSessions,
  getSessionItems,
  updateUserApi
} from "./api";

import { syncItem, syncPending } from "./sync";
const summaryCache = {};
const beep = new Audio("/sounds/beep.mp3");
const history = [];
let session = null;
let qty = 1;
let count = 0;
let lastSavedBarcode = null;
let lastSavedTime = 0;

// ===========================
// کش لیست کاربران برای ورود آنی
// ===========================

let usersCache = [];

async function refreshUsersCache() {
  try {
    const result = await getUsers();
    if (result && result.success) {
      usersCache = result.users;
    }
  } catch (err) {
    console.error("خطا در دریافت لیست کاربران:", err);
  }
}

refreshUsersCache();

function updateSyncStatus() {

  const status = document.getElementById("syncStatus");

  if (!status) return;

  if (navigator.onLine) {

    status.innerText =
      `🟢 آنلاین | در انتظار ارسال: ${offlineCount()}`;

  } else {

    status.innerText =
      `🔴 آفلاین | در انتظار ارسال: ${offlineCount()}`;

  }

}

// وقتی اینترنت وصل شد، صف آفلاین ارسال شود
window.addEventListener("online", async () => {
  console.log("🟢 اینترنت وصل شد، شروع همگام‌سازی...");
  await syncPending();
  updateSyncStatus();
});

// هنگام باز شدن برنامه هم اگر اینترنت وصل بود، ارسال انجام شود
window.addEventListener("load", async () => {
  if (navigator.onLine) {
    await syncPending();
    updateSyncStatus();
  }
});
window.addEventListener("queueChanged", updateSyncStatus);
window.dispatchEvent(new Event("queueChanged"));
document.querySelector("#app").innerHTML = `

<div class="container">

<div id="authPage">

<div class="card">

<h1>📦 انبارگردانی شانلی</h1>

<input id="authUser" placeholder="نام و نام خانوادگی">

<input id="authPass" type="password" placeholder="رمز عبور">

<select id="authSupervisor">
<option value="">انتخاب ناظر</option>
<option>حسین علیزاده</option>
<option>احد رمضان زاده</option>
</select>

<div class="auth-buttons">
<button id="loginBtn">ورود</button>
<button id="registerPageBtn">ثبت نام</button>
</div>

</div>
<div class="creator">
Engineered by Hossein Alizadeh.ACC
</div>
</div>

<div id="registerPage" style="display:none;">

<div class="card">

<h1>📦 ثبت‌نام کاربر جدید</h1>

<input id="regUser" placeholder="نام و نام خانوادگی">

<input id="regPass" type="password" placeholder="رمز عبور">

<input id="regPass2" type="password" placeholder="تکرار رمز عبور">

<div class="auth-buttons">
<button id="registerBtn">ثبت نام</button>
<button id="backToLoginBtn">بازگشت</button>
</div>

</div>
<div class="creator">
Engineered by Hossein Alizadeh.ACC
</div>
</div>

<div id="loginPage" style="display:none;">

<div class="card">

<h1>📦 انبارگردانی شانلی</h1>

<div id="welcomeUser" style="text-align:center; margin-bottom:16px; font-size:18px; color:#14214d; font-weight:bold;"></div>

<select id="branch">
<option>انبار مرکزی</option>
<option>شعبه شوط</option>
<option>شعبه ارومیه</option>
</select>

<button id="startBtn">
شروع انبارگردانی
</button>

<button id="logoutBtn" style="margin-top:10px;width:100%;height:48px;border:none;border-radius:14px;background:#e5e7eb;color:#111827;font-size:16px;font-weight:bold;cursor:pointer;">
خروج از حساب
</button>

<button id="archiveBtn" style="display:none;margin-top:10px;width:100%;height:48px;border:none;border-radius:14px;background:#eef2ff;color:#3730a3;font-size:16px;font-weight:bold;cursor:pointer;">
📁 بایگانی انبارگردانی‌ها
</button>

<button id="adminBtn" style="display:none;margin-top:10px;width:100%;height:48px;border:none;border-radius:14px;background:#fef3c7;color:#92400e;font-size:16px;font-weight:bold;cursor:pointer;">
⚙️ پنل مدیریت کاربران
</button>
</div>
<div class="creator">
Engineered by Hossein Alizadeh.ACC
</div>
</div>

<div id="adminPage" style="display:none;">

<div class="card">

<h1>⚙️ مدیریت کاربران</h1>

<div id="adminList"></div>

<button id="adminBackBtn" style="margin-top:14px;width:100%;height:48px;border:none;border-radius:14px;background:#e5e7eb;color:#111827;font-size:16px;font-weight:bold;cursor:pointer;">
بازگشت
</button>

</div>
<div class="creator">
Engineered by Hossein Alizadeh.ACC
</div>
</div>

<div id="archivePage" style="display:none;">

<div class="card">

<h1>📁 بایگانی انبارگردانی‌ها</h1>

<div id="archiveList"></div>

<button id="archiveBackBtn" style="margin-top:14px;width:100%;height:48px;border:none;border-radius:14px;background:#e5e7eb;color:#111827;font-size:16px;font-weight:bold;cursor:pointer;">
بازگشت
</button>

</div>
<div class="creator">
Engineered by Hossein Alizadeh.ACC
</div>
</div>

<div id="resumeModal" class="modal" style="display:none;">
  <div class="modalBox">
    <h3>انبارگردانی باز پیدا شد</h3>
    <p>می‌خواهید ادامه دهید یا انبارگردانی جدید شروع شود؟</p>

    <button id="continueBtn" class="modalBtn">
      ▶ ادامه انبارگردانی قبلی
    </button>

    <button id="newBtn" class="modalBtn danger">
      🆕 شروع انبارگردانی جدید
    </button>
  </div>
</div>

<div id="scanPage" style="display:none">

<div class="topBar">

    <div class="infoItem">
        <div class="infoLabel">🏢 شعبه</div>
        <div id="branchName" class="infoValue"></div>
    </div>

    <div class="infoItem" style="text-align:left">
        <div class="infoLabel">📦 ثبت شده</div>
        <div id="count" class="infoValue countValue">0</div>
   
    
</div>
</div>
       <div id="syncStatus" class="syncStatus">
       🟢 آنلاین | در انتظار ارسال: 0
    </div>

<div class="qtyCard">

    <div class="qtyTitle">
        تعداد
    </div>

    <div class="qtyRow">

    <button id="minus">−</button>

    <input
    id="qty"
    type="number"
    value="1"
    min="1"
    inputmode="numeric">

    <button id="plus">+</button>

</div>

</div>

<div class="lastQty">

    <div id="lastQty">

        اولین ثبت این بارکد

    </div>

    <div id="lastBarcode">

        آخرین بارکد : ـــــ

    </div>

</div>
<input
id="barcode"
type="text"
readonly
placeholder="بارکد را وارد کنید">

<div id="keypad">

<button class="num">3</button>
<button class="num">2</button>
<button class="num">1</button>

<button class="num">6</button>
<button class="num">5</button>
<button class="num">4</button>

<button class="num">9</button>
<button class="num">8</button>
<button class="num">7</button>

<button id="clear">پاک</button>

<button class="num">0</button>

<button id="back">⌫</button>

</div>

<div class="buttons">

<button id="saveBtn">
ثبت
</button>

<button id="finishBtn">
پایان انبارگردانی
</button>

</div>
<div class="historyCard">

  <div class="historyTitle">
    آخرین ثبت‌ها
  </div>

  <div id="historyList">
    <div class="historyEmpty">
      هنوز چیزی ثبت نشده است
    </div>
  </div>

</div>
</div>

</div>

`;


// ===========================
// مدیریت ورود / ثبت‌نام (Auth)
// ===========================

const AUTH_KEY = "shanli_auth";

function getAuth() {
  const raw = sessionStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setAuth(auth) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function clearAuth() {
  sessionStorage.removeItem(AUTH_KEY);
}

// ===========================
// قفل نشدن صفحه هنگام شمارش
// ===========================

let wakeLock = null;

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (err) {
    console.error("عدم امکان فعال‌سازی قفل نشدن صفحه:", err);
  }
}

async function releaseWakeLock() {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    await requestWakeLock();
  }
});

function showPage(id) {
  ["authPage", "registerPage", "loginPage", "archivePage", "adminPage", "scanPage"].forEach(pid => {
    const el = document.getElementById(pid);
    if (el) el.style.display = pid === id ? "block" : "none";
  });
}

// اگر قبلاً وارد شده، مستقیم برو صفحه انتخاب شعبه
const existingAuth = getAuth();

if (existingAuth) {
  document.getElementById("welcomeUser").innerText =
    "خوش آمدید، " + existingAuth.name;
  toggleAdminButton(existingAuth.role);
  showPage("loginPage");
} else {
  showPage("authPage");
}

function toggleAdminButton(role) {
  const adminBtnEl = document.getElementById("adminBtn");
  if (adminBtnEl) adminBtnEl.style.display = (role === "مدیر") ? "block" : "none";

  const archiveBtnEl = document.getElementById("archiveBtn");
  if (archiveBtnEl) archiveBtnEl.style.display = (role === "مدیر") ? "block" : "none";
}

document.getElementById("registerPageBtn").onclick = () => {
  showPage("registerPage");
};

document.getElementById("backToLoginBtn").onclick = () => {
  showPage("authPage");
  refreshUsersCache();
};

document.getElementById("registerBtn").onclick = () => {

  const name = document.getElementById("regUser").value.trim();
  const pass = document.getElementById("regPass").value;
  const pass2 = document.getElementById("regPass2").value;

  if (!name || !pass) {
    alert("نام و نام خانوادگی و رمز عبور را وارد کنید");
    return;
  }

  if (pass !== pass2) {
    alert("رمز عبور و تکرار آن یکسان نیستند");
    return;
  }

  // بلافاصله به کاربر پیام بده و برگرد به صفحه ورود
  alert("ثبت‌نام شما انجام شد. لطفاً منتظر تایید مدیر بمانید.");

  document.getElementById("regUser").value = "";
  document.getElementById("regPass").value = "";
  document.getElementById("regPass2").value = "";

  showPage("authPage");

  // ارسال واقعی در پس‌زمینه
  register(name, pass).then(result => {

    if (!result.success) {
      alert(
        "ثبت‌نام «" + name + "» انجام نشد: " +
        (result.message || "خطای نامشخص. دوباره تلاش کنید.")
      );
    }

  }).catch(() => {
    alert("ثبت‌نام «" + name + "» به دلیل قطعی ارتباط انجام نشد. دوباره تلاش کنید.");
  });

};

document.getElementById("loginBtn").onclick = () => {

  const name = document.getElementById("authUser").value.trim();
  const pass = document.getElementById("authPass").value;
  const supervisor = document.getElementById("authSupervisor").value.trim();

  if (!name || !pass) {
    alert("نام و نام خانوادگی و رمز عبور را وارد کنید");
    return;
  }

  if (!supervisor) {
    alert("لطفاً نام ناظر را انتخاب کنید");
    return;
  }

  // اطلاعات کاربران از قبل (هنگام لود صفحه) دریافت شده، پس فوراً بررسی می‌کنیم
  const match = usersCache.find(
    u => u.name === name && String(u.password) === pass
  );

  if (!match) {

    // شاید کاربر همین الان ثبت‌نام کرده و کش هنوز به‌روز نشده - یک بار دیگر تلاش کن
    alert("نام و نام خانوادگی یا رمز عبور اشتباه است");
    refreshUsersCache();
    return;

  }

  if (match.status === "عدم تایید") {
    alert("عضویت شما تایید نشد. با مدیر تماس بگیرید.");
    return;
  }

  if (match.status !== "تایید شده") {
    alert("عضویت شما هنوز تایید نشده است.");
    return;
  }

  setAuth({
    id: match.id,
    name: match.name,
    role: match.role,
    supervisor
  });

  document.getElementById("welcomeUser").innerText =
    "خوش آمدید، " + match.name;

  toggleAdminButton(match.role);

  showPage("loginPage");

  // ثبت زمان ورود در گوگل‌شیت، در پس‌زمینه (بدون انتظار کاربر)
  login(name, pass).catch(console.error);

};

document.getElementById("logoutBtn").onclick = () => {
  clearAuth();
  location.reload();
};

// ===========================
// بایگانی انبارگردانی‌ها
// ===========================

let archiveSessions = [];

document.getElementById("archiveBtn").onclick = () => {
  showPage("archivePage");
  loadArchiveList();
};

document.getElementById("archiveBackBtn").onclick = () => {
  showPage("loginPage");
};

// ===========================
// پنل مدیریت کاربران (فقط برای نقش «مدیر»)
// ===========================

const STATUS_OPTIONS = ["در انتظار تایید", "تایید شده", "عدم تایید"];
const ACTIVE_OPTIONS = ["فعال", "غیرفعال"];

document.getElementById("adminBtn").onclick = () => {
  showPage("adminPage");
  loadAdminUsers();
};

document.getElementById("adminBackBtn").onclick = () => {
  showPage("loginPage");
};

async function loadAdminUsers() {

  const container = document.getElementById("adminList");
  container.innerHTML = `<div class="historyEmpty">در حال بارگذاری...</div>`;

  const result = await getUsers();

  if (!result || !result.success) {
    container.innerHTML = `<div class="historyEmpty">خطا در دریافت لیست کاربران</div>`;
    return;
  }

  const list = result.users || [];

  if (list.length === 0) {
    container.innerHTML = `<div class="historyEmpty">کاربری ثبت نشده است</div>`;
    return;
  }

  container.innerHTML = list.map((u, idx) => `
    <div class="archiveItem" data-index="${idx}">
      <div class="archiveItemTitle">${u.name}</div>

      <div class="adminRow">
        <label>وضعیت</label>
        <select class="adminStatus" data-id="${u.id}">
          ${STATUS_OPTIONS.map(opt =>
            `<option value="${opt}" ${opt === u.status ? "selected" : ""}>${opt}</option>`
          ).join("")}
        </select>
      </div>

      <div class="adminRow">
        <label>نقش</label>
        <input class="adminRole" data-id="${u.id}" value="${u.role || ""}" placeholder="مثلاً: مدیر، انباردار">
      </div>

      <button class="adminSaveBtn" data-id="${u.id}">ذخیره</button>

    </div>`
  ).join("");

  document.querySelectorAll(".adminSaveBtn").forEach(btn => {
    btn.onclick = () => saveAdminUser(btn.dataset.id);
  });

}

async function saveAdminUser(id) {

  const statusEl = document.querySelector(`.adminStatus[data-id="${id}"]`);
  const roleEl = document.querySelector(`.adminRole[data-id="${id}"]`);

  const status = statusEl ? statusEl.value : undefined;
  const role = roleEl ? roleEl.value.trim() : undefined;

  const result = await updateUserApi(id, { status, role });

  if (result && result.success) {
    alert("ذخیره شد");
    refreshUsersCache();
  } else {
    alert("خطا در ذخیره‌سازی");
  }

}

async function loadArchiveList() {

  const container = document.getElementById("archiveList");
  container.innerHTML = `<div class="historyEmpty">در حال بارگذاری...</div>`;

  const result = await getSessions();

  if (!result || !result.success) {
    container.innerHTML = `<div class="historyEmpty">خطا در دریافت اطلاعات</div>`;
    return;
  }

  archiveSessions = result.sessions || [];

  if (archiveSessions.length === 0) {
    container.innerHTML = `<div class="historyEmpty">هنوز انبارگردانی‌ای ثبت نشده است</div>`;
    return;
  }

  container.innerHTML = archiveSessions.map((s, idx) => `
    <div class="archiveItem" data-index="${idx}">
      <div class="archiveItemTitle">${s.branch} — ${s.user}</div>
      <div class="archiveItemMeta">ناظر: ${s.supervisor || "—"} | تعداد: ${s.count} | ${s.status}</div>
      <div class="archiveItemMeta">شروع: ${s.start} | پایان: ${s.end || "—"}</div>
    </div>`
  ).join("");

  document.querySelectorAll(".archiveItem").forEach(el => {
    el.onclick = () => showArchiveDetail(archiveSessions[Number(el.dataset.index)]);
  });

}

async function showArchiveDetail(sess) {

  const container = document.getElementById("archiveList");
  container.innerHTML = `<div class="historyEmpty">در حال بارگذاری اقلام...</div>`;

  const result = await getSessionItems(sess.id);

  if (!result || !result.success) {
    container.innerHTML = `<div class="historyEmpty">خطا در دریافت اقلام</div>`;
    return;
  }

  const items = result.items || [];

  let html = `<button id="archiveDetailBack" style="margin-bottom:12px;width:100%;height:40px;border:none;border-radius:10px;background:#e5e7eb;color:#111827;font-weight:bold;cursor:pointer;">⬅ بازگشت به لیست</button>`;

  html += `<div class="archiveItemTitle">${sess.branch} — ${sess.user}</div>`;
  html += `<div class="archiveItemMeta">ناظر: ${sess.supervisor || "—"} | تعداد کل: ${sess.count}</div>`;

  if (items.length === 0) {
    html += `<div class="historyEmpty">آیتمی ثبت نشده</div>`;
  } else {
    html += items.map(it => `
      <div class="historyItem">
        <span>${it.qty} × ${it.barcode}</span>
        <span style="font-size:12px;color:#888;">${it.time}</span>
      </div>`
    ).join("");
  }

  container.innerHTML = html;

  document.getElementById("archiveDetailBack").onclick = loadArchiveList;

}

document.getElementById("startBtn").onclick = async () => {

  const auth = getAuth();

  if (!auth) {
    alert("لطفاً ابتدا وارد شوید");
    showPage("authPage");
    return;
  }

  const user = auth.name;

  const supervisor = auth.supervisor || "";

  const branch =
    document.getElementById("branch").value;


session = continueSession();

if (
  session &&
  session.user.trim() === user.trim() &&
  session.status === "open"
) {

  document.getElementById("resumeModal").style.display = "flex";

  await new Promise(resolve => {

    document.getElementById("continueBtn").onclick = () => {

      document.getElementById("resumeModal").style.display = "none";

      restoreHistoryFromSession(session);

      resolve();

    };

    document.getElementById("newBtn").onclick = async () => {

      // فوراً در برنامه انبارگردانی قبلی را ببند
finishSession();

session = startNewSession(
  user,
  supervisor,
  branch
);

// ارسال به گوگل در پس‌زمینه
finishSessionApi(session.id)
  .catch(console.error);

      document.getElementById("resumeModal").style.display = "none";

      resolve();

    };

  });

} else {

  session = startNewSession(
    user,
    supervisor,
    branch
  );

}


  startSessionApi({
  start: new Date().toLocaleString("fa-IR"),
  branch,
  user,
  supervisor
}).then(result => {
  if (result.success && result.sessionId) {
    session.id = result.sessionId;
  }
});



  document.getElementById("loginPage")
  .style.display = "none";


  document.getElementById("scanPage")
  .style.display = "block";


  requestWakeLock();


  document.getElementById("branchName")
  .innerText = branch;




updateSyncStatus();
window.addEventListener("online", updateSyncStatus);
window.addEventListener("offline", updateSyncStatus);
updateSyncStatus();
};
function handleScan(code) {

  document.getElementById("lastBarcode").innerText =
"آخرین بارکد: " + code;

document.getElementById("lastQty").innerText =
"✓ ثبت شد";
  document.getElementById("barcode").value = code;


  const qtyInput =
    document.getElementById("qty");

  qtyInput.focus();

  qtyInput.select();


  


  showPreviousQty(code);

}



let previousQtyTimer = null;

function queueShowPreviousQty(code) {
  clearTimeout(previousQtyTimer);
  previousQtyTimer = setTimeout(() => showPreviousQty(code), 250);
}

async function showPreviousQty(code) {

  if (summaryCache[code] !== undefined) {
    document.getElementById("lastQty").innerText =
      "قبلاً ثبت شده: " + summaryCache[code] + " عدد";
    return;
  }

  const result = await getSummary(code);

  if (result && result.success) {

    summaryCache[code] = result.qty;

    document.getElementById("lastQty").innerText =
      "قبلاً ثبت شده: " + result.qty + " عدد";

  } else {

    summaryCache[code] = 0;

    document.getElementById("lastQty").innerText =
      "اولین ثبت این بارکد";

  }
}

function renderHistory() {

  const list = document.getElementById("historyList");

  if (history.length === 0) {
    list.innerHTML =
      `<div class="historyEmpty">هنوز چیزی ثبت نشده است</div>`;
    return;
  }

  list.innerHTML = history.map(item => `
    <div class="historyItem">
      <span> ${item.qty} × ${item.barcode} </span>
      <span class="historyBtns">
        <button class="editHistoryBtn" data-itemid="${item.itemId}">✏️ ویرایش</button>
        <button class="deleteHistoryBtn" data-itemid="${item.itemId}">🗑 حذف</button>
      </span>
    </div>`
  ).join("");

  document.querySelectorAll(".deleteHistoryBtn").forEach(btn => {
    btn.onclick = () => deleteHistoryItem(btn.dataset.itemid);
  });

  document.querySelectorAll(".editHistoryBtn").forEach(btn => {
    btn.onclick = () => editHistoryItem(btn.dataset.itemid);
  });

}

function addHistory(barcode, qty, itemId) {

  history.unshift({
    itemId,
    barcode,
    qty
  });

  if (history.length > 5) {
    history.pop();
  }

  renderHistory();

}

function restoreHistoryFromSession(sess) {

  history.length = 0;

  const items = sess.items || [];

  items.slice(-5).reverse().forEach(item => {
    history.push({
      itemId: item.itemId,
      barcode: item.barcode,
      qty: item.qty
    });
  });

  renderHistory();

  count = sess.count || 0;

  const countEl = document.getElementById("count");
  if (countEl) countEl.innerText = count;

}

async function deleteHistoryItem(itemId) {

  const answer = confirm("این ثبت حذف شود؟");

  if (!answer) return;

  const result = removeItem(itemId);

  if (!result) {
    alert("این مورد پیدا نشد");
    return;
  }

  const idx = history.findIndex(h => h.itemId === itemId);

  if (idx !== -1) {
    history.splice(idx, 1);
  }

  renderHistory();

  count = result.session.count;

  const countEl = document.getElementById("count");
  if (countEl) countEl.innerText = count;

  const removed = result.removed;

  if (summaryCache[removed.barcode] !== undefined) {
    summaryCache[removed.barcode] =
      Math.max(0, summaryCache[removed.barcode] - Number(removed.qty));
  }

  // حذف از گوگل‌شیت (Inventory و Summary) در پس‌زمینه
  deleteItemApi(itemId, session ? session.id : "", removed.barcode, removed.qty)
    .catch(console.error);

}

function editHistoryItem(itemId) {

  const item = history.find(h => h.itemId === itemId);

  if (!item) return;

  const input = prompt("تعداد جدید را وارد کنید:", item.qty);

  if (input === null) return;

  const newQty = Number(input);

  if (!newQty || newQty <= 0) {
    alert("عدد معتبر وارد کنید");
    return;
  }

  const result = updateItemQty(itemId, newQty);

  if (!result) {
    alert("این مورد پیدا نشد");
    return;
  }

  item.qty = newQty;

  renderHistory();

  if (summaryCache[result.barcode] !== undefined) {
    summaryCache[result.barcode] = Math.max(
      0,
      summaryCache[result.barcode] - result.oldQty + newQty
    );
  }

  // اعمال ویرایش در گوگل‌شیت، در پس‌زمینه
  updateItemApi(
    itemId,
    session ? session.id : "",
    result.barcode,
    result.oldQty,
    newQty
  ).catch(console.error);

}

document.getElementById("plus").onclick = () => {

  qty++;

  document.getElementById("qty").value = qty;

};



document.getElementById("minus").onclick = () => {

  if (qty > 1) {

    qty--;

  }

  document.getElementById("qty").value = qty;

};





document.getElementById("barcode")
.addEventListener("input", function(){

  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";


  let value = this.value;


  value = value.replace(/[۰-۹]/g,
    d => fa.indexOf(d)
  );


  value = value.replace(/[٠-٩]/g,
    d => ar.indexOf(d)
  );


  value = value.replace(/\D/g,"");


  this.value = value;


  if(value){

    queueShowPreviousQty(value);

  }


});





document.getElementById("saveBtn").onclick = async () => {

console.log("Save clicked");
  const barcode =
    document.getElementById("barcode").value;



  if(!barcode){

    alert("بارکد را وارد کنید");

    return;

  }



  if(!session){

    alert("انبارگردانی فعال نیست");

    return;

  }


  // هشدار ثبت تکراری بارکد در کمتر از ۵ ثانیه
  if (
    barcode === lastSavedBarcode &&
    Date.now() - lastSavedTime < 5000
  ) {

    const confirmDuplicate = confirm(
      "این بارکد همین چند ثانیه پیش ثبت شد. مطمئنید می‌خواهید دوباره ثبت کنید؟"
    );

    if (!confirmDuplicate) {
      return;
    }

  }


  const currentQty =
  Number(document.getElementById("qty").value.trim()) || 1;

  const updated = addItem(barcode, currentQty);

  if(!updated){

    alert("Session پیدا نشد");

    return;

  }

  lastSavedBarcode = barcode;
  lastSavedTime = Date.now();

  addHistory(barcode, currentQty, updated.itemId);

  count = updated.count;

   if (summaryCache[barcode] !== undefined) {

    summaryCache[barcode] += currentQty;

    document.getElementById("lastQty").innerText =
      "قبلاً ثبت شده: " + summaryCache[barcode] + " عدد";

   } else {

    // مقدار قبلی هنوز مشخص نیست؛ به جای حدس اشتباه، فعلاً منتظر می‌مانیم
    document.getElementById("lastQty").innerText = "در حال به‌روزرسانی...";

   }


  document.getElementById("count")
  .innerText = count;

 

 try {

  updateSyncStatus();

  const wasUnknown = summaryCache[barcode] === undefined;

// ارسال در پس‌زمینه، و در صورت نیاز اصلاح تعداد قبلی بعد از تایید سرور
setTimeout(async () => {

  try {

    await syncItem(session, barcode, currentQty, updated.itemId);

    updateSyncStatus();

    if (wasUnknown) {

      const fresh = await getSummary(barcode);

      if (fresh && fresh.success) {
        summaryCache[barcode] = fresh.qty;
      }

    }

  } catch (err) {

    console.error(err);

  }

}, 0);

} catch (e) {

  console.error(e);

}

updateSyncStatus();

// صدای بیپ
beep.currentTime = 0;
beep.play().catch(() => {});

  qty = 1;


  document.getElementById("qty")
  .value = 1;

  document.getElementById("lastBarcode").innerText =
    "آخرین بارکد : " + barcode;
  document.getElementById("barcode")
  .value = "";


  document.getElementById("lastQty")
  .innerText = "اولین ثبت این بارکد";


};

document.getElementById("finishBtn").onclick = async () => {

  if(!session){
    alert("انبارگردانی فعالی وجود ندارد");
    return;
  }

  const answer = confirm(
    "آیا از پایان انبارگردانی مطمئن هستید؟"
  );

  if(!answer){
    return;
  }

  const sessionId = session.id;

  // بلافاصله محلی تمام می‌شود، ارسال به گوگل‌شیت در پس‌زمینه انجام می‌شود
  finishSession();

  releaseWakeLock();

  alert("انبارگردانی با موفقیت پایان یافت");

  finishSessionApi(sessionId).catch(console.error);

  location.reload();

};
const barcodeInput = document.getElementById("barcode");

document.querySelectorAll(".num").forEach(btn => {
  btn.onclick = () => {
    barcodeInput.value += btn.innerText;
    queueShowPreviousQty(barcodeInput.value);
  };
});

document.getElementById("back").onclick = () => {
  barcodeInput.value = barcodeInput.value.slice(0, -1);

  if (barcodeInput.value) {
    queueShowPreviousQty(barcodeInput.value);
  } else {
    document.getElementById("lastQty").innerText =
      "اولین ثبت این بارکد";
  }
};

document.getElementById("clear").onclick = () => {
  barcodeInput.value = "";
  document.getElementById("lastQty").innerText =
    "اولین ثبت این بارکد";
};
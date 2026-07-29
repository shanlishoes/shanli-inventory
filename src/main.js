import "./style.css";

import { startScanner } from "./scanner";
import { offlineCount } from "./storage";
import {
  startNewSession,
  continueSession,
  finishSession,
  addItem
} from "./session";

import {
  startSessionApi,
  finishSessionApi,
  getSummary
} from "./api";

import { syncItem, syncPending } from "./sync";
const summaryCache = {};
const beep = new Audio("/sounds/beep.mp3");

let session = null;
let qty = 1;
let count = 0;
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
  await syncPending();
  updateQueueBadge?.();
});

// هنگام باز شدن برنامه هم اگر اینترنت وصل بود، ارسال انجام شود
window.addEventListener("load", async () => {
  if (navigator.onLine) {
    await syncPending();
    updateQueueBadge?.();
  }
});

document.querySelector("#app").innerHTML = `

<div class="container">

<div id="loginPage">
ّ
<div class="card">

<h1>📦 انبارگردانی شانلی</h1>

<input id="user" placeholder="نام انباردار">

<input id="supervisor" placeholder="نام ناظر">

<select id="branch">
<option>انبار مرکزی</option>
<option>شعبه شوط</option>
<option>شعبه ارومیه</option>
<option>شعبه خوی</option>
</select>

<button id="startBtn">
شروع انبارگردانی
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

</div>

</div>

`;


document.getElementById("startBtn").onclick = async () => {

  const user =
    document.getElementById("user").value.trim();

  const supervisor =
    document.getElementById("supervisor").value.trim();

  const branch =
    document.getElementById("branch").value;


  if (!user) {

    alert("نام انباردار را وارد کنید");

    return;

  }


session = continueSession();

if (
  session &&
  session.user.trim() === user.trim() &&
  session.status === "open"
) {

  const choice = prompt(
    "انبارگردانی باز دارید:\n\n" +
    "1 - ادامه قبلی\n" +
    "2 - بستن و شروع جدید"
  );


  if (choice === "2") {

    await finishSessionApi(session.id);

    finishSession();

    session = startNewSession(
      user,
      supervisor,
      branch
    );

  }


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


  document.getElementById("branchName")
  .innerText = branch;


  // await startScanner(
//     "reader",
//     handleScan
// );


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

    showPreviousQty(value);

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



  const updated =
    addItem(barcode, qty);



  if(!updated){

    alert("Session پیدا نشد");

    return;

  }



  count = updated.count;


  document.getElementById("count")
  .innerText = count;



 try {

  updateSyncStatus();

// ارسال در پس‌زمینه
setTimeout(() => {
  syncItem(session, barcode, qty)
    .then(() => updateSyncStatus())
    .catch(console.error);
}, 0);

} catch (e) {

  console.error(e);

}

updateSyncStatus();



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

  const result = await finishSessionApi(session.id);

  if(result.success){

    finishSession();

    alert("انبارگردانی با موفقیت پایان یافت");

    location.reload();

  }else{

    alert("خطا در پایان انبارگردانی");

  }

};
const barcodeInput = document.getElementById("barcode");

document.querySelectorAll(".num").forEach(btn => {
  btn.onclick = () => {
    barcodeInput.value += btn.innerText;
    showPreviousQty(barcodeInput.value);
  };
});

document.getElementById("back").onclick = () => {
  barcodeInput.value = barcodeInput.value.slice(0, -1);

  if (barcodeInput.value) {
    showPreviousQty(barcodeInput.value);
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

// وقتی اینترنت وصل شد، همه موارد ذخیره شده ارسال شوند
window.addEventListener("online", async () => {

  console.log("🟢 اینترنت وصل شد، شروع همگام‌سازی...");

  await syncPending();
 updateSyncStatus();
});
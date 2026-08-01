let history = [];

export function addHistory(barcode, qty) {

  history.unshift({
    barcode: barcode,
    qty: qty
  });

  if (history.length > 5) {
    history.pop();
  }

  renderHistory();
}

export function removeHistory(index) {

  history.splice(index, 1);

  renderHistory();
}

function renderHistory() {

  const list = document.getElementById("historyList");

  if (!list) return;

  list.innerHTML = history.map((item, index) => `

    <div class="historyItem">

      <span>${item.barcode}</span>

      <span>× ${item.qty}</span>

      <button
        class="deleteBtn"
        data-index="${index}">
        حذف
      </button>

    </div>
`
  ).join("");
}
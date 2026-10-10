/** Prints just the marked part of the page ("statement" or "receipt"). */
export function printArea(kind: "statement" | "receipt") {
  document.body.dataset.print = kind;
  const finish = () => {
    delete document.body.dataset.print;
    window.removeEventListener("afterprint", finish);
  };
  window.addEventListener("afterprint", finish);
  window.print();
}

/** Downloads rows as a spreadsheet-friendly CSV file. */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`;
  const text = rows.map((row) => row.map(escape).join(",")).join("\r\n");
  // The byte-order mark makes Excel read accents and symbols correctly.
  const blob = new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Click-to-sort on any <th> in the page.
 * Toggles ascending / descending on repeated clicks.
 * Detects column type automatically: date, time, number, or text.
 */
(function () {
  "use strict";

  /* ---- helpers to extract a sortable value from a cell ---- */

  function cellText(cell) {
    return cell.textContent.trim();
  }

  /** "16:42" or "16:42.3" → total seconds as a number */
  function parseTime(str) {
    var parts = str.split(":");
    if (parts.length !== 2) return NaN;
    var mins = parseFloat(parts[0]);
    var secs = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(secs)) return NaN;
    return mins * 60 + secs;
  }

  /** Return an ISO date string if the cell contains a <time> or a YYYY-MM-DD value */
  function parseDate(cell) {
    var timeEl = cell.querySelector("time");
    if (timeEl && timeEl.getAttribute("datetime")) {
      return timeEl.getAttribute("datetime");
    }
    var t = cellText(cell);
    // matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    return null;
  }

  /* ---- detect column type by sampling visible rows ---- */

  function detectType(tbody, colIndex) {
    var rows = Array.from(tbody.rows);
    var dominated = { date: 0, time: 0, number: 0 };
    var sample = 0;

    for (var i = 0; i < rows.length && sample < 10; i++) {
      var cell = rows[i].cells[colIndex];
      if (!cell) continue;
      var txt = cellText(cell);
      if (!txt || txt === "—") continue;
      sample++;

      if (parseDate(cell) !== null) { dominated.date++; continue; }
      if (!isNaN(parseTime(txt)))   { dominated.time++;  continue; }
      if (!isNaN(parseFloat(txt)))  { dominated.number++; continue; }
    }

    if (sample === 0) return "text";
    if (dominated.date   >= sample * 0.6) return "date";
    if (dominated.time   >= sample * 0.6) return "time";
    if (dominated.number >= sample * 0.6) return "number";
    return "text";
  }

  /* ---- comparators ---- */

  function comparator(type, colIndex, asc) {
    return function (rowA, rowB) {
      var cellA = rowA.cells[colIndex];
      var cellB = rowB.cells[colIndex];
      var a, b, cmp;

      if (type === "date") {
        a = parseDate(cellA) || "";
        b = parseDate(cellB) || "";
        cmp = a.localeCompare(b);
      } else if (type === "time") {
        a = parseTime(cellText(cellA));
        b = parseTime(cellText(cellB));
        a = isNaN(a) ? Infinity : a;
        b = isNaN(b) ? Infinity : b;
        cmp = a - b;
      } else if (type === "number") {
        a = parseFloat(cellText(cellA));
        b = parseFloat(cellText(cellB));
        a = isNaN(a) ? Infinity : a;
        b = isNaN(b) ? Infinity : b;
        cmp = a - b;
      } else {
        a = cellText(cellA).toLowerCase();
        b = cellText(cellB).toLowerCase();
        cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
      }

      return asc ? cmp : -cmp;
    };
  }

  /* ---- main wiring ---- */

  function initTable(table) {
    var thead = table.tHead;
    var tbody = table.tBodies[0];
    if (!thead || !tbody) return;

    var ths = thead.querySelectorAll("th");

    ths.forEach(function (th, colIndex) {
      th.classList.add("sortable");
      th.setAttribute("role", "button");
      th.setAttribute("tabindex", "0");
      th.title = "Sort by " + cellText(th);

      th.addEventListener("click", function () {
        sortBy(th, colIndex);
      });
      th.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          sortBy(th, colIndex);
        }
      });
    });

    function sortBy(th, colIndex) {
      // determine direction
      var wasAsc = th.getAttribute("aria-sort") === "ascending";
      var asc = !wasAsc;

      // clear indicators on sibling headers
      ths.forEach(function (h) {
        h.removeAttribute("aria-sort");
        h.classList.remove("sort-asc", "sort-desc");
      });

      th.setAttribute("aria-sort", asc ? "ascending" : "descending");
      th.classList.add(asc ? "sort-asc" : "sort-desc");

      // sort rows
      var type = detectType(tbody, colIndex);
      var rows = Array.from(tbody.rows);
      rows.sort(comparator(type, colIndex, asc));
      rows.forEach(function (row) {
        tbody.appendChild(row);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("table").forEach(initTable);
  });
})();

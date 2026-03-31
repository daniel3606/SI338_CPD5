/**
 * Search + sort for athlete and meet tables.
 * Works on index (#athleteData / #meetData) and standalone pages (main[data-table]).
 */
(function () {
  "use strict";

  function rowSearchText(row) {
    return Array.from(row.cells)
      .map(function (cell) {
        return cell.textContent.trim().toLowerCase();
      })
      .join(" ");
  }

  function rowMatchesQuery(row, query) {
    var q = query.trim().toLowerCase();
    if (!q) return true;
    return rowSearchText(row).indexOf(q) !== -1;
  }

  function athleteName(row) {
    return row.cells[1] ? row.cells[1].textContent.trim().toLowerCase() : "";
  }

  function meetName(row) {
    return row.cells[0] ? row.cells[0].textContent.trim().toLowerCase() : "";
  }

  function meetDateIso(row) {
    var cell = row.cells[2];
    if (!cell) return "";
    var timeEl = cell.querySelector("time");
    if (timeEl && timeEl.getAttribute("datetime")) {
      return timeEl.getAttribute("datetime");
    }
    return cell.textContent.trim();
  }

  function bindAthleteControls(root) {
    var search = root.querySelector("#athlete-search, #search");
    var sort = root.querySelector("#athlete-sort, #sort");
    var form = root.querySelector("form");
    var tbody = root.querySelector("table tbody");
    if (!search || !sort || !tbody) return;

    function apply() {
      var q = search.value;
      var mode = sort.value;
      var rows = Array.from(tbody.rows);
      var matched = rows.filter(function (r) {
        return rowMatchesQuery(r, q);
      });

      matched.sort(function (a, b) {
        var na = athleteName(a);
        var nb = athleteName(b);
        if (mode === "name-desc") {
          return nb.localeCompare(na, undefined, { sensitivity: "base" });
        }
        return na.localeCompare(nb, undefined, { sensitivity: "base" });
      });

      var unmatched = rows.filter(function (r) {
        return !rowMatchesQuery(r, q);
      });

      matched.forEach(function (r) {
        r.hidden = false;
        tbody.appendChild(r);
      });
      unmatched.forEach(function (r) {
        r.hidden = true;
        tbody.appendChild(r);
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        apply();
      });
    }
    search.addEventListener("input", apply);
    sort.addEventListener("change", apply);
    apply();
  }

  function bindMeetControls(root) {
    var search = root.querySelector("#meet-search, #search");
    var sort = root.querySelector("#meet-sort, #sort");
    var form = root.querySelector("form");
    var tbody = root.querySelector("table tbody");
    if (!search || !sort || !tbody) return;

    function apply() {
      var q = search.value;
      var mode = sort.value;
      var rows = Array.from(tbody.rows);
      var matched = rows.filter(function (r) {
        return rowMatchesQuery(r, q);
      });

      matched.sort(function (a, b) {
        if (mode === "name-desc") {
          return meetName(b).localeCompare(meetName(a), undefined, {
            sensitivity: "base",
          });
        }
        if (mode === "name-asc") {
          return meetName(a).localeCompare(meetName(b), undefined, {
            sensitivity: "base",
          });
        }
        var da = meetDateIso(a);
        var db = meetDateIso(b);
        if (mode === "date-desc") {
          return db.localeCompare(da);
        }
        return da.localeCompare(db);
      });

      var unmatched = rows.filter(function (r) {
        return !rowMatchesQuery(r, q);
      });

      matched.forEach(function (r) {
        r.hidden = false;
        tbody.appendChild(r);
      });
      unmatched.forEach(function (r) {
        r.hidden = true;
        tbody.appendChild(r);
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        apply();
      });
    }
    search.addEventListener("input", apply);
    sort.addEventListener("change", apply);
    apply();
  }

  function bindIndexTabs() {
    var athleteBtn = document.getElementById("athleteBtn");
    var meetBtn = document.getElementById("meetBtn");
    var athleteData = document.getElementById("athleteData");
    var meetData = document.getElementById("meetData");
    if (!athleteBtn || !meetBtn || !athleteData || !meetData) return;

    function showAthletes() {
      athleteData.classList.remove("hidden");
      athleteData.removeAttribute("hidden");
      meetData.classList.add("hidden");
      meetData.setAttribute("hidden", "");
      athleteBtn.classList.add("active");
      meetBtn.classList.remove("active");
      athleteBtn.setAttribute("aria-selected", "true");
      meetBtn.setAttribute("aria-selected", "false");
    }

    function showMeets() {
      meetData.classList.remove("hidden");
      meetData.removeAttribute("hidden");
      athleteData.classList.add("hidden");
      athleteData.setAttribute("hidden", "");
      meetBtn.classList.add("active");
      athleteBtn.classList.remove("active");
      meetBtn.setAttribute("aria-selected", "true");
      athleteBtn.setAttribute("aria-selected", "false");
    }

    athleteBtn.addEventListener("click", showAthletes);
    meetBtn.addEventListener("click", showMeets);
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindIndexTabs();

    var athleteRoot = document.getElementById("athleteData");
    if (athleteRoot) {
      bindAthleteControls(athleteRoot);
    }

    var meetRoot = document.getElementById("meetData");
    if (meetRoot) {
      bindMeetControls(meetRoot);
    }

    document.querySelectorAll("main[data-table='athletes']").forEach(function (main) {
      if (main.closest("#athleteData")) return;
      bindAthleteControls(main);
    });

    document.querySelectorAll("main[data-table='meets']").forEach(function (main) {
      if (main.closest("#meetData")) return;
      bindMeetControls(main);
    });
  });
})();

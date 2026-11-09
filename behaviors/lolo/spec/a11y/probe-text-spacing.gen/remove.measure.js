(id) => { const s = document.getElementById(id); const found = s !== null; if (found) s.remove(); return JSON.stringify({ id: id, removed: found }); }

JSON.stringify({ scripts: Array.from(document.querySelectorAll("script[src]")).map(function (s) { return s.src; }) })

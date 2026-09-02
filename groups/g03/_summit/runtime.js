// Summit runtime -- generated per group by the platform. Do not edit.
window.__SUMMIT__ = {
  "api": "https://techsummit2026-production.up.railway.app",
  "gid": "g03",
  "token": "data.g03.1803892403.480c8000c4aaa3ac6387745f70a557fca7c1a406b9f87e5dbf0721da473d2d37"
};

(function () {
  var cfg = window.__SUMMIT__;
  var api = cfg.api;

  // This API returns a STRING in `detail` for everything it refuses itself,
  // but a request that never reaches the handler (a 422 -- Summit.save("k",
  // undefined) sends no `value` and is one) carries an ARRAY of {loc, msg}
  // objects instead. Interpolating that into a message produced
  // "Error: [object Object]" in the preview console, which tells a student
  // nothing about which field was wrong.
  function detailText(d) {
    var detail = d && d.detail;
    if (typeof detail === "string") { return detail; }
    if (Array.isArray(detail)) {
      return detail.map(function (item) {
        var where = item && item.loc ? item.loc.join(" -> ") + ": " : "";
        return where + ((item && item.msg) || "invalid value");
      }).join("; ");
    }
    return "";
  }

  function request(method, path, body) {
    return fetch(api + path, {
      method: method,
      headers: {
        "content-type": "application/json",
        "X-Summit-Token": cfg.token
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          throw new Error(detailText(d) || ("Summit error " + r.status));
        });
      }
      return r.json();
    });
  }

  function write(collection, value, key) {
    var body = { value: value };
    if (key !== undefined && key !== null) { body.key = key; }
    return request("POST", "/api/data/" + collection, body);
  }

  function read(collection, key, limit) {
    var q = "?limit=" + (limit || 100);
    if (key !== undefined && key !== null) {
      q += "&key=" + encodeURIComponent(key);
    }
    return request("GET", "/api/data/" + collection + q).then(function (d) {
      return d.records || [];
    });
  }

  window.Summit = {
    save: function (key, value) { return write("kv", value, String(key)); },
    load: function (key) {
      return read("kv", String(key), 1).then(function (rows) {
        return rows.length ? rows[0].value : null;
      });
    },
    submitScore: function (nick, score) {
      return write("scores", { nick: String(nick), score: Number(score) });
    },
    leaderboard: function (opts) {
      var limit = (opts && opts.limit) || 10;
      // Sorted here rather than server-side so the API stays the two
      // endpoints spec 8 specifies.
      return read("scores", null, 500).then(function (rows) {
        return rows.map(function (r) { return r.value; })
          .filter(function (v) { return v && typeof v.score === "number"; })
          .sort(function (a, b) { return b.score - a.score; })
          .slice(0, limit);
      });
    },
    vote: function (option) { return write("votes", { option: String(option) }); },
    votes: function () {
      return read("votes", null, 500).then(function (rows) {
        var tally = {};
        rows.forEach(function (r) {
          var o = r.value && r.value.option;
          if (o) { tally[o] = (tally[o] || 0) + 1; }
        });
        return tally;
      });
    }
  };

  // Console errors, reported to the IDE so the assistant can see what broke.
  // Capped and deduped HERE because a render loop throws thousands of times a
  // second; the backend re-caps anyway, since a browser is not a trustworthy
  // narrator of its own limits. Reset is implicit: a page load builds a new
  // runtime, and the preview reloads on every save.
  //
  // Posting is coalesced, not inline: a loop throwing the IDENTICAL message
  // needs its live count to keep reaching the IDE, not a first post frozen
  // at "x1" forever; a loop throwing a DIFFERENT message every time must not
  // fire one postMessage per throw. A dirty flag plus a short timer buys
  // both -- at most ~4 posts/sec, buffer always current when one fires.
  var errs = [];
  var pending = false;
  function post() {
    pending = false;
    try {
      parent.postMessage({
        type: "summit:console-error",
        errors: errs.map(function (e) {
          return e.n > 1 ? e.m + " (x" + e.n + ")" : e.m;
        })
      }, "*");
    } catch (e) { /* no parent listening: the published site */ }
  }
  function schedule() {
    if (pending) { return; }
    pending = true;
    setTimeout(post, 250);
  }
  function report(msg) {
    if (!msg) { return; }
    msg = String(msg).slice(0, 200);
    var found = false;
    for (var i = 0; i < errs.length; i++) {
      if (errs[i].m === msg) { errs[i].n++; found = true; break; }
    }
    if (!found) {
      errs.push({ m: msg, n: 1 });
      if (errs.length > 5) { errs.shift(); }
    }
    schedule();
  }
  window.addEventListener("error", function (e) {
    report(e.message + (e.filename ? " (" + e.filename + ":" + e.lineno + ")" : ""));
  });
  window.addEventListener("unhandledrejection", function (e) {
    report("Unhandled promise rejection: " + (e.reason && e.reason.message
      ? e.reason.message : e.reason));
  });
  var realError = console.error;
  console.error = function () {
    report(Array.prototype.join.call(arguments, " "));
    return realError.apply(console, arguments);
  };

  // Preview liveness (spec 5.2). The IDE cannot reach into an opaque-origin
  // document any other way, and a page stuck in while(true) never runs this
  // listener -- which is exactly the signal. Target origin "*": an opaque
  // origin cannot name its parent; the payload is an echoed id.
  window.addEventListener("message", function (e) {
    var d = e.data;
    // M1: `if (d && d.__summit_ping)` was falsy for id 0 -- the FIRST ping
    // of every single preview load (useHeartbeat.ts's nextId starts at 0)
    // -- silently dropping it and delaying 'alive' by one whole beat every
    // time. typeof treats 0 as the real id it is.
    if (d && typeof d.__summit_ping === "number") {
      (e.source || window.parent).postMessage(
        { __summit_pong: d.__summit_ping }, "*");
    }
  });
})();

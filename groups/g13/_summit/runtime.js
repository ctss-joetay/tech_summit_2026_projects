// Summit runtime -- generated per group by the platform. Do not edit.
window.__SUMMIT__ = {
  "api": "https://techsummit2026-production.up.railway.app",
  "gid": "g13",
  "token": "data.g13.1805100391.02b5ae432970bfb19dac87642f0b19ac26ee61f80fe4f8f2882441405a91c9cb"
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

  // --- camera bridge (spec 2026-09-02) --------------------------------
  // getUserMedia needs a real origin to hang a permission grant on. The
  // preview has none, deliberately -- the opaque origin is what isolates
  // sixty groups from each other, and preview.py's CSP sandbox header and
  // the iframe attribute INTERSECT, so allow="camera" cannot reinstate it.
  // So the camera is handed IN by the parent, which does have an origin,
  // and this polyfill makes ordinary student code work anyway.
  //
  // Installed ONLY when sandboxed. On the published site the check below
  // is false, nothing is patched, and the native API runs -- which is what
  // makes the same project work in both places unmodified.
  //
  // self.origin, NOT location.origin: location.origin returns the URL's
  // origin even in a sandboxed document (measured), so it would install
  // this on published pages too and break them.
  if (self.origin === "null" && window.parent !== window) {
    var camCanvas = document.createElement("canvas");
    var camCtx = camCanvas.getContext("2d", { alpha: false });
    var camGotFrame = false;

    // This listener is installed in EVERY sandboxed preview and acks
    // UNCONDITIONALLY -- there is no "did this project ever call
    // getUserMedia" gate on it, deliberately (adding one interacts with
    // the per-save remount path and is deferred). Two consequences the
    // parent depends on, so read useCameraBridge.ts's IDLE_STOP_MS comment
    // before changing anything here:
    //
    //   1. A reloaded project that DROPPED its camera code still acks
    //      every frame it receives, so the parent's 5s idle timer is never
    //      reached by "the project stopped asking" -- that is not what
    //      turns the camera off.
    //   2. What does turn it off is the reload itself: frames posted into
    //      a WindowProxy whose document is still loading are dropped, so
    //      no ack comes back for them, the parent's outstanding-frame
    //      window saturates, its pump stalls, acks stop, and only then
    //      does its idle timer run. That holds only while the replacement
    //      document takes longer than ~2 rvfc intervals (~33ms) to commit.
    window.addEventListener("message", function (e) {
      var d = e.data;
      // Identity by window object, never by origin: every sandboxed frame
      // reports its origin as the literal string "null", identically.
      if (e.source !== window.parent) { return; }
      if (!d || d.type !== "summit:camera-frame" || !d.bitmap) { return; }
      try {
        if (camCanvas.width !== d.bitmap.width) { camCanvas.width = d.bitmap.width; }
        if (camCanvas.height !== d.bitmap.height) { camCanvas.height = d.bitmap.height; }
        camCtx.drawImage(d.bitmap, 0, 0);
        d.bitmap.close();
        camGotFrame = true;
      } catch (err) { /* a torn frame is not worth killing the feed for */ }
      // Drives the parent's backpressure window. Stop acking and the feed
      // stalls after MAX_OUTSTANDING_FRAMES.
      window.parent.postMessage({ type: "summit:camera-ack" }, "*");
    });

    var bridged = function (constraints) {
      var want = (constraints && constraints.video) || {};
      window.parent.postMessage({
        type: "summit:camera-request",
        want: { width: want.width, height: want.height }
      }, "*");
      return new Promise(function (resolve, reject) {
        var waited = 0;
        var poll = setInterval(function () {
          if (camGotFrame) {
            clearInterval(poll);
            var stream = camCanvas.captureStream(30);
            // The parent's idle timer is driven entirely by
            // summit:camera-ack, which this runtime posts for every frame
            // it RECEIVES regardless of whether the student ever stops
            // their own track -- so without a sender here the parent never
            // learns the student is done and the camera light stays on.
            // Wrap the video track stop() to tell it, exactly once.
            var camTrack = stream.getVideoTracks()[0];
            if (camTrack) {
              var camNativeStop = camTrack.stop.bind(camTrack);
              var camStopped = false;
              camTrack.stop = function () {
                camNativeStop();
                if (camStopped) { return; }
                camStopped = true;
                try {
                  window.parent.postMessage({ type: "summit:camera-stop" }, "*");
                } catch (err) { /* no parent listening: the published site */ }
              };
            }
            resolve(stream);
            return;
          }
          waited += 100;
          // No parent bridging (the gallery, spec A6) or the group said no.
          // Reject so a student's catch block runs; a promise that never
          // settles is a dead page with no error.
          if (waited >= 30000) {
            clearInterval(poll);
            reject(new DOMException(
              "Camera not available in this preview.", "NotAllowedError"));
          }
        }, 100);
      });
    };

    // Two behaviour changes this bridge imposes on projects that never
    // wanted a camera at all, recorded because neither is obvious from the
    // code above and both are visible to students:
    //
    //   1. getUserMedia({ audio: true }) now goes through `bridged` like
    //      everything else -- it does not check what was asked for.
    //      Microphone is out of scope (spec "Out of scope"), so an
    //      audio-only request raises the camera consent strip in the IDE
    //      and then either resolves with a canvas VIDEO track and no audio
    //      track at all, or -- with nobody to answer, which is the usual
    //      case -- sits in the 100ms poll below for a full 30 SECONDS
    //      before rejecting with NotAllowedError. Native getUserMedia
    //      would have failed immediately instead, so an audio project in
    //      the preview looks hung for half a minute before its catch block
    //      runs.
    //   2. enumerateDevices is replaced UNCONDITIONALLY, not merged: any
    //      project that enumerates sees exactly one fabricated
    //      "videoinput" and zero microphones, whatever hardware the
    //      machine actually has. A library that picks a device by
    //      deviceId, or counts audioinputs, gets this fiction.
    if (!navigator.mediaDevices) {
      try {
        Object.defineProperty(navigator, "mediaDevices",
                              { value: {}, configurable: true });
      } catch (err) { /* nothing more we can do */ }
    }
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = bridged;
      // Libraries commonly enumerate before requesting.
      navigator.mediaDevices.enumerateDevices = function () {
        return Promise.resolve([{
          deviceId: "summit-bridge", kind: "videoinput",
          label: "Camera", groupId: "summit"
        }]);
      };
    }
  }
})();

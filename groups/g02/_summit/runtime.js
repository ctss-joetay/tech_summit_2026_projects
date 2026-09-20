// Summit runtime -- generated per group by the platform. Do not edit.
window.__SUMMIT__ = {
  "ai_token": "ai.g02.1792466201.8c03f53571892a96be3bfc9f2de4379a43c76508448a799b027daf6044372f46",
  "api": "https://techsummit2026-production.up.railway.app",
  "gid": "g02",
  "runtime_version": 1,
  "token": "data.g02.1805426201.fca7b6989e7c653d19a7f1c3e991846f4feac3fb1d9690bc6ab9795c0f44000d"
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

  // --- runtime AI (spec A2) --------------------------------------------
  // A separate door from the data API above, on its own path prefix, and
  // reading an `ai`-scoped token -- never the `data` one write()/read()
  // send. The two scopes are not interchangeable server-side
  // (core/security.py's TOKEN_SCOPES), so this sends cfg.ai_token, not
  // cfg.token.
  function aiRequest(verb, body) {
    return fetch(api + "/api/student-ai/" + verb, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Summit-Token": cfg.ai_token
      },
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) {
          throw new Error(detailText(d) || ("Summit AI error " + r.status));
        }
        // A blocked input or reply is not a network failure -- the server
        // still answers 200, just with `blocked: true` and a calm message
        // instead of a result. Resolved, not rejected, so a moderated
        // reply is something a page can show, not something that lands
        // silently in a .catch() with no explanation.
        return d.blocked ? { blocked: true, message: d.message } : d.result;
      });
    });
  }

  // Streaming half of the AI door (Task 8b, spec A10). A separate path
  // from aiRequest() above, not a flag on it: an SSE reply is a
  // text/event-stream body, not JSON, so it cannot go through
  // response.json(). Read with fetch + ReadableStream -- EventSource
  // cannot set the X-Summit-Token header this route requires, for the
  // same reason api/chat.py's own module docstring gives for the
  // platform's own chat stream.
  //
  // Closing the page (or navigating away) aborts this fetch on its own;
  // no extra AbortController wiring is needed for that to reach the
  // server -- a browser tears down in-flight requests on unload, and the
  // server side of this connection dropping is exactly what lets
  // app/api/student_ai.py's _stream_frames stop paying for a reply nobody
  // will read (see that module's docstring for the measured saving).
  function streamRequest(verb, body, onChunk) {
    return fetch(api + "/api/student-ai/" + verb + "?stream=1", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Summit-Token": cfg.ai_token
      },
      body: JSON.stringify(body || {})
    }).then(function (r) {
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          throw new Error(detailText(d) || ("Summit AI error " + r.status));
        });
      }
      var reader = r.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";
      var full = "";
      // Set the instant a genuine terminal record ([DONE]/error/blocked)
      // is parsed -- see the `if (res.done)` branch in pump() below. The
      // server goes to real lengths (a `finally`-guarded slot, moderation
      // wrapped so it can't fall through silently) to guarantee one of
      // these three always arrives; this flag is what lets THIS side
      // detect the one way that guarantee can still fail to reach the
      // wire -- a dropped connection -- instead of quietly treating a
      // truncated reply as a complete one.
      var terminal = false;

      // One SSE record ("event: x\ndata: y\n\n") in, either null (keep
      // reading), {done: true} ([DONE] or a blocked terminal event), or a
      // thrown Error (an error event) out. Chunk events call onChunk as a
      // side effect and are otherwise swallowed here -- see
      // _stream_frames' own docstring for why per-chunk moderation is not
      // possible and only the accumulated `full` text is ever checked,
      // server-side, before the terminal event.
      function handleRecord(record) {
        var eventType = "message";
        var data = null;
        record.split("\n").forEach(function (line) {
          if (line.indexOf("event:") === 0) {
            eventType = line.slice(6).trim();
          } else if (line.indexOf("data:") === 0) {
            data = line.slice(5).trim();
          }
        });
        if (data === null || data === "") { return null; }
        if (data === "[DONE]") { terminal = true; return { done: true, text: full }; }
        var parsed;
        try { parsed = JSON.parse(data); } catch (e) { return null; }
        if (eventType === "error") {
          terminal = true;
          throw new Error((parsed && parsed.message) || "Summit AI stream error");
        }
        if (eventType === "blocked") {
          terminal = true;
          return { done: true, blocked: true, message: parsed && parsed.message };
        }
        // eventType === "chunk" (or an unrecognised event -- ignored).
        var text = parsed && parsed.text;
        if (text) {
          full += text;
          if (onChunk) { onChunk(text); }
        }
        return null;
      }

      function pump() {
        return reader.read().then(function (res) {
          if (res.done) {
            // The underlying connection closed with no terminal record
            // ever parsed -- a network drop, a killed tab on the OTHER
            // end (an iframe preview whose parent navigated away), or a
            // proxy that gave up. Resolving here with whatever partial
            // `full` text had arrived would be indistinguishable from a
            // genuine complete reply; reject instead, so a student's
            // .catch() runs rather than their page rendering half an
            // answer as though it were the whole one.
            if (!terminal) {
              throw new Error("Summit AI stream ended before a terminal " +
                "event arrived -- the connection was interrupted");
            }
            return { text: full };
          }
          buffer += decoder.decode(res.value, { stream: true });
          var records = buffer.split("\n\n");
          buffer = records.pop();
          for (var i = 0; i < records.length; i++) {
            var outcome = handleRecord(records[i]);
            if (outcome) { return outcome; }
          }
          return pump();
        });
      }

      return pump();
    });
  }

  window.Summit = {
    // save/load/forget: key/value with overwrite semantics, over the
    // per-group SQLite database Summit.db.* below also reads and writes --
    // api/data.py's /api/data/kv/{key} route, backed by the reserved
    // _summit_kv table. Each call here is a literal or `prefix + variable`
    // path so tests/test_summit_runtime.py can check it against the app's
    // own route table, not just read as prose.
    //
    // There used to be six more of these -- submitScore/leaderboard/vote/
    // votes/clearScores/clearVotes, over two more reserved tables -- for a
    // leaderboard and a poll. Retired by one-storage-model (spec
    // 2026-09-18): a leaderboard is a table of scores with a sort, which
    // Summit.db.* already does, so the second store bought nothing a
    // student couldn't already do with it. See data_api_guide.md's worked
    // example.
    save: function (key, value) {
      return request("POST", "/api/data/kv/" + encodeURIComponent(String(key)),
                     { value: value });
    },
    load: function (key) {
      return request("GET", "/api/data/kv/" + encodeURIComponent(String(key)))
        .then(function (d) { return d.value; });
    },
    // Row-level deletion is gameplay, so it belongs here, on the page --
    // the same ruling as Summit.db.remove() below. Structural destruction
    // (dropping a table, retyping a column, emptying the whole database)
    // stays behind the group's own login or the coding agent. A write,
    // like save above, so it resolves to the server's raw response object
    // rather than an unwrapped value -- same convention as save.
    //
    // Delete one saved value outright -- what Summit.save(key, null) was
    // standing in for, at the cost of a row that persists forever with an
    // empty value in the Data tab. -> { deleted: 0 or 1 }.
    forget: function (key) {
      return request("DELETE", "/api/data/kv/" + encodeURIComponent(String(key)));
    },
    // Summit.db.* -- tables, full CRUD on rows, and tally() (a GROUP BY
    // COUNT with no row cap, for a poll or anything else counted by
    // category), in the same per-group SQLite database save/load/forget
    // above use. Every path here is either a literal `/api/data/...`
    // string or `"/api/data/.../" + table` -- api/data.py's real routes,
    // not the collection-style endpoints the sugar functions used to hit.
    // `request()` above is what turns a non-2xx response's `detail` into
    // a readable Error.message instead of "[object Object]" -- db.* gets
    // that for free by going through it.
    db: {
      // { table: "monsters", columns: {id: "int", ts: "real", name:
      // "text", hp: "int"}, added: [] } -- `columns` always includes the
      // automatic id/ts; `added` lists any NEW columns when the table
      // already existed (create() is also how you add a column later).
      create: function (table, columns) {
        return request("POST", "/api/data/tables",
                       { table: table, columns: columns });
      },
      // An array of { table, columns, rows } -- how many tables exist and
      // how big each one is.
      tables: function () {
        return request("GET", "/api/data/tables")
          .then(function (r) { return r.tables; });
      },
      // { id: 7, ts: 1734000000.1 } -- the new row's id (use it later with
      // update()/remove()) and the server timestamp it was written at.
      insert: function (table, row) {
        return request("POST", "/api/data/rows/" + encodeURIComponent(table),
                       { row: row });
      },
      // A bare ARRAY of row objects, newest first by default -- never a
      // wrapper. `where` is optional: { hp: { gt: 5 } }, { name: "Slime" },
      // or omit it for every row. `options.sort`/`options.dir`/
      // `options.limit` control ordering and how many come back (server
      // caps at 500).
      find: function (table, where, options) {
        options = options || {};
        var q = new URLSearchParams();
        if (where) { q.set("where", JSON.stringify(where)); }
        if (options.sort) { q.set("sort", options.sort); }
        if (options.dir) { q.set("dir", options.dir); }
        if (options.limit) { q.set("limit", String(options.limit)); }
        var qs = q.toString();
        return request("GET", "/api/data/rows/" + encodeURIComponent(table) +
                       (qs ? "?" + qs : ""))
          .then(function (r) { return r.rows; });
      },
      // { updated: 3 } -- how many rows matched `where` and got `changes`
      // applied. Omitting `where` updates every row in the table.
      update: function (table, where, changes) {
        return request("PATCH", "/api/data/rows/" + encodeURIComponent(table),
                       { where: where, changes: changes });
      },
      // A bare MAPPING of column value -> count, e.g. tally('votes',
      // 'option') -> { cats: 12, dogs: 7 }. Counts EVERY row -- unlike
      // find(), this has no 500-row cap, because a poll tallied by
      // find()-ing every row and counting in JS silently undercounts once
      // it crosses that cap, with no error and no truncation notice. Use
      // this, not find() + a JS loop, whenever what you want is a count
      // per category (a poll, tasks by priority, scores by player) rather
      // than the rows themselves.
      tally: function (table, column) {
        return request("GET", "/api/data/tally/" + encodeURIComponent(table) +
                       "?column=" + encodeURIComponent(column))
          .then(function (r) { return r.counts; });
      },
      // { removed: 32 } -- how many rows were deleted. remove(table) with
      // NO second argument clears every row and keeps the table, ready for
      // the next insert -- that's how you reset a leaderboard, a poll, a
      // board game, or any other table YOU made; there is no separate
      // built-in store any more (one-storage-model, spec 2026-09-18) for
      // check_student_table to carve out an exception for. Dropping the
      // table itself, or changing a column's type, is not done from code
      // -- ask your coding assistant in chat. The Data tab is read-only:
      // it shows what's there, nothing more.
      remove: function (table, where) {
        return request("DELETE", "/api/data/rows/" + encodeURIComponent(table),
                       { where: where || null });
      }
    },
    // Unwrapped to the bare label, not the `{label: ...}` object
    // student_ai.py's _run_classify validates -- app/ai/prompts/
    // student_ai_guide.md documents `const mood = await Summit.classify(...)`
    // and teaches the ASSISTANT to write that verbatim into every student
    // project, so `mood` must be directly usable as a string (compared,
    // concatenated, switched on) or every generated project that calls
    // this breaks the same way. A blocked call is passed through
    // unchanged (`{blocked: true, message}`, no `.label` to unwrap) --
    // aiRequest's own docstring is explicit that this is a RESOLVED value
    // a page must check, never something that lands in a .catch().
    classify: function (text, options) {
      return aiRequest("classify", { text: String(text), options: options })
        .then(function (r) { return r && r.blocked ? r : r.label; });
    },
    // `shape` describes the JSON object to extract, e.g.
    //   { name: "string", age: "integer", tags: ["string"] }
    // Leaf types are exactly "string", "number", "integer" or "boolean";
    // an object nests directly; an array is written as a ONE-element list
    // naming its item type (["string"], never a bare "array"); nesting
    // deeper than 8 levels is refused by the server with a 400. This must
    // match _SHAPE_TYPES/_validate_shape_descriptor in
    // app/services/student_ai.py exactly -- the server validates it.
    extract: function (text, shape) {
      return aiRequest("extract", { text: String(text), shape: shape });
    },
    // Unwrapped to the bare verdict boolean, not the `{verdict, why}`
    // object student_ai.py's _run_judge validates -- same reasoning as
    // classify above. This one is the sharpest version of the bug: the
    // guide documents `const same = await Summit.judge(...)` used as a
    // boolean, and `{verdict: false, why: "..."}` is still a TRUTHY
    // object -- `if (same)` was always true regardless of what the model
    // actually decided, a silent wrong answer rather than a visible
    // "[object Object]". `.why` (the explanation) is intentionally
    // dropped from the resolved value, matching the guide's own contract;
    // nothing documented exposes it. Blocked passes through unchanged,
    // same as classify.
    judge: function (a, b, question) {
      return aiRequest("judge", {
        a: String(a), b: String(b), question: String(question)
      }).then(function (r) { return r && r.blocked ? r : r.verdict; });
    },
    // opts.onChunk, if given, streams the reply: it is called with each
    // piece of text as it arrives, and the returned promise still resolves
    // with the same shape aiRequest's callers get (the full text, or
    // {blocked, message}) once the stream ends. Without opts.onChunk this
    // is the ordinary non-streaming call.
    //
    // BOTH paths resolve to the same thing: the bare text, or a
    // {blocked, message} object passed through unchanged. The streaming
    // one used to resolve to streamRequest's internal {done, text, ...}
    // record instead -- harmless while nothing documented consuming it,
    // but app/ai/prompts/student_ai_guide.md now teaches a worked onChunk
    // example, and two shapes behind one documented call is precisely the
    // classify/judge "[object Object]" bug in a new place. Aligned rather
    // than merely written down: `await Summit.generate(p, {onChunk})` is a
    // string either way, so a project can add streaming to a working
    // feature without rewriting what consumes it.
    generate: function (prompt, opts) {
      var onChunk = opts && opts.onChunk;
      if (onChunk) {
        return streamRequest("generate", { prompt: String(prompt) }, onChunk)
          .then(function (r) {
            // Rebuilt, not passed through: streamRequest's terminal record
            // also carries its own internal `done` flag, and the whole
            // point here is that a page sees ONE shape whether or not it
            // passed onChunk.
            return r && r.blocked
              ? { blocked: true, message: r.message }
              : r.text;
          });
      }
      return aiRequest("generate", { prompt: String(prompt) })
        .then(function (r) { return r && r.blocked ? r : r.text; });
    },
    // Unwrapped to the bare text, not the `{text: ...}` object -- same
    // reasoning as generate's non-streaming path above; the guide
    // documents `const seen = await Summit.see(...)` used as a string.
    see: function (image, question) {
      return aiRequest("see", {
        image: String(image), question: String(question)
      }).then(function (r) { return r && r.blocked ? r : r.text; });
    },
    // The escape hatch: a raw messages array, same shape the API takes --
    // [{role: "system"|"user"|"assistant", content: "..."}]. Pass
    // { json: true } to require the reply be a JSON object, or
    // { onChunk } to stream (spec A10 names both generate and ai as the
    // two verbs that stream; the backend's STREAM_VERBS already covers
    // "ai", this was just the client-side wiring).
    //
    // The NON-streaming reply is deliberately NOT unwrapped the way
    // generate()'s is: it is whatever the server validated (an arbitrary
    // JSON object under { json: true }), so there is no single field to
    // unwrap to. student_ai_guide.md documents this verb as the raw one
    // for exactly that reason.
    //
    // The STREAMING one IS unwrapped, to the same bare string generate's
    // streaming path resolves to. A stream can only ever carry text --
    // streamRequest accumulates exactly that and nothing else -- so the
    // argument above does not reach it. Resolving to streamRequest's
    // internal {done, text} record instead handed a page an object with
    // no documented meaning and an internal `done` flag on it, and
    // `out.textContent = full` printed "[object Object]": the
    // classify/judge bug again, in the verb student_ai_guide.md names in
    // the SAME sentence as generate ("Summit.generate and Summit.ai can
    // hand text over as it is written"), immediately above a worked
    // onChunk example. An assistant applying that example to the other
    // verb the sentence names got the broken shape. Rebuilt rather than
    // passed through, and a blocked terminal event rebuilt the same way
    // generate's is, so the two streaming verbs are one shape.
    ai: function (messages, opts) {
      var body = { messages: messages };
      if (opts && opts.json) { body.json = true; }
      var onChunk = opts && opts.onChunk;
      if (onChunk) {
        return streamRequest("ai", body, onChunk)
          .then(function (r) {
            return r && r.blocked
              ? { blocked: true, message: r.message }
              : r.text;
          });
      }
      return aiRequest("ai", body);
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

/**
 * Screens, keyboard, CPU, scene capture hooks. Browser only, no modules.
 */
(function (root) {
  var Engine = root.BBEngine;
  var Roster = root.BBRoster;
  var Render = root.BBRender;

  var canvas, ctx;
  var screen = "title";
  var t = 0;
  var cursor = 0;
  var cursor2 = 1;
  var p1Locked = false;
  var p2Locked = false;
  var versusT = 0;
  var match = null;
  var keys = {};
  var twoPlayer = false;
  var sceneMode = null;

  function qs() {
    var out = {};
    var s = (location.search || "").replace(/^\?/, "");
    if (!s) return out;
    s.split("&").forEach(function (pair) {
      var kv = pair.split("=");
      out[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
    });
    return out;
  }

  function p1Input() {
    return {
      left: !!keys.KeyA,
      right: !!keys.KeyD,
      up: !!keys.KeyW,
      down: !!keys.KeyS,
      punch: !!keys.KeyF,
      kick: !!keys.KeyG
    };
  }

  function p2Input() {
    return {
      left: !!keys.ArrowLeft,
      right: !!keys.ArrowRight,
      up: !!keys.ArrowUp,
      down: !!keys.ArrowDown,
      punch: !!keys.KeyK,
      kick: !!keys.KeyL
    };
  }

  function cpuInput(me, foe) {
    var in_ = Engine.emptyInput();
    var dx = foe.x - me.x;
    var toward = dx > 0;
    if (Math.abs(dx) > 120) {
      if (toward) in_.right = true;
      else in_.left = true;
    } else if (Math.abs(dx) < 70) {
      if (t % 40 < 6) in_.punch = true;
      else if (t % 53 === 0) in_.kick = true;
      else if (t % 17 < 4) {
        if (toward) in_.left = true;
        else in_.right = true;
      }
    } else {
      if (t % 70 === 10) {
        in_.down = true;
        if (toward) in_.right = true;
        else in_.left = true;
      }
      if (t % 70 === 12) {
        if (toward) in_.right = true;
        else in_.left = true;
        in_.punch = true;
      }
      if (t % 90 === 4) in_.up = true;
    }
    return in_;
  }

  function startMatch(id1, id2) {
    match = Engine.createMatch(id1, id2);
    screen = "versus";
    versusT = 90;
  }

  function applyScene(q) {
    sceneMode = q.scene || null;
    var a = q.p1 || "musk";
    var b = q.p2 || "buffett";
    if (!Roster.byId(a)) a = "musk";
    if (!Roster.byId(b)) b = "buffett";
    if (q.scene === "select") {
      screen = "select";
      return;
    }
    if (q.scene === "versus") {
      startMatch(a, b);
      versusT = 9999;
      return;
    }
    if (q.scene === "title") {
      screen = "title";
      return;
    }
    if (q.scene === "fight" || q.scene === "projectile" || q.scene === "ko" || q.scene === "hud") {
      match = Engine.createMatch(a, b);
      match.announceT = 0;
      match.announce = "FIGHT";
      screen = "fight";
      if (q.scene === "projectile") {
        Engine.performMotion(match, 0, "236", "punch");
        Engine.stepFrames(match, 18);
      }
      if (q.scene === "ko") {
        match.p2.health = 0;
        match.p2.state = "ko";
        match.roundOver = true;
        match.roundResult = { type: "ko", winner: 0 };
        match.wins[0] = 1;
        match.announce = "K.O.";
        match.announceT = 80;
        match.koFlash = 20;
      }
    }
  }

  function tick() {
    t++;
    if (screen === "versus") {
      versusT--;
      if (versusT <= 0) screen = "fight";
    } else if (screen === "fight" && match && !sceneMode) {
      Engine.injectInput(match, 0, p1Input());
      if (twoPlayer) Engine.injectInput(match, 1, p2Input());
      else Engine.injectInput(match, 1, cpuInput(match.p2, match.p1));
      Engine.step(match);
      if (match.roundOver && match.announceT <= 0) {
        if (match.matchOver) {
          screen = "win";
        } else {
          match = Engine.startNextRound(match);
        }
      }
    } else if (screen === "fight" && match && sceneMode === "fight") {
      Engine.injectInput(match, 0, p1Input());
      Engine.step(match);
    }
    Render.render(ctx, {
      screen: screen === "win" ? "fight" : screen,
      t: t,
      roster: Roster,
      cursor: cursor,
      cursor2: p2Locked || twoPlayer ? cursor2 : -1,
      p1: match ? match.p1.def : Roster.fighters[cursor],
      p2: match ? match.p2.def : Roster.fighters[cursor2],
      match: match
    });
    if (screen === "win" && match) {
      match.announce = "YOU WIN";
      match.matchOver = true;
      match.announceT = 10;
      Render.render(ctx, { screen: "fight", t: t, match: match, roster: Roster, cursor: 0, cursor2: 1 });
    }
    requestAnimationFrame(tick);
  }

  function moveCursor(dir, which) {
    var n = Roster.fighters.length;
    if (which === 1) cursor = (cursor + dir + n) % n;
    else cursor2 = (cursor2 + dir + n) % n;
  }

  function onKey(e, down) {
    keys[e.code] = down;
    if (!down) return;
    if (e.code === "Enter" || e.code === "Space") {
      if (screen === "title") screen = "select";
      else if (screen === "select" && p1Locked) {
        startMatch(Roster.fighters[cursor].id, Roster.fighters[cursor2].id);
      } else if (screen === "win") {
        screen = "select";
        p1Locked = false;
        p2Locked = false;
        match = null;
      }
    }
    if (screen === "select") {
      if (e.code === "KeyA") moveCursor(-1, 1);
      if (e.code === "KeyD") moveCursor(1, 1);
      if (e.code === "KeyW") moveCursor(-5, 1);
      if (e.code === "KeyS") moveCursor(5, 1);
      if (e.code === "KeyF") {
        p1Locked = true;
        if (cursor2 === cursor) cursor2 = (cursor + 1) % 10;
      }
      if (e.code === "ArrowLeft") { twoPlayer = true; moveCursor(-1, 2); }
      if (e.code === "ArrowRight") { twoPlayer = true; moveCursor(1, 2); }
      if (e.code === "KeyK") { twoPlayer = true; p2Locked = true; }
    }
    if (e.code === "Escape") {
      screen = "title";
      match = null;
      p1Locked = false;
    }
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].indexOf(e.code) >= 0) {
      e.preventDefault();
    }
  }

  function boot() {
    canvas = document.getElementById("stage");
    canvas.width = Render.WIDTH;
    canvas.height = Render.HEIGHT;
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    window.addEventListener("keydown", function (e) { onKey(e, true); });
    window.addEventListener("keyup", function (e) { onKey(e, false); });
    canvas.addEventListener("click", function () {
      if (screen === "title") screen = "select";
    });
    applyScene(qs());
    requestAnimationFrame(tick);
    root.BBGame = {
      getScreen: function () { return screen; },
      getMatch: function () { return match; },
      canvas: canvas
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof globalThis !== "undefined" ? globalThis : this);

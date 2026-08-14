/**
 * Pure 1v1 Street Fighter-style combat, input buffer, and first-to-two rounds.
 * Importable by Node tests and by the browser via <script src>.
 */
(function (root) {
  var Roster = (typeof module !== "undefined" && module.exports)
    ? require("./roster.js")
    : root.BBRoster;

  var C = {
    WIDTH: 960,
    HEIGHT: 540,
    GROUND: 468,
    FPS: 60,
    MAX_HEALTH: 1000,
    ROUND_FRAMES: 99 * 60,
    ROUNDS_TO_WIN: 2,
    GRAVITY: 0.82,
    FRICTION: 0.72,
    PUSH: 2.4,
    BUFFER: 18,
    HITSTOP: 5
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function facingRel(dir, facing) {
    if (facing > 0) return dir;
    var map = { 1: 3, 3: 1, 4: 6, 6: 4, 7: 9, 9: 7 };
    return map[dir] || dir;
  }

  function numpad(input, facing) {
    var x = 0, y = 0;
    if (input.left) x -= 1;
    if (input.right) x += 1;
    if (input.up) y += 1;
    if (input.down) y -= 1;
    var raw;
    if (y > 0 && x < 0) raw = 7;
    else if (y > 0 && x > 0) raw = 9;
    else if (y > 0) raw = 8;
    else if (y < 0 && x < 0) raw = 1;
    else if (y < 0 && x > 0) raw = 3;
    else if (y < 0) raw = 2;
    else if (x < 0) raw = 4;
    else if (x > 0) raw = 6;
    else raw = 5;
    return facingRel(raw, facing);
  }

  function emptyInput() {
    return { left: false, right: false, up: false, down: false, punch: false, kick: false };
  }

  function makeFighter(def, side) {
    var facing = side === 0 ? 1 : -1;
    return {
      id: def.id,
      def: def,
      side: side,
      x: side === 0 ? 280 : 680,
      y: C.GROUND,
      vx: 0,
      vy: 0,
      facing: facing,
      health: def.maxHealth,
      maxHealth: def.maxHealth,
      state: "idle",
      stateT: 0,
      crouch: false,
      airborne: false,
      attack: null,
      hitstun: 0,
      blockstun: 0,
      invuln: 0,
      hitThisMove: 0,
      hitsLanded: 0,
      lastSpecial: null,
      slow: 0,
      slowMul: 1,
      buffer: [],
      prevBtn: { punch: false, kick: false }
    };
  }

  function createMatch(id1, id2, opts) {
    opts = opts || {};
    var a = Roster.byId(id1);
    var b = Roster.byId(id2);
    if (!a || !b) throw new Error("unknown fighter: " + id1 + " / " + id2);
    var match = {
      p1: makeFighter(a, 0),
      p2: makeFighter(b, 1),
      inputs: [emptyInput(), emptyInput()],
      projectiles: [],
      frame: 0,
      round: 1,
      timer: opts.timer != null ? opts.timer : C.ROUND_FRAMES,
      timerFrozen: !!opts.timerFrozen,
      wins: [0, 0],
      roundOver: false,
      roundResult: null,
      matchOver: false,
      winner: null,
      hitstop: 0,
      announce: "ROUND 1",
      announceT: 50,
      koFlash: 0,
      stage: opts.stage || "ticker"
    };
    faceEachOther(match);
    return match;
  }

  function faceEachOther(m) {
    if (m.p1.x <= m.p2.x) { m.p1.facing = 1; m.p2.facing = -1; }
    else { m.p1.facing = -1; m.p2.facing = 1; }
  }

  function pushBuffer(f, input) {
    var dir = numpad(input, f.facing);
    f.buffer.push({
      dir: dir,
      punch: input.punch && !f.prevBtn.punch,
      kick: input.kick && !f.prevBtn.kick,
      heldPunch: !!input.punch,
      heldKick: !!input.kick
    });
    if (f.buffer.length > C.BUFFER) f.buffer.shift();
    f.prevBtn.punch = !!input.punch;
    f.prevBtn.kick = !!input.kick;
  }

  function dirsInOrder(buf, seq) {
    var i = 0;
    for (var b = 0; b < buf.length; b++) {
      if (buf[b].dir === seq[i]) {
        i++;
        if (i >= seq.length) return true;
      }
    }
    return false;
  }

  function chargedBack(buf, minHold) {
    var hold = 0;
    for (var i = 0; i < buf.length; i++) {
      var d = buf[i].dir;
      if (d === 4 || d === 1 || d === 7) hold++;
      else if (hold > 0 && (d === 6 || d === 3 || d === 9)) {
        if (hold >= minHold) return true;
        hold = 0;
      } else {
        hold = 0;
      }
    }
    return false;
  }

  function motionOk(f, motion) {
    var buf = f.buffer;
    if (motion === "236") return dirsInOrder(buf, [2, 3, 6]) || dirsInOrder(buf, [2, 6]);
    if (motion === "214") return dirsInOrder(buf, [2, 1, 4]) || dirsInOrder(buf, [2, 4]);
    if (motion === "623") return dirsInOrder(buf, [6, 2, 3]) || dirsInOrder(buf, [6, 3]);
    if (motion === "421") return dirsInOrder(buf, [4, 2, 1]) || dirsInOrder(buf, [4, 1]);
    if (motion === "46") return chargedBack(buf, 8) || dirsInOrder(buf, [4, 6]);
    return false;
  }

  function justPressed(f, button) {
    var last = f.buffer[f.buffer.length - 1];
    if (!last) return false;
    return button === "punch" ? last.punch : last.kick;
  }

  function actionable(f) {
    if (f.hitstun > 0 || f.blockstun > 0) return false;
    if (f.state === "attack" || f.state === "special" || f.state === "ko" || f.state === "knockdown") return false;
    return true;
  }

  function setState(f, state) {
    f.state = state;
    f.stateT = 0;
  }

  function startAttack(f, move, special) {
    f.attack = {
      move: move,
      special: special || null,
      t: 0,
      hitCount: 0,
      lastHitT: -99
    };
    f.hitThisMove = 0;
    f.vx = 0;
    setState(f, special ? "special" : "attack");
    if (special) f.lastSpecial = special.id;
  }

  function trySpecial(f) {
    if (!actionable(f) && !(f.airborne && f.state === "jump")) return false;
    if (f.airborne && f.state === "jump") {
      /* allow dive specials in air */
    } else if (!actionable(f)) return false;
    var list = f.def.specials;
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (!justPressed(f, s.button)) continue;
      if (!motionOk(f, s.motion)) continue;
      if (s.kind === "dive" && !f.airborne) {
        f.vy = -6.5;
        f.airborne = true;
      }
      startAttack(f, s, s);
      f.buffer = [];
      return true;
    }
    return false;
  }

  function tryNormal(f, input) {
    if (!actionable(f)) return false;
    var pressed = justPressed(f, "punch") || justPressed(f, "kick");
    if (!pressed) return false;
    var isPunch = justPressed(f, "punch");
    var move;
    if (f.airborne) move = isPunch ? f.def.normals.jumpPunch : f.def.normals.jumpKick;
    else if (f.crouch) move = isPunch ? f.def.normals.crouchPunch : f.def.normals.crouchKick;
    else move = isPunch ? f.def.normals.punch : f.def.normals.kick;
    startAttack(f, move, null);
    return true;
  }

  function holdingAway(f, input) {
    if (f.facing > 0) return !!input.left && !input.right;
    return !!input.right && !input.left;
  }

  function isBlocking(f, input, height) {
    if (!holdingAway(f, input)) return false;
    if (f.hitstun > 0 || f.state === "attack" || f.state === "special" || f.state === "ko") return false;
    if (f.airborne) return false;
    var low = !!input.down;
    if (height === "low") return low;
    if (height === "overhead") return !low;
    if (height === "high") return !low;
    return true;
  }

  function worldHitbox(f, box) {
    var x = f.facing > 0 ? f.x + box.x : f.x - box.x - box.w;
    return { x: x, y: f.y + box.y, w: box.w, h: box.h };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function bodyBox(f) {
    var h = f.crouch ? f.def.height * 0.62 : f.def.height;
    return { x: f.x - f.def.width / 2, y: f.y - h, w: f.def.width, h: h };
  }

  function spawnProjectile(m, f, spec) {
    var p = spec.projectile;
    var dir = f.facing;
    var y = f.y - 90;
    if (p.yOff) y = f.y - p.yOff;
    if (p.traj === "drop") {
      return {
        owner: f.side,
        spec: spec,
        x: f.x + dir * (p.dropX || 180),
        y: 40,
        vx: 0,
        vy: 6.5,
        w: p.w, h: p.h,
        life: p.life,
        hits: 0,
        facing: dir,
        exploded: false
      };
    }
    if (p.traj === "updown") {
      return {
        owner: f.side, spec: spec,
        x: f.x + dir * 20, y: f.y - 40,
        vx: 0, vy: p.upSpeed || -11,
        w: p.w, h: p.h, life: p.life, hits: 0, facing: dir, phase: "up"
      };
    }
    return {
      owner: f.side,
      spec: spec,
      x: f.x + dir * 36,
      y: y,
      vx: dir * (p.speed || 6),
      vy: p.arc || 0,
      w: p.w, h: p.h,
      life: p.life,
      hits: 0,
      facing: dir,
      exploded: false,
      grow: 1
    };
  }

  function applyHit(m, atk, def, move, special, blocked) {
    var dmg = move.damage || 0;
    if (blocked) {
      dmg = Math.round(dmg * (move.chip || 0));
      def.blockstun = move.blockstun || 8;
      setState(def, "block");
    } else {
      def.health = Math.max(0, def.health - dmg);
      def.hitstun = move.hitstun || 12;
      def.vx = (atk.facing || 1) * (move.knockback || 6);
      if (special && (special.kind === "uppercut" || special.kind === "dive")) {
        def.vy = special.kind === "uppercut" ? -8 : -3;
        def.airborne = true;
      }
      setState(def, "hitstun");
      if (special && special.slow) {
        def.slow = special.slowFrames || 40;
        def.slowMul = special.slow;
      }
    }
    if (blocked) def.health = Math.max(0, def.health - dmg);
    else { /* already applied */ }
    if (blocked && dmg === 0) {
      /* no health change */
    }
    m.hitstop = C.HITSTOP;
    atk.hitThisMove += 1;
    atk.hitsLanded += 1;
    if (def.health <= 0) {
      def.health = 0;
      setState(def, "ko");
      def.hitstun = 0;
      def.vy = -7;
      def.airborne = true;
      m.koFlash = 40;
    }
  }

  function resolveAttack(m, atk, def, defInput) {
    if (!atk.attack) return;
    var move = atk.attack.move;
    var special = atk.attack.special;
    var t = atk.attack.t;
    if (t < move.startup || t >= move.startup + move.active) return;
    var maxHits = move.hits || 1;
    if (atk.attack.hitCount >= maxHits) return;
    if (t - atk.attack.lastHitT < 5 && maxHits > 1 && atk.attack.hitCount > 0) return;

    if (special && special.projectile) {
      if (t === move.startup && atk.attack.hitCount === 0) {
        m.projectiles.push(spawnProjectile(m, atk, special));
        atk.attack.hitCount = maxHits;
      }
      return;
    }

    var box;
    if (special && special.kind === "beam") {
      box = { x: 20, y: -96, w: special.beam.length, h: special.beam.h };
    } else if (special && special.hitbox) {
      box = special.hitbox;
    } else {
      box = move.hitbox;
    }
    if (!box) return;
    var hb = worldHitbox(atk, box);
    var bb = bodyBox(def);
    if (!overlap(hb, bb)) {
      if (special && special.kind === "suction") {
        var pull = special.pull || 4;
        if (Math.abs(def.x - atk.x) < (box.w + 40)) {
          def.x += (atk.x > def.x ? pull : -pull);
        }
      }
      return;
    }
    if (special && special.kind === "teleport" && t === move.startup) {
      def.x = def.x; /* applied in special physics */
    }
    var height = move.height || "mid";
    var blocked = isBlocking(def, defInput, height);
    applyHit(m, atk, def, move, special, blocked);
    atk.attack.hitCount += 1;
    atk.attack.lastHitT = t;
  }

  function stepProjectiles(m) {
    var next = [];
    for (var i = 0; i < m.projectiles.length; i++) {
      var p = m.projectiles[i];
      var spec = p.spec;
      var pr = spec.projectile || {};
      p.life--;
      if (pr.traj === "arc") {
        p.vy += pr.gravity || 0.25;
        p.x += p.vx;
        p.y += p.vy;
      } else if (pr.traj === "bounce") {
        p.x += p.vx;
        p.vy += 0.45;
        p.y += p.vy;
        if (p.y > C.GROUND - 10) {
          p.y = C.GROUND - 10;
          p.vy = -(pr.bounce || 7);
        }
      } else if (pr.traj === "grow" || pr.traj === "accelerate") {
        p.grow = (p.grow || 1) + (pr.grow || 0.03);
        if (pr.traj === "accelerate") p.vx += (p.facing > 0 ? 1 : -1) * (pr.accel || 0.12);
        p.x += p.vx;
        p.w = pr.w * p.grow;
        p.h = pr.h * p.grow;
      } else if (pr.traj === "lowcrawl") {
        p.x += p.vx;
        p.y = C.GROUND - 18;
      } else if (pr.traj === "explode") {
        p.x += p.vx;
        if (!p.exploded && p.life <= (pr.life - (pr.explodeAt || 28))) {
          p.exploded = true;
          p.w = pr.explodeW || 90;
          p.h = pr.explodeH || 80;
          p.x -= p.w / 4;
          p.y -= 20;
        }
      } else if (pr.traj === "drop") {
        p.vy += 0.35;
        p.y += p.vy;
      } else if (pr.traj === "updown") {
        p.vy += 0.42;
        p.y += p.vy;
      } else if (pr.traj === "wave" || pr.traj === "clone" || pr.traj === "beamchunk" || pr.traj === "horizontal") {
        p.x += p.vx;
      } else {
        p.x += p.vx;
        p.y += p.vy || 0;
      }
      if (p.life <= 0 || p.y > C.GROUND + 40 || p.x < -80 || p.x > C.WIDTH + 80) continue;

      var owner = p.owner === 0 ? m.p1 : m.p2;
      var victim = p.owner === 0 ? m.p2 : m.p1;
      var vInput = m.inputs[victim.side];
      var hb = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
      if (overlap(hb, bodyBox(victim)) && p.hits < (spec.hits || 1) + (p.exploded ? 1 : 0)) {
        var blocked = isBlocking(victim, vInput, spec.height || "mid");
        applyHit(m, owner, victim, spec, spec, blocked);
        p.hits += 1;
        if (spec.kind === "boomerang" || pr.traj === "updown") {
          next.push(p);
          continue;
        }
        if (spec.kind !== "projectile" || (pr.traj !== "beamchunk" && pr.traj !== "grow" && pr.traj !== "accelerate")) {
          if (!p.exploded) continue;
        }
      }
      next.push(p);
    }
    m.projectiles = next;
  }

  function physics(f) {
    var mul = f.slow > 0 ? f.slowMul : 1;
    if (f.slow > 0) f.slow--;
    f.x += f.vx * mul;
    if (f.airborne) {
      f.vy += C.GRAVITY;
      f.y += f.vy;
      if (f.y >= C.GROUND) {
        f.y = C.GROUND;
        f.vy = 0;
        f.airborne = false;
        if (f.state === "jump") setState(f, "idle");
        if (f.state === "ko") { f.vx = 0; }
      }
    } else {
      f.vx *= C.FRICTION;
      if (Math.abs(f.vx) < 0.15) f.vx = 0;
      f.y = C.GROUND;
    }
    var pad = 40;
    if (f.x < pad) f.x = pad;
    if (f.x > C.WIDTH - pad) f.x = C.WIDTH - pad;
  }

  function tickSpecialPhysics(f) {
    if (f.state !== "special" || !f.attack || !f.attack.special) return;
    var s = f.attack.special;
    if (s.kind === "dash" && f.attack.t >= s.startup) {
      f.vx = f.facing * (s.vx || 8);
    }
    if (s.kind === "uppercut" && f.attack.t === s.startup) {
      f.vy = s.vy || -13;
      f.vx = f.facing * (s.vx || 2);
      f.airborne = true;
    }
    if (s.kind === "dive" && f.attack.t >= s.startup) {
      f.vx = f.facing * (s.vx || 7);
      f.vy = s.vy || 9;
      f.airborne = true;
    }
    if (s.kind === "spin" && f.attack.t >= s.startup) {
      f.vx = f.facing * (s.vx || 3.5);
    }
    if (s.kind === "teleport" && f.attack.t === s.startup) {
      f.invuln = 8;
    }
    if (s.kind === "teleport" && f.attack.t === s.startup + 1) {
      /* destination applied after we know opponent — handled in stepFighter via match */
    }
  }

  function stepFighter(m, f, foe, input) {
    pushBuffer(f, input);
    if (f.invuln > 0) f.invuln--;
    if (f.hitstun > 0) {
      f.hitstun--;
      f.state = "hitstun";
      f.stateT++;
      physics(f);
      return;
    }
    if (f.blockstun > 0) {
      f.blockstun--;
      f.state = "block";
      f.crouch = !!input.down;
      f.stateT++;
      physics(f);
      return;
    }
    if (f.state === "ko") {
      f.stateT++;
      physics(f);
      return;
    }

    if (f.state === "special" && f.attack && f.attack.special && f.attack.special.kind === "teleport" && f.attack.t === 1) {
      f.x = foe.x + (foe.facing > 0 ? -1 : 1) * (f.attack.special.behind || 70);
      f.facing = foe.x >= f.x ? 1 : -1;
    }

    if (trySpecial(f)) {
      tickSpecialPhysics(f);
      if (f.attack) f.attack.t++;
      f.stateT++;
      physics(f);
      return;
    }

    if (f.state === "attack" || f.state === "special") {
      f.attack.t++;
      tickSpecialPhysics(f);
      var mv = f.attack.move;
      var total = mv.startup + mv.active + mv.recovery;
      if (f.attack.t >= total) {
        f.attack = null;
        f.lastSpecial = f.lastSpecial;
        setState(f, f.airborne ? "jump" : "idle");
      }
      f.stateT++;
      physics(f);
      return;
    }

    if (tryNormal(f, input)) {
      if (f.attack) f.attack.t++;
      f.stateT++;
      physics(f);
      return;
    }

    var away = holdingAway(f, input);
    f.crouch = !f.airborne && !!input.down;
    if (!f.airborne && input.up && !input.down) {
      f.vy = f.def.jumpV;
      f.airborne = true;
      setState(f, "jump");
    } else if (f.airborne) {
      if (input.left) f.vx = -f.def.speed * 0.9;
      else if (input.right) f.vx = f.def.speed * 0.9;
      setState(f, "jump");
    } else if (f.crouch) {
      f.vx = 0;
      setState(f, away ? "block" : "crouch");
    } else if (away && (input.left || input.right)) {
      f.vx = 0;
      setState(f, "block");
    } else if (input.left) {
      f.vx = -f.def.speed;
      setState(f, "walk");
    } else if (input.right) {
      f.vx = f.def.speed;
      setState(f, "walk");
    } else {
      setState(f, "idle");
    }
    f.stateT++;
    physics(f);
  }

  function separate(m) {
    var a = m.p1, b = m.p2;
    var gap = (a.def.width + b.def.width) / 2 - 4;
    var dx = b.x - a.x;
    if (Math.abs(dx) < gap && !a.airborne && !b.airborne) {
      var push = (gap - Math.abs(dx)) / 2;
      if (dx >= 0) { a.x -= push; b.x += push; }
      else { a.x += push; b.x -= push; }
    }
  }

  function checkRoundEnd(m) {
    if (m.roundOver) return;
    var p1k = m.p1.health <= 0;
    var p2k = m.p2.health <= 0;
    if (p1k && p2k) {
      m.roundOver = true;
      m.roundResult = { type: "doubleko", winner: null };
      m.announce = "DOUBLE K.O.";
      m.announceT = 90;
      return;
    }
    if (p1k || p2k) {
      m.roundOver = true;
      var w = p2k ? 0 : 1;
      m.wins[w] += 1;
      m.roundResult = { type: "ko", winner: w };
      m.announce = "K.O.";
      m.announceT = 90;
      if (m.wins[w] >= C.ROUNDS_TO_WIN) {
        m.matchOver = true;
        m.winner = w;
      }
      return;
    }
    if (m.timer <= 0) {
      m.roundOver = true;
      if (m.p1.health > m.p2.health) {
        m.wins[0] += 1;
        m.roundResult = { type: "timeout", winner: 0 };
        m.announce = "TIME OVER";
      } else if (m.p2.health > m.p1.health) {
        m.wins[1] += 1;
        m.roundResult = { type: "timeout", winner: 1 };
        m.announce = "TIME OVER";
      } else {
        m.roundResult = { type: "draw", winner: null };
        m.announce = "DRAW";
      }
      m.announceT = 90;
      if (m.roundResult.winner != null && m.wins[m.roundResult.winner] >= C.ROUNDS_TO_WIN) {
        m.matchOver = true;
        m.winner = m.roundResult.winner;
      }
    }
  }

  function startNextRound(m) {
    if (m.matchOver) return m;
    var id1 = m.p1.id, id2 = m.p2.id;
    var wins = m.wins.slice();
    var round = m.round + 1;
    var fresh = createMatch(id1, id2, { stage: m.stage });
    fresh.wins = wins;
    fresh.round = round;
    fresh.announce = "ROUND " + round;
    fresh.announceT = 50;
    return fresh;
  }

  function injectInput(m, side, partial) {
    var cur = m.inputs[side];
    var keys = Object.keys(partial);
    for (var i = 0; i < keys.length; i++) cur[keys[i]] = partial[keys[i]];
  }

  function clearInputs(m) {
    m.inputs[0] = emptyInput();
    m.inputs[1] = emptyInput();
  }

  function step(m) {
    if (m.announceT > 0 && m.announce && (m.announce.indexOf("ROUND") === 0 || m.announce === "FIGHT")) {
      m.announceT--;
      if (m.announce.indexOf("ROUND") === 0 && m.announceT === 0) {
        m.announce = "FIGHT";
        m.announceT = 30;
      }
      m.frame++;
      return m;
    }
    if (m.roundOver) {
      m.announceT--;
      m.frame++;
      physics(m.p1);
      physics(m.p2);
      return m;
    }
    if (m.hitstop > 0) {
      m.hitstop--;
      m.frame++;
      return m;
    }
    if (!m.timerFrozen) m.timer = Math.max(0, m.timer - 1);
    if (m.p1.state !== "attack" && m.p1.state !== "special" && m.p1.state !== "hitstun" && !m.p1.airborne) {
      if (m.p2.state !== "attack" && m.p2.state !== "special") faceEachOther(m);
    }
    stepFighter(m, m.p1, m.p2, m.inputs[0]);
    stepFighter(m, m.p2, m.p1, m.inputs[1]);
    separate(m);
    resolveAttack(m, m.p1, m.p2, m.inputs[1]);
    resolveAttack(m, m.p2, m.p1, m.inputs[0]);
    stepProjectiles(m);
    checkRoundEnd(m);
    m.frame++;
    if (m.koFlash > 0) m.koFlash--;
    return m;
  }

  function stepFrames(m, n) {
    for (var i = 0; i < n; i++) step(m);
    return m;
  }

  function hold(m, side, input, frames) {
    injectInput(m, side, input);
    stepFrames(m, frames);
    return m;
  }

  /**
   * Fire a special by injecting the documented motion, then the button.
   * Motion digits are facing-relative (6 = toward opponent).
   */
  function performMotion(m, side, motion, button) {
    var f = side === 0 ? m.p1 : m.p2;
    var towardRight = f.facing > 0;
    function dirToKeys(d) {
      var keys = emptyInput();
      var world = facingRel(d, towardRight ? 1 : -1);
      if (world === 1 || world === 2 || world === 3) keys.down = true;
      if (world === 7 || world === 8 || world === 9) keys.up = true;
      if (world === 1 || world === 4 || world === 7) keys.left = true;
      if (world === 3 || world === 6 || world === 9) keys.right = true;
      return keys;
    }
    var seq = motion.split("").map(function (ch) { return parseInt(ch, 10); });
    if (motion === "46") {
      var back = dirToKeys(4);
      injectInput(m, side, back);
      stepFrames(m, 10);
    }
    for (var i = 0; i < seq.length; i++) {
      var k = dirToKeys(seq[i]);
      injectInput(m, side, k);
      stepFrames(m, 2);
    }
    var last = dirToKeys(seq[seq.length - 1]);
    last[button] = true;
    injectInput(m, side, last);
    stepFrames(m, 1);
    last[button] = false;
    injectInput(m, side, last);
    return m;
  }

  function snapshot(m) {
    return {
      frame: m.frame,
      timer: m.timer,
      timerSec: Math.ceil(m.timer / C.FPS),
      round: m.round,
      wins: m.wins.slice(),
      roundOver: m.roundOver,
      roundResult: m.roundResult ? clone(m.roundResult) : null,
      matchOver: m.matchOver,
      winner: m.winner,
      announce: m.announce,
      projectiles: m.projectiles.map(function (p) {
        return {
          owner: p.owner,
          id: p.spec.id,
          kind: p.spec.kind,
          traj: p.spec.projectile ? p.spec.projectile.traj : null,
          x: p.x, y: p.y, w: p.w, h: p.h
        };
      }),
      p1: snapF(m.p1),
      p2: snapF(m.p2)
    };
  }

  function snapF(f) {
    return {
      id: f.id,
      name: f.def.name,
      x: f.x,
      y: f.y,
      vx: f.vx,
      vy: f.vy,
      facing: f.facing,
      health: f.health,
      maxHealth: f.maxHealth,
      state: f.state,
      crouch: f.crouch,
      airborne: f.airborne,
      lastSpecial: f.lastSpecial,
      attackId: f.attack && f.attack.special ? f.attack.special.id : (f.attack ? f.attack.move.name : null),
      attackKind: f.attack && f.attack.special ? f.attack.special.kind : (f.attack ? "normal" : null)
    };
  }

  var Engine = {
    CONST: C,
    Roster: Roster,
    createMatch: createMatch,
    step: step,
    stepFrames: stepFrames,
    injectInput: injectInput,
    clearInputs: clearInputs,
    hold: hold,
    performMotion: performMotion,
    startNextRound: startNextRound,
    snapshot: snapshot,
    emptyInput: emptyInput,
    bodyBox: bodyBox,
    isBlocking: isBlocking,
    selectVersusStart: function (id1, id2) {
      return createMatch(id1, id2);
    }
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Engine;
  root.BBEngine = Engine;
})(typeof globalThis !== "undefined" ? globalThis : this);

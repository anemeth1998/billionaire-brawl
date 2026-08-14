/**
 * Drives the shipped combat / input / round engine. No hardcoded pixels,
 * no re-implementation of the unit under test.
 */
var assert = require("assert");
var path = require("path");
var Engine = require(path.join(__dirname, "..", "js", "engine.js"));

var passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log("ok  " + name);
}

function settle(m) {
  var guard = 0;
  while (m.announceT > 0 && guard < 200) {
    Engine.step(m);
    guard++;
  }
  Engine.clearInputs(m);
  return m;
}

function walkTogether(m, frames) {
  Engine.injectInput(m, 0, { right: true });
  Engine.injectInput(m, 1, { left: true });
  Engine.stepFrames(m, frames || 70);
  Engine.clearInputs(m);
  Engine.stepFrames(m, 4);
}

test("createMatch starts from a real match/fighter start state", function () {
  var m = Engine.createMatch("musk", "bezos");
  var s = Engine.snapshot(m);
  assert.strictEqual(s.p1.id, "musk");
  assert.strictEqual(s.p2.id, "bezos");
  assert.strictEqual(s.p1.health, s.p1.maxHealth);
  assert.strictEqual(s.p2.health, s.p2.maxHealth);
  assert.ok(s.p1.maxHealth > 0);
  assert.strictEqual(s.round, 1);
  assert.deepStrictEqual(s.wins, [0, 0]);
  assert.strictEqual(s.matchOver, false);
  assert.ok(s.p1.x < s.p2.x, "fighters face off on a shared plane");
  assert.strictEqual(s.p1.state, "idle");
  assert.strictEqual(s.p2.state, "idle");
  assert.ok(s.timer > 0);
});

test("connecting standing punch reduces opponent health", function () {
  var m = Engine.createMatch("musk", "bezos");
  settle(m);
  var before = Engine.snapshot(m).p2.health;
  walkTogether(m, 80);
  Engine.injectInput(m, 0, { punch: true });
  Engine.step(m);
  Engine.injectInput(m, 0, { punch: false });
  Engine.stepFrames(m, 20);
  var after = Engine.snapshot(m).p2.health;
  assert.ok(after < before, "expected health drop, before=" + before + " after=" + after);
  assert.ok(after > 0, "one jab should not KO");
});

test("health 0 yields a KO win for the attacker", function () {
  var m = Engine.createMatch("huang", "page");
  settle(m);
  m.p2.health = 40;
  walkTogether(m, 80);
  Engine.injectInput(m, 0, { punch: true });
  Engine.step(m);
  Engine.injectInput(m, 0, { punch: false });
  Engine.stepFrames(m, 25);
  var s = Engine.snapshot(m);
  assert.ok(s.p2.health <= 0, "defender should be at 0, got " + s.p2.health);
  assert.strictEqual(s.roundOver, true);
  assert.ok(s.roundResult, "round result set");
  assert.strictEqual(s.roundResult.type, "ko");
  assert.strictEqual(s.roundResult.winner, 0);
  assert.strictEqual(s.wins[0], 1);
});

test("block (away) prevents or reduces that same attack vs an unblocked hit", function () {
  function jabDamage(block) {
    var m = Engine.createMatch("musk", "buffett");
    settle(m);
    walkTogether(m, 90);
    var before = m.p2.health;
    if (block) {
      Engine.injectInput(m, 1, { right: true });
      Engine.stepFrames(m, 3);
    }
    Engine.injectInput(m, 0, { punch: true });
    Engine.step(m);
    Engine.injectInput(m, 0, { punch: false });
    Engine.stepFrames(m, 18);
    return before - m.p2.health;
  }
  var open = jabDamage(false);
  var blocked = jabDamage(true);
  assert.ok(open > 0, "unblocked jab must deal damage, got " + open);
  assert.ok(blocked < open, "block must prevent or reduce, open=" + open + " blocked=" + blocked);
});

test("documented special-input sequence produces that character's special, not a normal", function () {
  var m = Engine.createMatch("musk", "dell");
  settle(m);
  Engine.performMotion(m, 0, "236", "punch");
  Engine.stepFrames(m, 16);
  var s = Engine.snapshot(m);
  var fired = s.p1.lastSpecial === "tweetstorm" ||
    s.p1.attackId === "tweetstorm" ||
    s.projectiles.some(function (p) { return p.id === "tweetstorm"; });
  assert.ok(fired, "expected tweetstorm special, snapshot=" + JSON.stringify({
    lastSpecial: s.p1.lastSpecial,
    attackId: s.p1.attackId,
    attackKind: s.p1.attackKind,
    state: s.p1.state,
    projectiles: s.projectiles
  }));
  assert.notStrictEqual(s.p1.attackKind, "normal");
  var kinds = {};
  Engine.Roster.fighters.forEach(function (f) {
    f.specials.forEach(function (sp) { kinds[sp.id] = (kinds[sp.id] || 0) + 1; });
  });
  assert.strictEqual(kinds.tweetstorm, 1, "tweetstorm is unique to musk");
});

test("Bezos 623+P blueorigin spawns an updown rocket that deals damage", function () {
  var spec = Engine.Roster.byId("bezos").specials.filter(function (s) { return s.id === "blueorigin"; })[0];
  assert.ok(spec, "roster must define blueorigin");
  assert.ok(spec.projectile, "blueorigin is a projectile special");
  var m = Engine.createMatch("bezos", "page");
  settle(m);
  var startGap = Engine.snapshot(m).p2.x - Engine.snapshot(m).p1.x;
  assert.ok(startGap > 200, "start from real spaced-apart match state");
  Engine.injectInput(m, 0, { right: true });
  Engine.injectInput(m, 1, { left: true });
  Engine.stepFrames(m, 50);
  Engine.clearInputs(m);
  Engine.stepFrames(m, 2);
  var midGap = Engine.snapshot(m).p2.x - Engine.snapshot(m).p1.x;
  assert.ok(midGap > 80, "close enough to reach, still not stacked, gap=" + midGap);
  var before = Engine.snapshot(m).p2.health;
  Engine.performMotion(m, 0, spec.motion, spec.button);
  var saw = null;
  for (var i = 0; i < 30; i++) {
    Engine.step(m);
    var snap = Engine.snapshot(m);
    for (var p = 0; p < snap.projectiles.length; p++) {
      if (snap.projectiles[p].id === "blueorigin") saw = snap.projectiles[p];
    }
    if (saw) break;
  }
  assert.strictEqual(Engine.snapshot(m).p1.lastSpecial, "blueorigin");
  assert.ok(saw, "blueorigin must spawn a visible rocket");
  assert.strictEqual(saw.kind, "boomerang");
  assert.strictEqual(saw.traj, spec.projectile.traj);
  Engine.injectInput(m, 1, { left: true });
  var damaged = false;
  var stillAlive = false;
  for (var j = 0; j < 200; j++) {
    Engine.step(m);
    var s2 = Engine.snapshot(m);
    for (var q = 0; q < s2.projectiles.length; q++) {
      if (s2.projectiles[q].id === "blueorigin") stillAlive = true;
    }
    if (s2.p2.health < before) {
      damaged = true;
      break;
    }
  }
  assert.ok(stillAlive || damaged, "rocket must remain in play long enough to be walked into");
  assert.ok(damaged, "walking into the live rocket must deal damage, p2=" + Engine.snapshot(m).p2.health);
});

test("timeout with unequal health awards the round to the higher-health fighter", function () {
  var m = Engine.createMatch("page", "brin");
  settle(m);
  m.p1.health = 700;
  m.p2.health = 400;
  m.timer = 5;
  Engine.stepFrames(m, 8);
  var s = Engine.snapshot(m);
  assert.strictEqual(s.roundOver, true);
  assert.strictEqual(s.roundResult.type, "timeout");
  assert.strictEqual(s.roundResult.winner, 0);
  assert.strictEqual(s.wins[0], 1);
  assert.strictEqual(s.p1.health, 700);
  assert.strictEqual(s.p2.health, 400);
});

test("first to two rounds ends the match", function () {
  var m = Engine.createMatch("ellison", "arnault");
  settle(m);
  m.p2.health = 20;
  walkTogether(m, 80);
  Engine.injectInput(m, 0, { punch: true });
  Engine.step(m);
  Engine.clearInputs(m);
  Engine.stepFrames(m, 20);
  assert.strictEqual(Engine.snapshot(m).wins[0], 1);
  assert.strictEqual(Engine.snapshot(m).matchOver, false);
  m = Engine.startNextRound(m);
  settle(m);
  assert.strictEqual(m.round, 2);
  assert.deepStrictEqual(m.wins, [1, 0]);
  m.p2.health = 20;
  walkTogether(m, 80);
  Engine.injectInput(m, 0, { punch: true });
  Engine.step(m);
  Engine.clearInputs(m);
  Engine.stepFrames(m, 20);
  var s = Engine.snapshot(m);
  assert.strictEqual(s.wins[0], 2);
  assert.strictEqual(s.matchOver, true);
  assert.strictEqual(s.winner, 0);
});

test("walk / jump / crouch change fighter state on the shared plane", function () {
  var m = Engine.createMatch("zuck", "huang");
  settle(m);
  var x0 = m.p1.x;
  Engine.injectInput(m, 0, { right: true });
  Engine.stepFrames(m, 20);
  assert.ok(m.p1.x > x0, "walk right");
  assert.strictEqual(Engine.snapshot(m).p1.state, "walk");
  Engine.clearInputs(m);
  Engine.injectInput(m, 0, { down: true });
  Engine.stepFrames(m, 4);
  assert.strictEqual(m.p1.crouch, true);
  Engine.clearInputs(m);
  Engine.injectInput(m, 0, { up: true });
  Engine.stepFrames(m, 3);
  assert.strictEqual(m.p1.airborne, true);
});

console.log("\n" + passed + " combat tests passed");

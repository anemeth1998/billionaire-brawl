/**
 * Exercises shipped roster + select-then-versus. No re-implementation.
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var Engine = require(path.join(__dirname, "..", "js", "engine.js"));
var Roster = require(path.join(__dirname, "..", "js", "roster.js"));

var passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log("ok  " + name);
}

test("ten names match the dated Forbes ranking snapshot recorded in-repo", function () {
  var snap = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "ranking.json"), "utf8"));
  assert.strictEqual(snap.source.indexOf("Forbes") >= 0, true);
  assert.ok(snap.rankingAsOf);
  assert.strictEqual(snap.snapshotRecorded, "2026-08-14");
  assert.strictEqual(snap.fighters.length, 10);
  assert.strictEqual(Roster.fighters.length, 10);
  assert.deepStrictEqual(
    Roster.fighters.map(function (f) { return f.name; }),
    snap.fighters.map(function (f) { return f.name.toUpperCase(); })
  );
  assert.deepStrictEqual(
    Roster.fighters.map(function (f) { return f.rank; }),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  );
  assert.strictEqual(Roster.ranking.rankingAsOf, snap.rankingAsOf);
});

test("each fighter's specials are behaviorally distinct", function () {
  var kinds = Roster.specialKinds();
  var ids = {};
  var signatures = {};
  Roster.fighters.forEach(function (f) {
    assert.ok(f.specials.length >= 2, f.id + " needs unique specials");
    var sigSet = {};
    f.specials.forEach(function (s) {
      assert.ok(s.id, "special missing id");
      assert.ok(s.kind, s.id + " missing kind");
      assert.ok(s.motion, s.id + " missing motion");
      assert.ok(!ids[s.id], "duplicate special id " + s.id);
      ids[s.id] = f.id;
      var sig = [s.kind, s.projectile ? s.projectile.traj : "-", s.hits || 1, s.damage, s.height].join("/");
      assert.ok(!sigSet[sig], f.id + " has clone specials: " + sig);
      sigSet[sig] = true;
      assert.ok(!signatures[sig], "shared special signature " + sig + " (" + s.id + ")");
      signatures[sig] = s.id;
    });
  });
  assert.ok(Object.keys(ids).length >= 20, "expected many unique special ids, got " + Object.keys(ids).length);
  var musk = kinds.musk.map(function (s) { return s.id; });
  var bezos = kinds.bezos.map(function (s) { return s.id; });
  musk.forEach(function (id) { assert.ok(bezos.indexOf(id) < 0); });
});

test("select-then-versus path starts a match with the chosen pair", function () {
  var chosen = ["buffett", "arnault"];
  var m = Engine.selectVersusStart(chosen[0], chosen[1]);
  var s = Engine.snapshot(m);
  assert.strictEqual(s.p1.id, "buffett");
  assert.strictEqual(s.p2.id, "arnault");
  assert.strictEqual(s.round, 1);
  assert.ok(s.p1.x < s.p2.x);
  assert.strictEqual(s.p1.health, Roster.byId("buffett").maxHealth);
  assert.strictEqual(s.p2.health, Roster.byId("arnault").maxHealth);
});

test("every ranked id is selectable and produces a distinct projectile or hit property", function () {
  Roster.ids().forEach(function (id, i) {
    var opp = Roster.ids()[(i + 1) % 10];
    var m = Engine.selectVersusStart(id, opp);
    assert.strictEqual(m.p1.id, id);
    var specials = Roster.byId(id).specials;
    var trajs = specials.map(function (s) {
      return s.kind + ":" + (s.projectile && s.projectile.traj ? s.projectile.traj : s.kind);
    });
    assert.strictEqual(new Set(trajs).size, trajs.length, id + " specials share a trajectory");
  });
});

console.log("\n" + passed + " roster tests passed");

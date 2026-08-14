/**
 * Dated top-ten roster + idiosyncratic movesets.
 * Loaded by both the browser (script src) and Node tests (require).
 */
(function (root) {
  var RANKING = {
    source: "Forbes, The Top 10 Richest People In The World | August 2026",
    sourceUrl: "https://www.forbes.com/sites/forbeswealthteam/article/the-top-ten-richest-people-in-the-world/",
    rankingAsOf: "2026-08-01T00:00:00-04:00",
    snapshotRecorded: "2026-08-14"
  };

  function nrm(name, dmg, startup, active, recovery, box, height, chip) {
    return {
      name: name,
      damage: dmg,
      startup: startup,
      active: active,
      recovery: recovery,
      hitbox: box,
      height: height || "mid",
      chip: chip || 0,
      knockback: Math.round(dmg * 0.18),
      hitstun: 10 + Math.round(dmg / 12),
      blockstun: 6 + Math.round(dmg / 20)
    };
  }

  function fighter(spec) {
    spec.normals = spec.normals || {
      punch: nrm("jab", 55, 3, 3, 8, { x: 28, y: -92, w: 42, h: 28 }, "high", 0),
      kick: nrm("forward kick", 78, 5, 4, 12, { x: 24, y: -70, w: 54, h: 32 }, "mid", 0),
      crouchPunch: nrm("low jab", 48, 3, 3, 8, { x: 26, y: -48, w: 40, h: 24 }, "low", 0),
      crouchKick: nrm("sweep", 82, 6, 4, 16, { x: 20, y: -22, w: 62, h: 22 }, "low", 0),
      jumpPunch: nrm("jump punch", 62, 4, 8, 4, { x: 22, y: -80, w: 40, h: 36 }, "overhead", 0),
      jumpKick: nrm("jump kick", 74, 5, 10, 4, { x: 18, y: -50, w: 52, h: 30 }, "overhead", 0)
    };
    spec.maxHealth = spec.maxHealth || 1000;
    spec.width = spec.width || 56;
    spec.height = spec.height || 158;
    spec.speed = spec.speed || 3.15;
    spec.jumpV = spec.jumpV || -15.4;
    return spec;
  }

  var FIGHTERS = [
    fighter({
      id: "musk",
      name: "ELON MUSK",
      short: "MUSK",
      rank: 1,
      fortune: "$690B",
      company: "SpaceX, Tesla",
      flavor: "Impulse tweets, reusable rockets, all-in bets.",
      color: "#cc2a2a",
      accent: "#111111",
      skin: "#e6b089",
      hair: "#3a2a1a",
      speed: 3.4,
      jumpV: -16.2,
      specials: [
        {
          id: "tweetstorm",
          name: "TWEET STORM",
          motion: "236",
          button: "punch",
          kind: "projectile",
          startup: 11,
          active: 3,
          recovery: 22,
          damage: 90,
          height: "high",
          chip: 0.18,
          projectile: {
            w: 72, h: 48, speed: 8.2, life: 78, traj: "horizontal",
            color: "#1da1f2", label: "POST"
          }
        },
        {
          id: "falcondive",
          name: "FALCON DIVE",
          motion: "214",
          button: "kick",
          kind: "dive",
          startup: 8,
          active: 16,
          recovery: 14,
          damage: 110,
          height: "overhead",
          chip: 0.12,
          vx: 7.4,
          vy: 9.5,
          hitbox: { x: 10, y: -40, w: 48, h: 40 }
        },
        {
          id: "starship",
          name: "STARSHIP",
          motion: "623",
          button: "punch",
          kind: "uppercut",
          startup: 4,
          active: 12,
          recovery: 22,
          damage: 130,
          height: "mid",
          chip: 0.1,
          vx: 2.2,
          vy: -13.5,
          hitbox: { x: 8, y: -150, w: 40, h: 150 }
        }
      ]
    }),
    fighter({
      id: "page",
      name: "LARRY PAGE",
      short: "PAGE",
      rank: 2,
      fortune: "$292B",
      company: "Google",
      flavor: "Quiet PageRank, moonshots, let the index decide.",
      color: "#4285f4",
      accent: "#34a853",
      skin: "#f0c8a0",
      hair: "#2b241c",
      speed: 3.05,
      specials: [
        {
          id: "pagerank",
          name: "PAGE RANK",
          motion: "236",
          button: "punch",
          kind: "projectile",
          startup: 14,
          active: 3,
          recovery: 24,
          damage: 70,
          height: "mid",
          chip: 0.16,
          projectile: {
            w: 26, h: 26, speed: 3.4, life: 110, traj: "grow",
            grow: 0.045, color: "#fbbc05", label: "#"
          }
        },
        {
          id: "androidcrawl",
          name: "ANDROID CRAWL",
          motion: "214",
          button: "kick",
          kind: "projectile",
          startup: 12,
          active: 3,
          recovery: 20,
          damage: 28,
          hits: 3,
          height: "low",
          chip: 0.1,
          projectile: {
            w: 34, h: 16, speed: 4.6, life: 70, traj: "lowcrawl",
            color: "#34a853", label: "droid", yOff: 14
          }
        },
        {
          id: "vacuumsearch",
          name: "VACUUM SEARCH",
          motion: "623",
          button: "punch",
          kind: "suction",
          startup: 8,
          active: 18,
          recovery: 16,
          damage: 40,
          height: "mid",
          chip: 0.08,
          pull: 6.5,
          hitbox: { x: 20, y: -110, w: 210, h: 110 }
        }
      ]
    }),
    fighter({
      id: "bezos",
      name: "JEFF BEZOS",
      short: "BEZOS",
      rank: 3,
      fortune: "$278B",
      company: "Amazon",
      flavor: "Same-day delivery, warehouse grind, New Shepard hops.",
      color: "#ff9900",
      accent: "#232f3e",
      skin: "#f3d2b0",
      hair: "#d8d8d8",
      speed: 2.85,
      width: 62,
      specials: [
        {
          id: "primedrone",
          name: "PRIME DRONE",
          motion: "236",
          button: "punch",
          kind: "projectile",
          startup: 13,
          active: 3,
          recovery: 23,
          damage: 95,
          height: "mid",
          chip: 0.15,
          projectile: {
            w: 32, h: 22, speed: 5.2, life: 90, traj: "arc",
            arc: -7.2, gravity: 0.28, color: "#ff9900", label: "BOX"
          }
        },
        {
          id: "blueorigin",
          name: "BLUE ORIGIN",
          motion: "623",
          button: "punch",
          kind: "boomerang",
          startup: 10,
          active: 28,
          recovery: 18,
          damage: 105,
          hits: 2,
          height: "mid",
          chip: 0.12,
          projectile: {
            w: 28, h: 48, speed: 0, life: 90, traj: "updown",
            upSpeed: -11, color: "#005eb8", label: "NS"
          }
        },
        {
          id: "warehouserush",
          name: "WAREHOUSE RUSH",
          motion: "46",
          button: "punch",
          kind: "dash",
          startup: 6,
          active: 14,
          recovery: 16,
          damage: 100,
          height: "mid",
          chip: 0.1,
          armor: true,
          vx: 9.2,
          hitbox: { x: 4, y: -100, w: 70, h: 100 }
        }
      ]
    }),
    fighter({
      id: "brin",
      name: "SERGEY BRIN",
      short: "BRIN",
      rank: 4,
      fortune: "$269B",
      company: "Google",
      flavor: "Glass beams, Gemini twins, hands-on model tweaks.",
      color: "#ea4335",
      accent: "#4285f4",
      skin: "#e8b896",
      hair: "#4a3728",
      speed: 3.25,
      specials: [
        {
          id: "glassbeam",
          name: "GLASS BEAM",
          motion: "236",
          button: "punch",
          kind: "beam",
          startup: 7,
          active: 6,
          recovery: 20,
          damage: 88,
          height: "high",
          chip: 0.22,
          beam: { length: 280, h: 10, color: "#7ad7ff" }
        },
        {
          id: "geminisplit",
          name: "GEMINI SPLIT",
          motion: "214",
          button: "punch",
          kind: "clone",
          startup: 9,
          active: 16,
          recovery: 18,
          damage: 64,
          height: "mid",
          chip: 0.1,
          projectile: {
            w: 40, h: 70, speed: 5.6, life: 28, traj: "clone",
            color: "#ea4335", label: "G2"
          }
        },
        {
          id: "deepdive",
          name: "DEEP DIVE",
          motion: "623",
          button: "kick",
          kind: "dive",
          startup: 7,
          active: 14,
          recovery: 16,
          damage: 102,
          height: "overhead",
          chip: 0.1,
          vx: 5.2,
          vy: 11.2,
          hitbox: { x: 6, y: -36, w: 50, h: 36 }
        }
      ]
    }),
    fighter({
      id: "dell",
      name: "MICHAEL DELL",
      short: "DELL",
      rank: 5,
      fortune: "$229B",
      company: "Dell Technologies",
      flavor: "Dorm-room direct sales, stack the towers, refresh the cycle.",
      color: "#0076ce",
      accent: "#111111",
      skin: "#efc8a4",
      hair: "#c8c8c8",
      speed: 2.95,
      specials: [
        {
          id: "directsale",
          name: "DIRECT SALE",
          motion: "236",
          button: "punch",
          kind: "burst",
          startup: 5,
          active: 8,
          recovery: 16,
          damage: 96,
          height: "mid",
          chip: 0.14,
          hitbox: { x: 20, y: -90, w: 86, h: 70 }
        },
        {
          id: "towerstack",
          name: "TOWER STACK",
          motion: "623",
          button: "punch",
          kind: "uppercut",
          startup: 5,
          active: 16,
          recovery: 20,
          damage: 42,
          hits: 3,
          height: "mid",
          chip: 0.1,
          vx: 1.4,
          vy: -11.8,
          hitbox: { x: 10, y: -160, w: 36, h: 160 }
        },
        {
          id: "refreshcycle",
          name: "REFRESH CYCLE",
          motion: "214",
          button: "kick",
          kind: "spin",
          startup: 6,
          active: 18,
          recovery: 14,
          damage: 36,
          hits: 3,
          height: "mid",
          chip: 0.1,
          vx: 4.8,
          hitbox: { x: -10, y: -80, w: 80, h: 70 }
        }
      ]
    }),
    fighter({
      id: "zuck",
      name: "MARK ZUCKERBERG",
      short: "ZUCK",
      rank: 6,
      fortune: "$191B",
      company: "Meta",
      flavor: "Like bombs, metaverse glitches, harvest the graph.",
      color: "#0668e1",
      accent: "#7b5cff",
      skin: "#f0c090",
      hair: "#1c140e",
      speed: 3.5,
      height: 150,
      specials: [
        {
          id: "likebomb",
          name: "LIKE BOMB",
          motion: "236",
          button: "punch",
          kind: "projectile",
          startup: 12,
          active: 3,
          recovery: 22,
          damage: 120,
          height: "mid",
          chip: 0.16,
          projectile: {
            w: 24, h: 24, speed: 4.4, life: 36, traj: "explode",
            explodeAt: 28, explodeW: 90, explodeH: 80, color: "#0668e1", label: "♥"
          }
        },
        {
          id: "metaverse",
          name: "METAVERSE GLITCH",
          motion: "214",
          button: "punch",
          kind: "teleport",
          startup: 10,
          active: 4,
          recovery: 12,
          damage: 70,
          height: "mid",
          chip: 0,
          behind: 70,
          hitbox: { x: -20, y: -100, w: 50, h: 100 }
        },
        {
          id: "dataharvest",
          name: "DATA HARVEST",
          motion: "623",
          button: "punch",
          kind: "suction",
          startup: 8,
          active: 20,
          recovery: 16,
          damage: 34,
          height: "mid",
          chip: 0.12,
          pull: 4.2,
          hitbox: { x: 16, y: -120, w: 160, h: 120 }
        }
      ]
    }),
    fighter({
      id: "huang",
      name: "JENSEN HUANG",
      short: "HUANG",
      rank: 7,
      fortune: "$174B",
      company: "Nvidia",
      flavor: "CUDA beams, leather-jacket rush, overclock the frame.",
      color: "#76b900",
      accent: "#111111",
      skin: "#d9a878",
      hair: "#1a1a1a",
      speed: 3.35,
      specials: [
        {
          id: "cudabeam",
          name: "CUDA BEAM",
          motion: "236",
          button: "punch",
          kind: "projectile",
          startup: 16,
          active: 4,
          recovery: 26,
          damage: 44,
          hits: 4,
          height: "mid",
          chip: 0.2,
          projectile: {
            w: 70, h: 22, speed: 3.1, life: 70, traj: "beamchunk",
            color: "#76b900", label: "CUDA"
          }
        },
        {
          id: "leatherdash",
          name: "LEATHER DASH",
          motion: "46",
          button: "kick",
          kind: "dash",
          startup: 5,
          active: 10,
          recovery: 14,
          damage: 108,
          height: "overhead",
          chip: 0.08,
          vx: 11.5,
          hitbox: { x: 0, y: -70, w: 76, h: 50 }
        },
        {
          id: "overclock",
          name: "OVERCLOCK",
          motion: "214",
          button: "punch",
          kind: "spin",
          startup: 4,
          active: 22,
          recovery: 12,
          damage: 30,
          hits: 5,
          height: "mid",
          chip: 0.1,
          vx: 3.2,
          hitbox: { x: -16, y: -90, w: 88, h: 90 }
        }
      ]
    }),
    fighter({
      id: "ellison",
      name: "LARRY ELLISON",
      short: "ELLISON",
      rank: 8,
      fortune: "$168B",
      company: "Oracle",
      flavor: "Yacht rams, Lanai slams, drop the database.",
      color: "#c74634",
      accent: "#f4c430",
      skin: "#e8c09a",
      hair: "#e8e8e8",
      speed: 2.7,
      width: 64,
      specials: [
        {
          id: "yachtram",
          name: "YACHT RAM",
          motion: "46",
          button: "punch",
          kind: "dash",
          startup: 8,
          active: 20,
          recovery: 18,
          damage: 140,
          height: "mid",
          chip: 0.12,
          armor: true,
          vx: 8.4,
          hitbox: { x: 0, y: -80, w: 120, h: 70 }
        },
        {
          id: "lanaislam",
          name: "LANAI SLAM",
          motion: "214",
          button: "kick",
          kind: "shockwave",
          startup: 14,
          active: 10,
          recovery: 22,
          damage: 115,
          height: "low",
          chip: 0.14,
          hitbox: { x: -160, y: -28, w: 320, h: 28 }
        },
        {
          id: "dbcrash",
          name: "DATABASE CRASH",
          motion: "236",
          button: "punch",
          kind: "projectile",
          startup: 15,
          active: 3,
          recovery: 24,
          damage: 85,
          height: "overhead",
          chip: 0.12,
          projectile: {
            w: 36, h: 28, speed: 0, life: 50, traj: "drop",
            dropX: 180, color: "#c74634", label: "ORA-"
          }
        }
      ]
    }),
    fighter({
      id: "arnault",
      name: "BERNARD ARNAULT",
      short: "ARNAULT",
      rank: 9,
      fortune: "$146B",
      company: "LVMH",
      flavor: "Trunks as weapons, freeze the runway, Dior spin.",
      color: "#8b6914",
      accent: "#1a1a1a",
      skin: "#e6c2a0",
      hair: "#c8c0b4",
      speed: 2.9,
      specials: [
        {
          id: "trunkthrow",
          name: "TRUNK THROW",
          motion: "236",
          button: "punch",
          kind: "projectile",
          startup: 13,
          active: 3,
          recovery: 21,
          damage: 100,
          height: "mid",
          chip: 0.14,
          projectile: {
            w: 34, h: 26, speed: 6.1, life: 80, traj: "arc",
            arc: -5.4, gravity: 0.22, color: "#8b6914", label: "LV"
          }
        },
        {
          id: "fashionfreeze",
          name: "FASHION FREEZE",
          motion: "214",
          button: "punch",
          kind: "projectile",
          startup: 14,
          active: 4,
          recovery: 24,
          damage: 60,
          height: "mid",
          chip: 0.1,
          slow: 0.45,
          slowFrames: 50,
          projectile: {
            w: 50, h: 70, speed: 2.6, life: 70, traj: "wave",
            color: "#d4af37", label: "FW"
          }
        },
        {
          id: "diorspin",
          name: "DIOR SPIN",
          motion: "623",
          button: "kick",
          kind: "spin",
          startup: 5,
          active: 20,
          recovery: 16,
          damage: 34,
          hits: 4,
          height: "mid",
          chip: 0.1,
          vx: 2.4,
          hitbox: { x: -20, y: -100, w: 80, h: 100 }
        }
      ]
    }),
    fighter({
      id: "buffett",
      name: "WARREN BUFFETT",
      short: "BUFFETT",
      rank: 10,
      fortune: "$145B",
      company: "Berkshire Hathaway",
      flavor: "Value slams, Cherry Coke, compound until it hurts.",
      color: "#003366",
      accent: "#c8102e",
      skin: "#f0d0b0",
      hair: "#f2f2f2",
      speed: 2.45,
      width: 66,
      height: 150,
      specials: [
        {
          id: "valueslam",
          name: "VALUE SLAM",
          motion: "623",
          button: "punch",
          kind: "burst",
          startup: 18,
          active: 6,
          recovery: 20,
          damage: 175,
          height: "mid",
          chip: 0.08,
          hitbox: { x: 16, y: -110, w: 70, h: 110 }
        },
        {
          id: "cherrycoke",
          name: "CHERRY COKE",
          motion: "236",
          button: "punch",
          kind: "projectile",
          startup: 10,
          active: 3,
          recovery: 18,
          damage: 72,
          height: "low",
          chip: 0.12,
          projectile: {
            w: 18, h: 22, speed: 5.4, life: 100, traj: "bounce",
            bounce: 7.5, color: "#c8102e", label: "CC"
          }
        },
        {
          id: "compound",
          name: "COMPOUND INTEREST",
          motion: "214",
          button: "punch",
          kind: "projectile",
          startup: 15,
          active: 3,
          recovery: 24,
          damage: 50,
          height: "mid",
          chip: 0.15,
          projectile: {
            w: 22, h: 22, speed: 2.8, life: 120, traj: "accelerate",
            accel: 0.16, grow: 0.03, color: "#003366", label: "$"
          }
        }
      ]
    })
  ];

  var BY_ID = {};
  for (var i = 0; i < FIGHTERS.length; i++) BY_ID[FIGHTERS[i].id] = FIGHTERS[i];

  var Roster = {
    ranking: RANKING,
    fighters: FIGHTERS,
    byId: function (id) { return BY_ID[id] || null; },
    ids: function () { return FIGHTERS.map(function (f) { return f.id; }); },
    names: function () { return FIGHTERS.map(function (f) { return f.name; }); },
    specialKinds: function () {
      var map = {};
      FIGHTERS.forEach(function (f) {
        map[f.id] = f.specials.map(function (s) {
          return {
            id: s.id,
            kind: s.kind,
            motion: s.motion,
            button: s.button,
            damage: s.damage,
            traj: s.projectile ? s.projectile.traj : null,
            hits: s.hits || 1,
            height: s.height
          };
        });
      });
      return map;
    }
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Roster;
  root.BBRoster = Roster;
})(typeof globalThis !== "undefined" ? globalThis : this);

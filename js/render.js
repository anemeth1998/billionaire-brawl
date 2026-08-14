/**
 * Canvas renderer. No Node module usage — browser <script src> only.
 */
(function (root) {
  var W = 960, H = 540;

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawStage(ctx, t) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1a2744");
    g.addColorStop(0.45, "#3a5080");
    g.addColorStop(0.55, "#c47a4a");
    g.addColorStop(1, "#2a1a12");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#f0c070";
    ctx.beginPath();
    ctx.arc(820, 90, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,200,80,0.18)";
    ctx.beginPath();
    ctx.arc(820, 90, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#152033";
    var sky = [180, 260, 340, 420, 500, 620, 740];
    var ht = [160, 220, 140, 260, 180, 200, 150];
    for (var i = 0; i < sky.length; i++) {
      ctx.fillRect(sky[i], 320 - ht[i], 70, ht[i]);
      ctx.fillStyle = "#e8c040";
      for (var wy = 320 - ht[i] + 12; wy < 310; wy += 16) {
        ctx.fillRect(sky[i] + 8, wy, 8, 8);
        ctx.fillRect(sky[i] + 22, wy, 8, 8);
        ctx.fillRect(sky[i] + 36, wy, 8, 8);
      }
      ctx.fillStyle = "#152033";
    }

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 390, W, 30);

    var floor = ctx.createLinearGradient(0, 400, 0, H);
    floor.addColorStop(0, "#8a5a32");
    floor.addColorStop(0.15, "#6a4224");
    floor.addColorStop(1, "#2c1810");
    ctx.fillStyle = floor;
    ctx.fillRect(0, 400, W, H - 400);

    ctx.strokeStyle = "rgba(255,220,120,0.18)";
    ctx.lineWidth = 2;
    for (var x = -80; x < W + 80; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x + (t % 48), 400);
      ctx.lineTo(x - 80 + (t % 48), H);
      ctx.stroke();
    }
    ctx.fillStyle = "#c4a46a";
    ctx.fillRect(0, 396, W, 6);
    ctx.fillStyle = "#6a4228";
    for (var bx = 0; bx < W; bx += 36) {
      ctx.fillRect(bx, 430, 34, 14);
      ctx.fillRect(bx + 18, 446, 34, 14);
      ctx.fillRect(bx, 462, 34, 14);
    }

    ctx.fillStyle = "rgba(20,40,20,0.55)";
    ctx.font = "bold 13px monospace";
    ctx.fillText("DJIA  48210   NASDAQ  22104   SPACE  -3.8   AMZN  +1.4   NVDA  +0.6", 18, 418);
  }

  function drawFighter(ctx, f, t) {
    var def = f.def;
    var facing = f.facing;
    if (f.state === "ko") {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(facing, 1);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.ellipse(16, 4, 54, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(8, -16);
      ctx.rotate(-1.35);
      ctx.fillStyle = def.color;
      ctx.fillRect(-52, -16, 96, 26);
      ctx.fillStyle = def.skin;
      ctx.beginPath();
      ctx.arc(50, -2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = def.hair;
      ctx.beginPath();
      ctx.arc(54, -6, 11, 0, Math.PI);
      ctx.fill();
      ctx.restore();
      return;
    }
    var bob = (f.state === "idle") ? Math.sin(t / 9) * 2 : 0;
    var crouch = f.crouch ? 22 : 0;
    ctx.save();
    ctx.translate(f.x, f.y + bob);
    ctx.scale(facing, 1);

    if (f.state === "hitstun") ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 1.4);
    if (f.invuln > 0) ctx.globalAlpha = (t % 4) < 2 ? 0.35 : 1;

    var walk = f.state === "walk" ? Math.sin(t / 4.5) : 0;
    var punch = f.state === "attack" || (f.state === "special" && f.attack && f.attack.special && /punch|beam|slam|storm|rank|drone|sale|bomb|crash|throw|interest/i.test(f.attack.special.id + (f.attack.special.name || "")));
    var kick = (f.state === "attack" || f.state === "special") && !punch && f.attack;
    var blocking = f.state === "block";
    var jumping = f.airborne;

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    /* rear leg / lead leg — side-view fighting stance */
    ctx.strokeStyle = def.accent;
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-6, -58 + crouch);
    ctx.lineTo(-22, -28 + crouch);
    ctx.lineTo(-18 + walk * 10, 0);
    ctx.moveTo(8, -58 + crouch);
    ctx.lineTo(20, -26 + crouch);
    ctx.lineTo(28 - walk * 10, 0);
    ctx.stroke();
    ctx.fillStyle = def.accent;
    ctx.beginPath();
    ctx.ellipse(-16 + walk * 10, 2, 12, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(30 - walk * 10, 2, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    /* torso */
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-18, -58 + crouch);
    ctx.lineTo(22, -60 + crouch);
    ctx.lineTo(18, -118 + crouch);
    ctx.lineTo(-14, -114 + crouch);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = def.accent;
    ctx.fillRect(-16, -78 + crouch, 36, 7);

    /* costume marks */
    if (def.id === "huang") {
      ctx.fillStyle = "#111";
      ctx.fillRect(-18, -118 + crouch, 40, 46);
      ctx.fillStyle = def.color;
      ctx.fillRect(-10, -100 + crouch, 24, 8);
    }
    if (def.id === "musk") {
      ctx.fillStyle = "#e10600";
      ctx.fillRect(-4, -98 + crouch, 16, 5);
    }
    if (def.id === "arnault") {
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(-16, -118 + crouch, 36, 6);
    }
    if (def.id === "zuck") {
      ctx.fillStyle = "#ccc";
      ctx.fillRect(-6, -70 + crouch, 18, 6);
    }
    if (def.id === "ellison") {
      ctx.fillStyle = "#f4c430";
      for (var i = 0; i < 4; i++) ctx.fillRect(-12 + i * 8, -108 + crouch, 5, 18);
    }

    /* arms */
    ctx.strokeStyle = def.skin;
    ctx.lineWidth = 9;
    ctx.beginPath();
    var ay = -100 + crouch;
    if (blocking) {
      ctx.moveTo(10, ay);
      ctx.lineTo(28, ay - 22);
      ctx.moveTo(-8, ay + 6);
      ctx.lineTo(24, ay - 8);
    } else if (punch) {
      ctx.moveTo(8, ay);
      ctx.lineTo(58, ay - 8);
      ctx.moveTo(-10, ay + 4);
      ctx.lineTo(-18, ay + 28);
    } else if (kick) {
      ctx.moveTo(10, ay);
      ctx.lineTo(22, ay - 24);
      ctx.stroke();
      ctx.strokeStyle = def.accent;
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(8, -56 + crouch);
      ctx.lineTo(62, -28);
    } else if (jumping) {
      ctx.moveTo(12, ay);
      ctx.lineTo(28, ay - 26);
      ctx.moveTo(-10, ay);
      ctx.lineTo(-24, ay - 18);
    } else {
      ctx.moveTo(12, ay);
      ctx.lineTo(30, ay + 10 + walk * 3);
      ctx.moveTo(-8, ay + 2);
      ctx.lineTo(-22, ay + 22 - walk * 3);
    }
    ctx.stroke();
    if (punch) {
      ctx.fillStyle = def.skin;
      ctx.beginPath();
      ctx.arc(62, ay - 8, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    /* head — side 3/4 */
    var hx = 6, hy = -136 + crouch;
    ctx.fillStyle = def.skin;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.hair;
    if (def.id === "bezos" || def.id === "buffett" || def.id === "dell" || def.id === "ellison" || def.id === "arnault") {
      ctx.beginPath();
      ctx.ellipse(hx, hy - 10, 15, 8, 0, Math.PI, 0);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(hx - 1, hy - 6, 16, 14, 0, Math.PI, 0.15);
      ctx.fill();
      ctx.fillRect(hx - 16, hy - 8, 8, 16);
    }
    ctx.fillStyle = "#111";
    ctx.fillRect(hx + 4, hy - 4, 4, 3);
    if (def.id === "brin" || def.id === "page" || def.id === "huang" || def.id === "buffett") {
      ctx.strokeStyle = "#88c";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx + 2, hy - 6, 8, 6);
    }

    if (f.state === "ko") {
      ctx.restore();
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(facing, 1);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.ellipse(10, 4, 50, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(0, -18);
      ctx.rotate(-1.25);
      ctx.fillStyle = def.color;
      ctx.fillRect(-50, -18, 90, 28);
      ctx.fillStyle = def.skin;
      ctx.beginPath();
      ctx.arc(48, -4, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = def.hair;
      ctx.beginPath();
      ctx.arc(52, -8, 12, 0, Math.PI);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (f.state === "special" && f.attack && f.attack.special) {
      ctx.fillStyle = "rgba(255,240,140,0.28)";
      ctx.beginPath();
      ctx.arc(16, -90, 64, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawProjectile(ctx, p, t) {
    var pr = p.spec.projectile || {};
    var rw = Math.max(p.w, 56);
    var rh = Math.max(p.h, 40);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = pr.color || "#fff";
    ctx.shadowColor = pr.color || "#fff";
    ctx.shadowBlur = 22;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(-rw * 0.85, 0, rh * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-rw * 1.35, 0, rh * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (pr.traj === "explode" && p.exploded) {
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(0, 0, rw * 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.spec.kind === "beam" || pr.traj === "beamchunk") {
      ctx.fillRect(-rw / 2, -rh / 4, rw, rh / 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(-rw / 2, -4, rw, 8);
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, rw / 2, rh / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(-4, -4, rw / 5, rh / 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function healthBar(ctx, x, y, w, h, ratio, fromRight) {
    /* CPS-style: yellow remaining on the outer edge, red empty toward center. No bevel. */
    ctx.fillStyle = "#c01018";
    ctx.fillRect(x, y, w, h);
    var fw = Math.max(0, Math.round(w * Math.max(0, Math.min(1, ratio))));
    ctx.fillStyle = "#f0d020";
    if (fromRight) ctx.fillRect(x, y, fw, h);
    else ctx.fillRect(x + (w - fw), y, fw, h);
  }

  function drawHud(ctx, match) {
    /* SF2 overlay HUD: floating yellow bars, names, centered timer / KO */
    var r1 = match.p1.health / match.p1.maxHealth;
    var r2 = match.p2.health / match.p2.maxHealth;
    healthBar(ctx, 28, 18, 360, 16, r1, true);
    healthBar(ctx, W - 388, 18, 360, 16, r2, false);

    var sec = Math.max(0, Math.ceil(match.timer / 60));
    var showKo = match.roundOver && match.roundResult && match.roundResult.type === "ko";
    ctx.fillStyle = "#000";
    ctx.fillRect(452, 12, 56, 34);
    ctx.textAlign = "center";
    ctx.fillStyle = "#e01010";
    ctx.font = "bold 9px monospace";
    ctx.fillText("KO", 480, 12);
    if (showKo) {
      ctx.fillStyle = "#f0d020";
      ctx.font = "bold 26px monospace";
      ctx.fillText("KO", 480, 40);
    } else {
      ctx.fillStyle = sec <= 10 ? "#ff3030" : "#f0d020";
      ctx.font = "bold 28px monospace";
      ctx.fillText((sec < 10 ? "0" : "") + sec, 480, 40);
    }

    ctx.textAlign = "left";
    ctx.font = "bold 14px monospace";
    ctx.fillStyle = "#40e0ff";
    ctx.fillText(match.p1.def.name, 28, 50);
    ctx.textAlign = "right";
    ctx.fillText(match.p2.def.name, W - 28, 50);

    /* corner portraits */
    function mug(f, mx, flip) {
      ctx.save();
      ctx.translate(mx, 28);
      if (flip) ctx.scale(-1, 1);
      ctx.fillStyle = f.def.skin;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.def.hair;
      ctx.beginPath();
      ctx.arc(-1, -6, 15, Math.PI, 0.2);
      ctx.fill();
      ctx.restore();
    }
    mug(match.p1, 14, false);
    mug(match.p2, W - 14, true);

    ctx.textAlign = "left";
    for (var i = 0; i < 2; i++) {
      ctx.fillStyle = match.wins[0] > i ? "#e02020" : "rgba(0,0,0,0.45)";
      ctx.fillRect(30 + i * 16, 58, 12, 8);
      ctx.fillStyle = match.wins[1] > i ? "#e02020" : "rgba(0,0,0,0.45)";
      ctx.fillRect(W - 42 - i * 16, 58, 12, 8);
    }
  }

  function drawAnnounce(ctx, match) {
    if (!match.announce || match.announceT <= 0 && match.announce !== "K.O." && !match.roundOver) return;
    if (match.announceT <= 0 && !match.roundOver && !match.matchOver) return;
    var text = match.announce;
    if (match.matchOver) text = "YOU WIN";
    ctx.save();
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    if (text === "K.O." || text === "DOUBLE K.O.") {
      ctx.font = "bold 120px Impact, Arial Black, sans-serif";
      ctx.strokeStyle = "#200";
      ctx.lineWidth = 14;
      ctx.strokeText(text, W / 2, H / 2);
      ctx.fillStyle = "#f4e020";
      ctx.fillText(text, W / 2, H / 2);
    } else if (text === "YOU WIN") {
      ctx.font = "bold 86px Impact, Arial Black, sans-serif";
      ctx.strokeStyle = "#200";
      ctx.lineWidth = 12;
      ctx.strokeText(text, W / 2, H / 2);
      ctx.fillStyle = "#ffe040";
      ctx.fillText(text, W / 2, H / 2);
    } else {
      ctx.font = "bold 64px Impact, Arial Black, sans-serif";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 8;
      ctx.strokeText(text, W / 2, H / 2);
      ctx.fillStyle = "#fff";
      ctx.fillText(text, W / 2, H / 2);
    }
    ctx.restore();
  }

  function drawSelect(ctx, roster, cursor, cursor2, t) {
    ctx.fillStyle = "#000810";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f0d020";
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PLAYER SELECT", W / 2, 34);

    var cells = roster.fighters;
    var cols = 5, cw = 150, ch = 150, ox = 80, oy = 80;
    for (var i = 0; i < cells.length; i++) {
      var c = i % cols, r = Math.floor(i / cols);
      var x = ox + c * (cw + 16);
      var y = oy + r * (ch + 24);
      var f = cells[i];
      ctx.fillStyle = "#1a2448";
      ctx.fillRect(x, y, cw, ch);
      ctx.fillStyle = f.color;
      ctx.fillRect(x + 8, y + 8, cw - 16, ch - 40);
      /* painted-style 3/4 portrait, not a flat sticker */
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x + 14, y + 14, cw - 28, ch - 58);
      ctx.fillStyle = f.skin;
      ctx.beginPath();
      ctx.ellipse(x + cw / 2, y + 64, 30, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.hair;
      ctx.beginPath();
      ctx.ellipse(x + cw / 2 - 2, y + 48, 30, 22, 0, Math.PI, 0.2);
      ctx.fill();
      ctx.fillRect(x + cw / 2 - 30, y + 50, 12, 22);
      ctx.fillStyle = "#111";
      ctx.fillRect(x + cw / 2 + 6, y + 58, 5, 4);
      ctx.fillStyle = f.accent;
      ctx.fillRect(x + 20, y + ch - 62, cw - 40, 16);
      ctx.fillStyle = "#f4e8c0";
      ctx.font = "bold 12px monospace";
      ctx.fillText(f.short, x + cw / 2, y + ch - 14);
      ctx.fillStyle = "#d0b060";
      ctx.font = "10px monospace";
      ctx.fillText("#" + f.rank, x + cw / 2, y + 22);
      if (cursor === i) {
        ctx.strokeStyle = "#f0d020";
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 3, y - 3, cw + 6, ch + 6);
        ctx.fillStyle = "#f0d020";
        ctx.font = "bold 12px monospace";
        ctx.fillText("1P", x + 18, y + 16);
      }
      if (cursor2 === i) {
        ctx.strokeStyle = "#ff4040";
        ctx.lineWidth = 5;
        ctx.strokeRect(x + 3, y + 3, cw - 6, ch - 6);
      }
    }
    var sel = cells[cursor];
    ctx.fillStyle = "#000";
    ctx.fillRect(0, H - 64, W, 64);
    ctx.fillStyle = "#40e0ff";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "left";
    ctx.fillText(sel.name + "   " + sel.fortune, 24, H - 34);
    ctx.fillStyle = "#f0d020";
    ctx.font = "13px monospace";
    ctx.fillText(sel.company + "  —  " + sel.flavor, 24, H - 12);
    ctx.textAlign = "right";
    ctx.fillStyle = "#888";
    ctx.fillText("A/D move   F choose   K P2   ENTER fight", W - 20, H - 12);
  }

  function drawVersus(ctx, a, b, t) {
    ctx.fillStyle = "#100808";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = a.color;
    ctx.fillRect(0, 0, W / 2, H);
    ctx.fillStyle = b.color;
    ctx.fillRect(W / 2, 0, W / 2, H);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, H);

    function portrait(f, x) {
      ctx.fillStyle = f.skin;
      ctx.beginPath();
      ctx.arc(x, 220, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.hair;
      ctx.beginPath();
      ctx.arc(x, 190, 78, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px monospace";
      ctx.textAlign = "center";
      ctx.fillText(f.name, x, 360);
      ctx.font = "16px monospace";
      ctx.fillText(f.fortune + "  " + f.company, x, 388);
    }
    portrait(a, 240);
    portrait(b, 720);
    ctx.fillStyle = "#f4e020";
    ctx.font = "bold 92px Impact, Arial Black, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 10;
    ctx.strokeText("VS", W / 2, 250);
    ctx.fillText("VS", W / 2, 250);
  }

  function drawTitle(ctx, t) {
    drawStage(ctx, t);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.font = "bold 22px monospace";
    ctx.fillStyle = "#f4e8c0";
    ctx.fillText("FORBES  AUGUST 2026  REAL-TIME TOP TEN", W / 2, 110);
    ctx.font = "bold 78px Impact, Arial Black, sans-serif";
    ctx.strokeStyle = "#200";
    ctx.lineWidth = 10;
    ctx.strokeText("BILLIONAIRE", W / 2, 210);
    ctx.strokeText("BRAWL", W / 2, 290);
    ctx.fillStyle = "#f4d020";
    ctx.fillText("BILLIONAIRE", W / 2, 210);
    ctx.fillStyle = "#e03030";
    ctx.fillText("BRAWL", W / 2, 290);
    ctx.fillStyle = "#fff";
    ctx.font = "20px monospace";
    ctx.fillText("A satirical Street Fighter-style 1v1", W / 2, 350);
    ctx.fillStyle = (Math.floor(t / 30) % 2) ? "#fff" : "#aaa";
    ctx.fillText("PRESS ENTER  /  CLICK  TO SELECT", W / 2, 430);
  }

  function render(ctx, view) {
    var t = view.t || 0;
    if (view.screen === "title") {
      drawTitle(ctx, t);
      return;
    }
    if (view.screen === "select") {
      drawSelect(ctx, view.roster, view.cursor, view.cursor2, t);
      return;
    }
    if (view.screen === "versus") {
      drawVersus(ctx, view.p1, view.p2, t);
      return;
    }
    drawStage(ctx, t);
    if (view.match) {
      drawFighter(ctx, view.match.p1, t);
      drawFighter(ctx, view.match.p2, t);
      for (var i = 0; i < view.match.projectiles.length; i++) {
        drawProjectile(ctx, view.match.projectiles[i], t);
      }
      drawHud(ctx, view.match);
      drawAnnounce(ctx, view.match);
    }
  }

  root.BBRender = {
    WIDTH: W,
    HEIGHT: H,
    render: render,
    drawStage: drawStage,
    drawHud: drawHud,
    drawSelect: drawSelect,
    drawVersus: drawVersus,
    drawAnnounce: drawAnnounce
  };
})(typeof globalThis !== "undefined" ? globalThis : this);

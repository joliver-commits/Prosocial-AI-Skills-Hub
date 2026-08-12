/* ============================================================
   IS YOUR AI GOOD FOR YOU?  —  quiz engine
   ------------------------------------------------------------
   Mechanics only. Every question, answer, weight, role, badge,
   citation and line of copy lives in data/questions.json and
   data/results.json. If you are here to change wording or
   scoring, you are in the wrong file.

   Deliberately absent, per the honesty constraints:
     · no analytics, no beacons, no network calls beyond the two
       local JSON files
     · no accounts, no server, nothing leaves the device
     · no streaks, no reminders, no per-answer flattery
     · the quiz never speaks as an "I" and never claims to feel
       anything about an answer
   ============================================================ */

'use strict';

var Q = null;   // questions.json
var R = null;   // results.json

var SAVE_KEY = 'isyouraigoodforyou.v1';
var SPARKLE_KEY = 'isyouraigoodforyou.sparkles';

function $(sel) { return document.querySelector(sel); }
function el(id) { return document.getElementById(id); }
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function scrollTop() {
  window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
}
/* Bring a screen's own top into view rather than the page's. The masthead is
   tall by design, so scrolling to 0 between questions would park the reader on
   the title block instead of the question they are meant to be answering. */
function scrollToScreen(id) {
  var node = el(id);
  if (!node) return;
  var y = node.getBoundingClientRect().top + window.pageYOffset - 12;
  window.scrollTo({ top: Math.max(0, y), behavior: reducedMotion() ? 'auto' : 'smooth' });
}

/* ============================================================
   SCORING
   X = function depth   (0-100, normalised over answered items)
   Y = role depth       (0-100, normalised over config.depthMax)
   Category flags pick which role row the Y band resolves to.
   ============================================================ */

function computeScores(answers) {
  var x = 0, xMax = 0, depth = 0;
  var flags = {}, funcs = {}, recip = null;

  Q.questions.forEach(function (q, i) {
    var pick = answers[i];
    if (pick === null || pick === undefined) return;
    var opt = q.options[pick];
    if (!opt) return;

    if (typeof opt.x === 'number') {
      x += opt.x;
      // max accumulates only over answered items, so a partial run still plots honestly
      xMax += Math.max.apply(null, q.options.map(function (o) { return o.x || 0; }));
      if (q.func) funcs[q.func] = (funcs[q.func] || 0) + opt.x;
    }
    if (typeof opt.depth === 'number') depth += opt.depth;
    if (opt.flags) {
      Object.keys(opt.flags).forEach(function (k) {
        flags[k] = (flags[k] || 0) + opt.flags[k];
      });
    }
    if (opt.badge) recip = opt.badge;
  });

  var xPct = xMax > 0 ? Math.round(100 * x / xMax) : 0;
  var yPct = Math.min(100, Math.round(100 * depth / R_cfg().depthMax));

  return {
    x: xPct,
    y: yPct,
    xRaw: x, xMax: xMax, depthRaw: depth,
    flags: flags,
    funcs: funcs,
    reciprocity: recip,
    xBand: bandFor(R.xBands, xPct),
    yBand: bandFor(Q.config.yBands, yPct)
  };
}

function R_cfg() { return Q.config; }

function bandFor(bands, pct) {
  for (var i = 0; i < bands.length; i++) {
    if (pct <= bands[i].max) return bands[i].band;
  }
  return bands[bands.length - 1].band;
}

/* Largest total each flag could reach across the whole bank. Computed from
   the questions themselves so re-weighting an answer cannot desync it. */
var FLAG_MAX = null;
function flagMaxes() {
  if (FLAG_MAX) return FLAG_MAX;
  FLAG_MAX = {};
  Q.questions.forEach(function (q) {
    var per = {};
    q.options.forEach(function (o) {
      if (!o.flags) return;
      Object.keys(o.flags).forEach(function (k) {
        per[k] = Math.max(per[k] || 0, o.flags[k]);
      });
    });
    Object.keys(per).forEach(function (k) {
      FLAG_MAX[k] = (FLAG_MAX[k] || 0) + per[k];
    });
  });
  return FLAG_MAX;
}

/* Compared as a share of each flag's own maximum, not as raw totals.
   Raw totals would hand almost every result to `platonic`, which collects
   points from five questions while each specific category has one — a
   teenager who flags romance or a family-shaped gap once would be
   outvoted by their own general answers. */
function dominantFlag(flags) {
  var maxes = flagMaxes();
  var best = null, bestScore = 0;
  Q.config.flagPriority.forEach(function (name) {
    var cap = maxes[name] || 0;
    if (!cap) return;
    var v = (flags[name] || 0) / cap;
    if (v > bestScore) { bestScore = v; best = name; }   // strict > leaves flagPriority as the tie-break
  });
  return best || Q.config.defaultFlag;
}

/* Resolve the result cell: dominant category x Y band -> one role row. */
function resolveCell(scores, answers) {
  var flag = dominantFlag(scores.flags);
  var map = R.cells[flag];
  if (!map) return { flag: flag, roleKey: R.cells[Q.config.defaultFlag]['*'].role };

  var entry = map['*'] || map[String(scores.yBand)];
  if (!entry) return { flag: flag, roleKey: R.cells[Q.config.defaultFlag]['*'].role };

  var roleKey = entry.role;
  if (entry.gate && !gatePasses(entry.gate, answers)) roleKey = entry.fallback;
  return { flag: flag, roleKey: roleKey, gated: !!entry.gate };
}

function gatePasses(gate, answers) {
  var qi = Q.questions.findIndex(function (q) { return q.id === gate.qid; });
  if (qi < 0) return false;
  var wanted = Q.questions[qi].options.findIndex(function (o) { return o.k === gate.option; });
  return answers[qi] === wanted;
}

/* 3-5 badges: one reciprocity, one evidence, one band, plus up to
   two function badges chosen by distance from the middle. */
function computeBadges(scores, role) {
  var out = [];
  if (scores.reciprocity && R.badges.reciprocity[scores.reciprocity]) {
    out.push(R.badges.reciprocity[scores.reciprocity]);
  }
  if (R.badges.evidence[role.evidence]) out.push(R.badges.evidence[role.evidence]);
  if (R.badges.band[String(scores.xBand)]) out.push(R.badges.band[String(scores.xBand)]);

  var cands = [];
  Object.keys(R.functions).forEach(function (fname) {
    if (fname.charAt(0) === '_') return;
    var spec = R.functions[fname];
    var total = scores.funcs[fname] || 0;
    var set = R.badges.functions[fname];
    if (!set) return;
    var side = null;
    if (total >= spec.high) side = 'high';
    else if (total <= spec.low) side = 'low';
    if (!side || !set[side]) return;
    cands.push({ badge: set[side], dist: Math.abs(total - spec.max / 2) });
  });
  cands.sort(function (a, b) { return b.dist - a.dist; });
  cands.slice(0, 2).forEach(function (c) { out.push(c.badge); });

  return out.slice(0, 5);
}

/* ============================================================
   SHARE CODES
   One version char, then 2 bits per answer (0=a, 1=b, 2=c,
   3=unanswered), three answers to a char. 18 questions -> 7 chars.
   A code round-trips to the exact result. Nothing is transmitted:
   the code lives in the URL and is decoded locally.
   ============================================================ */

var SHARE = {
  B64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',

  encode: function (answers) {
    var vals = Q.questions.map(function (q, i) {
      var a = answers[i];
      return (a === null || a === undefined) ? 3 : a;
    });
    var out = this.B64[Q.meta.version];
    for (var i = 0; i < vals.length; i += 3) {
      var a = vals[i];
      var b = (i + 1 < vals.length) ? vals[i + 1] : 3;
      var c = (i + 2 < vals.length) ? vals[i + 2] : 3;
      out += this.B64[(a << 4) | (b << 2) | c];
    }
    return out;
  },

  decode: function (str) {
    if (typeof str !== 'string' || !str.length) return null;
    var idx = Array.prototype.map.call(str, function (ch) { return SHARE.B64.indexOf(ch); });
    if (idx.some(function (n) { return n < 0; })) return null;
    if (idx[0] !== Q.meta.version) return null;
    if (idx.length - 1 !== Math.ceil(Q.questions.length / 3)) return null;
    var vals = [];
    idx.slice(1).forEach(function (p) {
      vals.push((p >> 4) & 3, (p >> 2) & 3, p & 3);
    });
    return Q.questions.map(function (q, i) {
      var v = vals[i];
      if (v === 3 || v >= q.options.length) return null;
      return v;
    });
  },

  url: function (answers) {
    var u = new URL(location.href);
    u.search = '?r=' + this.encode(answers);
    u.hash = '';
    return u.href;
  },

  copy: function (text, btnId, msg) {
    var btn = el(btnId), old = btn.textContent;
    var done = function () {
      btn.textContent = msg;
      setTimeout(function () { btn.textContent = old; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { SHARE.fallback(text, done); });
    } else {
      SHARE.fallback(text, done);
    }
  },
  fallback: function (text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* clipboard unavailable */ }
    document.body.removeChild(ta);
  },
  copyLink: function () { SHARE.copy(QUIZ._shareUrl, 'copylinkbtn', '✓ Link copied'); },
  copyCode: function () { SHARE.copy(el('sharecode').textContent, 'copycodebtn', '✓ Code copied'); },
  nativeShare: function () {
    if (navigator.share) navigator.share({ title: Q.meta.title, url: QUIZ._shareUrl });
  }
};

/* ============================================================
   ROUTER — query params only, so it works on a static host.
     (none)    intro
     ?q=<n>    question n, 1-based
     ?r=<code> a shared or reloaded result
   ============================================================ */

var Router = {
  parse: function () {
    var p = new URLSearchParams(location.search);
    if (p.has('r')) return { screen: 'result', code: p.get('r') };
    if (p.has('q')) {
      var n = parseInt(p.get('q'), 10);
      if (isFinite(n)) return { screen: 'question', i: Math.min(Math.max(n - 1, 0), Q.questions.length - 1) };
    }
    return { screen: 'intro' };
  },
  href: function (route) {
    if (route.screen === 'question') return '?q=' + (route.i + 1);
    if (route.screen === 'result') return '?r=' + route.code;
    return location.pathname;
  },
  sync: function (route) {
    try { history.replaceState(null, '', this.href(route)); } catch (e) { /* file:// */ }
  }
};

/* ============================================================
   QUIZ
   ============================================================ */

var QUIZ = {
  i: 0,
  done: false,
  answers: [],
  _shareUrl: '',
  _advanceTimer: null,

  /* ---------- persistence: this device, this browser, nowhere else ---------- */
  save: function () {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: Q.meta.version, i: this.i, done: this.done, answers: this.answers
      }));
    } catch (e) { /* private mode: the quiz still works, it just won't resume */ }
  },
  load: function () {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || s.v !== Q.meta.version) return null;
      if (!Array.isArray(s.answers) || s.answers.length !== Q.questions.length) return null;
      return s;
    } catch (e) { return null; }
  },
  clear: function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} },
  answered: function () {
    return this.answers.filter(function (a) { return a !== null && a !== undefined; }).length;
  },

  /* ---------- boot & routing ---------- */
  boot: function () { this.applyRoute(Router.parse()); },

  applyRoute: function (route) {
    if (route.screen === 'result') {
      var ans = SHARE.decode(route.code);
      if (ans) { this.showResult(ans, true); return; }
      Router.sync({ screen: 'intro' });
      route = { screen: 'intro' };
    }
    if (route.screen === 'question') { this.openQuestion(route.i); return; }
    this.showIntro();
  },

  openQuestion: function (i) {
    var s = this.load();
    this.answers = (s && s.answers) ? s.answers : Q.questions.map(function () { return null; });
    this.done = false;
    this.go(i);
  },

  showIntro: function () {
    var s = this.load();
    var box = el('resumebox'), cta = el('introcta');
    if (s && (s.done || s.answers.some(function (a) { return a !== null; }))) {
      this.i = s.i || 0; this.done = !!s.done; this.answers = s.answers;
      var n = this.answered();
      el('resumemsg').innerHTML = this.done
        ? 'You finished this before. Want to see that result again?'
        : 'You were <strong>' + n + ' of ' + Q.questions.length + '</strong> questions in.';
      el('resumebtn').textContent = this.done ? 'See that result' : 'Pick up where I left off';
      box.hidden = false;
      cta.hidden = true;
    } else {
      this.answers = Q.questions.map(function () { return null; });
      this.i = 0; this.done = false;
      box.hidden = true;
      cta.hidden = false;
    }
    show('screen-intro');
  },

  start: function () {
    this.answers = Q.questions.map(function () { return null; });
    this.i = 0; this.done = false;
    this.go(0);
  },
  startOver: function () {
    this.clear();
    this.start();
  },
  resume: function () {
    if (this.done) {
      this.showResult(this.answers, false);
      return;
    }
    this.go(this.i);
  },

  go: function (i) {
    this.i = Math.min(Math.max(i, 0), Q.questions.length - 1);
    this.save();
    show('screen-quiz');
    this.render();
    scrollToScreen('screen-quiz');
  },
  back: function () { if (this.i > 0) this.go(this.i - 1); },
  next: function () {
    if (this.answers[this.i] === null || this.answers[this.i] === undefined) return;
    if (this.i === Q.questions.length - 1) { this.finish(); return; }
    this.i++;
    this.save();
    this.render();
    scrollToScreen('screen-quiz');
  },

  render: function () {
    var q = Q.questions[this.i];
    var picked = this.answers[this.i];
    var total = Q.questions.length;

    el('progfill').style.width = Math.round(this.i / total * 100) + '%';
    var track = el('progtrack');
    track.setAttribute('aria-valuemax', total);
    track.setAttribute('aria-valuenow', this.i);
    track.setAttribute('aria-valuetext', 'Question ' + (this.i + 1) + ' of ' + total);
    el('progtxt').textContent = 'Question ' + (this.i + 1) + ' of ' + total;

    var skipped = this.answers.slice(0, this.i).some(function (a) { return a === null || a === undefined; });
    var jn = el('jumpnote');
    jn.hidden = !skipped;
    if (skipped) {
      jn.innerHTML = 'You landed on question ' + (this.i + 1) +
        '. Anything you skipped stays blank and is not scored. ' +
        '<button type="button" class="linkish" data-act="fromtop">Start from the top</button>';
    }

    var h = '';
    h += '<p class="qnum" aria-hidden="true">' + (this.i + 1) + '</p>';
    h += '<fieldset class="qfield">';
    h += '<legend class="qtext">' + esc(q.text) + '</legend>';
    h += '<div class="opts">';
    q.options.forEach(function (o, idx) {
      var id = 'opt-' + q.id + '-' + o.k;
      var on = picked === idx;
      h += '<div class="opt' + (on ? ' sel' : '') + '">' +
        '<input type="radio" name="answer" id="' + id + '" value="' + idx + '"' + (on ? ' checked' : '') + '>' +
        '<label for="' + id + '"><span class="box" aria-hidden="true"></span>' +
        '<span class="ltr">' + o.k + '.</span> <span class="ltx">' + esc(o.label) + '</span></label>' +
        '</div>';
    });
    h += '</div></fieldset>';

    var body = el('qbody');
    body.innerHTML = h;

    body.querySelectorAll('input[name="answer"]').forEach(function (input) {
      input.addEventListener('change', function () { QUIZ.pick(parseInt(input.value, 10)); });
    });
    // pointer taps advance on their own; keyboard selection does not, so arrow
    // keys can move through the options without firing the quiz forward
    body.querySelectorAll('.opt label').forEach(function (label) {
      label.addEventListener('click', function (e) {
        if (e.detail > 0) QUIZ.queueAdvance();
      });
    });

    el('backbtn').hidden = this.i === 0;
    var nb = el('nextbtn');
    nb.disabled = picked === null || picked === undefined;
    nb.textContent = this.i === total - 1 ? 'See my result' : 'Next →';

    el('qheading').textContent = 'Question ' + (this.i + 1);
    Router.sync({ screen: 'question', i: this.i });
  },

  pick: function (idx) {
    this.answers[this.i] = idx;
    this.save();
    var opts = el('qbody').querySelectorAll('.opt');
    opts.forEach(function (o, n) { o.classList.toggle('sel', n === idx); });
    el('nextbtn').disabled = false;
  },

  queueAdvance: function () {
    clearTimeout(this._advanceTimer);
    var delay = reducedMotion() ? 0 : 200;
    this._advanceTimer = setTimeout(function () { QUIZ.next(); }, delay);
  },

  finish: function () {
    this.done = true;
    this.save();
    this.showResult(this.answers, false);
  },

  /* ---------- result ---------- */
  showResult: function (answers, isShared) {
    var scores = computeScores(answers);
    var cell = resolveCell(scores, answers);
    var role = R.roles[cell.roleKey];
    var band = R.xBands.filter(function (b) { return b.band === scores.xBand; })[0];
    var ev = R.evidenceLabels[role.evidence];

    show('screen-result');
    el('sharednote').hidden = !isShared;

    el('rolename').textContent = role.emoji + ' ' + role.name;
    el('roletag').textContent = role.indexRole + ' · ' + role.category + ' · ' + role.tag;
    el('rolebody').innerHTML = mdish(role.body);

    el('bandname').textContent = band.emoji + ' ' + band.name;
    el('bandblurb').textContent = band.blurb;
    el('bandmeter').style.width = scores.x + '%';
    el('bandmeter').parentElement.setAttribute('aria-valuenow', scores.x);

    el('evstatus').textContent = ev.emoji + ' ' + ev.label;
    el('evlead').textContent = ev.lead;
    el('evstatus').className = 'evstatus ev-' + role.evidence;

    el('whatnext').textContent = role.whatToDo;
    el('caregap').hidden = !role.careSensitive;

    // grid
    var pin = el('pin');
    pin.style.left = (6 + scores.x * 0.88) + '%';
    pin.style.top = (94 - scores.y * 0.88) + '%';
    pin.textContent = role.emoji;
    el('grid').setAttribute('aria-label',
      'Your position on the companion index grid. ' + role.name +
      '. Function depth ' + scores.x + ' out of 100. Role depth ' + scores.y + ' out of 100.');
    el('coords').innerHTML = 'Function depth <strong>' + scores.x + '</strong>/100 · Role depth <strong>' +
      scores.y + '</strong>/100';

    // badges
    var badges = computeBadges(scores, role);
    el('badges').innerHTML = badges.map(function (b) {
      return '<li class="badge"><span class="bico" aria-hidden="true">' + b.icon + '</span>' +
        '<span class="btitle">' + esc(b.title) + '</span>' +
        '<span class="bsub">' + esc(b.sub) + '</span></li>';
    }).join('');

    el('receipts').innerHTML = renderReceipts(role);

    QUIZ._shareUrl = SHARE.url(answers);
    el('sharecode').textContent = SHARE.encode(answers);
    el('nativesharebtn').hidden = !navigator.share;

    Router.sync({ screen: 'result', code: SHARE.encode(answers) });
    scrollTop();
    el('rolename').focus();
  }
};

/* very small subset of markdown: *emphasis* only, so copy can be written plainly */
function mdish(s) {
  return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/* ---------- the receipts panel ----------
   Plain typeface, collapsed by default, and the one place the page
   drops the magazine voice. Every citation traces to the research
   index. A role with no evidence says so instead of filling the gap. */
function renderReceipts(role) {
  var h = '';
  h += '<p class="rlead">' + esc(R.evidenceLabels[role.evidence].lead) + '</p>';

  if (role.receipts && role.receipts.length) {
    h += '<ul class="rlist">';
    role.receipts.forEach(function (r) {
      var s = R.sources[r.source];
      if (!s) return;
      h += '<li class="ritem">';
      h += '<p class="rcite"><strong>' + esc(s.author) + ' (' + esc(s.year) + ')</strong>, ' +
        '<span class="rtitle">' + esc(s.title) + '</span>. ' + esc(s.venue) + '.</p>';
      h += '<p class="rfind">' + esc(r.finding) + '</p>';
      h += '<p class="rmeta"><span class="rlabel">Sample:</span> ' + esc(s.sample) + '</p>';
      if (r.context) h += '<p class="rmeta"><span class="rlabel">Read it with:</span> ' + esc(r.context) + '</p>';
      h += '<p class="rmeta"><span class="rlabel">Handle with care:</span> ' + esc(s.caveat) + '</p>';
      if (s.incomplete) {
        h += '<p class="rmeta rwarn">The research index does not record a venue, method, or sample size for this one. ' +
          'It is here because dropping it would hide a claim the index makes, not because it is as solid as the others.</p>';
      }
      h += '</li>';
    });
    h += '</ul>';
  } else {
    h += '<p class="rnone">' + esc(role.noEvidenceNote || 'No youth-usage evidence is recorded for this role.') + '</p>';
  }

  h += '<p class="rgap"><span class="rlabel">What the index says is missing:</span> ' + esc(role.gap) + '</p>';
  h += '<p class="rtax">' + esc(R.taxonomyNote.text) + '</p>';
  h += '<p class="rsrc">All of the above is transcribed from ' + esc(Q.meta.sourceLabel) +
    ' A copy is in this repository at <code>' + esc(Q.meta.sourceOfTruth) + '</code>.</p>';
  return h;
}

/* ============================================================
   SCREENS
   ============================================================ */
function show(id) {
  ['screen-intro', 'screen-quiz', 'screen-result'].forEach(function (s) {
    el(s).hidden = (s !== id);
  });
}

/* ============================================================
   SPARKLES — decorative layer, off-switchable, and off by
   default for anyone who asked the OS for reduced motion.
   ============================================================ */
var SPARKLE = {
  on: false,
  init: function () {
    var saved = null;
    try { saved = localStorage.getItem(SPARKLE_KEY); } catch (e) {}
    this.on = saved === null ? !reducedMotion() : saved === 'on';
    this.apply();
  },
  toggle: function () {
    this.on = !this.on;
    try { localStorage.setItem(SPARKLE_KEY, this.on ? 'on' : 'off'); } catch (e) {}
    this.apply();
  },
  apply: function () {
    document.body.classList.toggle('sparkle', this.on);
    var b = el('sparklebtn');
    b.setAttribute('aria-pressed', this.on ? 'true' : 'false');
    b.textContent = this.on ? '✨ Sparkles on' : '✨ Sparkles off';
  }
};

/* ============================================================
   DEBUG — where each archetype lands under the current weights.
   ?debug in the query, #debug in the hash, or Ctrl/Cmd+Shift+D.
   Non-destructive: nothing here touches saved progress.
   ============================================================ */
var DEBUG = {
  open: function () { this.render(); el('debugoverlay').hidden = false; el('dbgclose').focus(); },
  close: function () { el('debugoverlay').hidden = true; },
  toggle: function () { if (el('debugoverlay').hidden) this.open(); else this.close(); },
  render: function () {
    var grid = el('debuggrid');
    grid.querySelectorAll('.pdot').forEach(function (n) { n.remove(); });
    var rows = '';
    R.personas.list.forEach(function (p) {
      if (p.answers.length !== Q.questions.length) {
        console.warn('Persona "' + p.name + '" has ' + p.answers.length +
          ' answers, expected ' + Q.questions.length);
      }
      var scores = computeScores(p.answers);
      var cell = resolveCell(scores, p.answers);
      var role = R.roles[cell.roleKey];
      var url = SHARE.url(p.answers);

      var dot = document.createElement('a');
      dot.className = 'pdot';
      dot.href = url;
      dot.style.left = (6 + scores.x * 0.88) + '%';
      dot.style.top = (94 - scores.y * 0.88) + '%';
      dot.title = p.name + ' → ' + role.name;
      dot.innerHTML = '<span class="pe" aria-hidden="true">' + p.emoji + '</span>' +
        '<span class="pl" style="background:' + esc(p.color) + '">' + esc(p.name) + '</span>';
      dot.setAttribute('aria-label', 'Open the full result for ' + p.name);
      grid.appendChild(dot);

      rows += '<tr>' +
        '<th scope="row">' + p.emoji + ' ' + esc(p.name) + '</th>' +
        '<td>' + scores.x + '</td>' +
        '<td>' + scores.y + ' (band ' + scores.yBand + ')</td>' +
        '<td>' + esc(cell.flag) + '</td>' +
        '<td><strong>' + esc(role.name) + '</strong><br>' + esc(role.evidence) + '</td>' +
        '<td><a href="' + esc(url) + '">open</a></td>' +
        '</tr>' +
        '<tr class="dbgblurb"><td colspan="6">' + esc(p.blurb) + '</td></tr>';
    });
    el('dbgrows').innerHTML = rows;
  }
};

/* ============================================================
   WIRING
   ============================================================ */
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-act]');
  if (!t) return;
  var act = t.dataset.act;
  if (act === 'start') QUIZ.start();
  else if (act === 'resume') QUIZ.resume();
  else if (act === 'startover') QUIZ.startOver();
  else if (act === 'fromtop') QUIZ.go(0);
  else if (act === 'back') QUIZ.back();
  else if (act === 'next') QUIZ.next();
  else if (act === 'copylink') SHARE.copyLink();
  else if (act === 'copycode') SHARE.copyCode();
  else if (act === 'nativeshare') SHARE.nativeShare();
  else if (act === 'sparkles') SPARKLE.toggle();
  else if (act === 'dbgopen') DEBUG.open();
  else if (act === 'dbgclose') DEBUG.close();
  else if (act === 'confirmreset') {
    if (confirm('Start over? Your answers on this device will be erased.')) QUIZ.startOver();
  }
});

document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    el('dbgfab').hidden = false;
    DEBUG.toggle();
  }
  if (e.key === 'Escape' && !el('debugoverlay').hidden) DEBUG.close();
});

window.addEventListener('popstate', function () { QUIZ.applyRoute(Router.parse()); });

/* ---------- load the data, then run ---------- */
function fatal(msg) {
  el('loading').innerHTML = '<h2>The quiz could not load its questions</h2><p>' + msg + '</p>';
}

Promise.all([
  fetch('data/questions.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
  fetch('data/results.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
]).then(function (both) {
  Q = both[0];
  R = both[1];

  document.title = Q.meta.title;
  paintFurniture();
  SPARKLE.init();

  el('loading').hidden = true;
  el('app').hidden = false;

  QUIZ.boot();

  var dbg = /[?&]debug(?:=|&|$)/.test(location.search) || /\bdebug\b/.test(location.hash);
  if (dbg) { el('dbgfab').hidden = false; DEBUG.open(); }
}).catch(function (err) {
  if (location.protocol === 'file:') {
    fatal('Opening this file straight from disk blocks the browser from reading ' +
      '<code>data/questions.json</code>. Serve the folder instead — from this directory run ' +
      '<code>python3 -m http.server</code> and open <code>http://localhost:8000</code>. ' +
      'On GitHub Pages it works with no extra steps.');
  } else {
    fatal('<code>data/questions.json</code> or <code>data/results.json</code> did not load (' +
      esc(err.message) + '). Both files must sit in a <code>data</code> folder next to this page.');
  }
});

/* copy that lives in results.json rather than in the markup */
function paintFurniture() {
  var f = R.pageFurniture;
  el('kicker').textContent = f.kicker;
  // no space before a punctuation-only word, so "You ?" cannot break apart
  el('title').innerHTML = f.titleWords.map(function (w, i) {
    var lead = (i === 0 || /^[?!.,:;]+$/.test(w.t)) ? '' : ' ';
    return lead + '<span class="tw ' + esc(w.style) + '">' + esc(w.t) + '</span>';
  }).join('');
  el('deck').textContent = f.deck;
  el('byline').textContent = f.byline;
  el('burst').textContent = f.burst;
  el('pullquote').textContent = f.pullQuote;
  el('pagenum').textContent = f.pageNumber;
  el('footerslug').textContent = f.footerSlug;
  el('startbtn').textContent = f.startButton;
  el('retakebtn').textContent = f.retakeButton;
  el('timeest').textContent = f.timeEstimate;
  el('receiptssummary').textContent = f.receiptsSummary;
  el('caregap').textContent = f.careNote;

  var g = f.gridLabels;
  el('gridtitle').textContent = g.title;
  el('axisnote-x').textContent = g.xAxis;
  el('axisnote-y').textContent = g.yAxis;
  el('gl-xlow').textContent = g.xLow;
  el('gl-xhigh').textContent = g.xHigh;
  el('gl-ylow').textContent = g.yLow;
  el('gl-yhigh').textContent = g.yHigh;
}

/* parser.js — turns a spoken field note into a structured job record.
   Works in the browser (window.JobParser) and in Node (module.exports) so it can be unit-tested. */
(function (global) {
  'use strict';

  // Ordered: multi-word phrases must come before their single-word components.
  var JOB_TYPES = [
    ['retaining wall', 'Retaining Wall'],
    ['block wall', 'Block Wall'],
    ['paver patio', 'Paver Patio'],
    ['flagstone patio', 'Flagstone Patio'],
    ['chimney repair', 'Chimney Repair'],
    ['chimney rebuild', 'Chimney Rebuild'],
    ['fire pit', 'Fire Pit'],
    ['firepit', 'Fire Pit'],
    ['outdoor kitchen', 'Outdoor Kitchen'],
    ['stone veneer', 'Stone Veneer'],
    ['brick veneer', 'Brick Veneer'],
    ['tuckpoint', 'Tuckpointing'],
    ['repoint', 'Repointing'],
    ['fireplace', 'Fireplace'],
    ['chimney', 'Chimney'],
    ['flagstone', 'Flagstone'],
    ['pavers', 'Pavers'],
    ['paver', 'Pavers'],
    ['patio', 'Patio'],
    ['driveway', 'Driveway'],
    ['walkway', 'Walkway'],
    ['sidewalk', 'Sidewalk'],
    ['steps', 'Steps'],
    ['stairs', 'Steps'],
    ['stucco', 'Stucco'],
    ['foundation', 'Foundation'],
    ['barbecue', 'BBQ / Grill'],
    ['bbq', 'BBQ / Grill'],
    ['grill', 'BBQ / Grill'],
    ['mailbox', 'Mailbox'],
    ['planter', 'Planter'],
    ['column', 'Columns'],
    ['veneer', 'Veneer'],
    ['brick', 'Brickwork'],
    ['block', 'Block Wall'],
    ['concrete', 'Concrete'],
    ['wall', 'Wall'],
    ['repair', 'Repair']
  ];

  // Words that can never be a client name (job-type words, common adjectives).
  var NAME_STOPLIST = new Set([
    'new', 'big', 'old', 'front', 'back', 'side', 'whole', 'entire', 'little',
    'small', 'huge', 'first', 'second', 'next', 'last', 'other', 'main', 'same',
    'usual', 'regular', 'rental', 'guest', 'neighbor', 'corner', 'vacant',
    'retaining', 'block', 'brick', 'paver', 'pavers', 'flagstone', 'stone',
    'stucco', 'concrete', 'cinder', 'outdoor', 'fire', 'chimney', 'veneer',
    'garden', 'planter', 'patio', 'wall', 'driveway', 'walkway', 'mailbox'
  ]);

  var CLIENT_PATTERNS = [
    /(?:at|to)\s+the\s+([a-z'’-]+?)(?:'s|’s)?\s+(?:house|home|place|property|residence|building|job\s?site)/,
    /\bthe\s+([a-z'’-]+)\s+family\b/,
    /\bfor\s+(?:mr|mrs|ms|miss|dr)\.?\s+([a-z'’-]+)/,
    /\b(?:mr|mrs|ms|miss|dr)\.?\s+([a-z'’-]+)/,
    /\bfor\s+(?:the\s+)?([a-z'’-]+?)(?:'s|’s)?\s+(?:house|home|place|property|residence)/,
    /\bthe\s+([a-z'’-]+)\s+(?:job|project|account|patio|wall|chimney|driveway|walkway|paver|pavers|flagstone|retaining|steps)\b/
  ];

  function titleCase(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function toNumber(str) {
    var n = parseFloat(String(str).replace(/,/g, ''));
    return isNaN(n) ? null : n;
  }

  function extractClient(lower) {
    for (var i = 0; i < CLIENT_PATTERNS.length; i++) {
      var m = lower.match(CLIENT_PATTERNS[i]);
      if (m) {
        var name = m[1].replace(/['’]s$/, '');
        if (name.length > 1 && !NAME_STOPLIST.has(name)) return titleCase(name);
      }
    }
    return null;
  }

  function extractJobType(lower) {
    for (var i = 0; i < JOB_TYPES.length; i++) {
      if (lower.indexOf(JOB_TYPES[i][0]) !== -1) return JOB_TYPES[i][1];
    }
    return null;
  }

  function extractAmount(lower) {
    var m = lower.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
    if (m) return toNumber(m[1]);
    m = lower.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:dollars|bucks)\b/);
    if (m) return toNumber(m[1]);
    m = lower.match(/(\d+(?:\.\d+)?)\s*(?:thousand|grand)\b/);
    if (m) return Math.round(parseFloat(m[1]) * 1000);
    m = lower.match(/(\d+(?:\.\d+)?)\s*hundred\b/);
    if (m) return Math.round(parseFloat(m[1]) * 100);
    m = lower.match(/(?:bill(?:ing|ed)?|charg(?:e|ed|ing)|invoic(?:e|ed)|quot(?:e|ed|ing)|estimat(?:e|ed)|total(?:ed|ing)?|costs?|paid|owes?|deposit(?:\s+of)?)\s+(?:them|him|her|us|me|at|of|is|was|for|about|around|roughly)?\s*\$?\s*([\d,]+(?:\.\d{1,2})?)\b/);
    if (m) return toNumber(m[1]);
    return null;
  }

  function extractStatus(lower) {
    if (/follow[\s-]?up|come back|reschedul|call (them |him |her )?back|check back|still (need|owe)/.test(lower)) return 'Follow-up';
    if (/schedul|booked|starting|start on|penciled/.test(lower)) return 'Scheduled';
    if (/quot|estimat|\bbid\b/.test(lower)) return 'Quoted';
    return 'Completed';
  }

  function extractHours(lower) {
    if (/half\s+(a\s+)?day/.test(lower)) return 4;
    if (/(all|full)\s+day/.test(lower)) return 8;
    var m = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/);
    return m ? parseFloat(m[1]) : null;
  }

  function extractDate(lower, now) {
    var d = now ? new Date(now) : new Date();
    if (/day before yesterday/.test(lower)) d.setDate(d.getDate() - 2);
    else if (/yesterday|last night/.test(lower)) d.setDate(d.getDate() - 1);
    var y = d.getFullYear();
    var mo = String(d.getMonth() + 1).padStart(2, '0');
    var da = String(d.getDate()).padStart(2, '0');
    return y + '-' + mo + '-' + da;
  }

  function parseTranscript(text, now) {
    var raw = String(text || '').trim();
    var lower = raw.toLowerCase();
    return {
      client: extractClient(lower),
      jobType: extractJobType(lower),
      amount: extractAmount(lower),
      status: extractStatus(lower),
      hours: extractHours(lower),
      date: extractDate(lower, now),
      notes: raw
    };
  }

  var api = { parseTranscript: parseTranscript };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.JobParser = api;
})(typeof window !== 'undefined' ? window : this);

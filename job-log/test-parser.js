// Run with: node test-parser.js
const { parseTranscript } = require('./parser.js');

let passed = 0, failed = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (ok) passed++;
  else { failed++; console.error(`FAIL ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

const NOW = '2026-07-05T12:00:00';

let r = parseTranscript('Just finished the flagstone patio at the Johnson house billing them $450 need to follow up on the sealant', NOW);
check('t1 client', r.client, 'Johnson');
check('t1 type', r.jobType, 'Flagstone Patio');
check('t1 amount', r.amount, 450);
check('t1 status', r.status, 'Follow-up');

r = parseTranscript('quoted the Hernandez family 2200 dollars for a retaining wall', NOW);
check('t2 client', r.client, 'Hernandez');
check('t2 type', r.jobType, 'Retaining Wall');
check('t2 amount', r.amount, 2200);
check('t2 status', r.status, 'Quoted');

r = parseTranscript('finished the chimney repair for Mrs. Garcia she paid 800 bucks cash took about 6 hours', NOW);
check('t3 client', r.client, 'Garcia');
check('t3 type', r.jobType, 'Chimney Repair');
check('t3 amount', r.amount, 800);
check('t3 status', r.status, 'Completed');
check('t3 hours', r.hours, 6);

r = parseTranscript('scheduled the Smith paver patio for next week quoted at $3,500', NOW);
check('t4 client', r.client, 'Smith');
check('t4 type', r.jobType, 'Paver Patio');
check('t4 amount', r.amount, 3500);
check('t4 status', r.status, 'Scheduled');

r = parseTranscript('gave a bid of 2 thousand for the stucco job at the Ramirez place yesterday', NOW);
check('t5 client', r.client, 'Ramirez');
check('t5 type', r.jobType, 'Stucco');
check('t5 amount', r.amount, 2000);
check('t5 status', r.status, 'Quoted');
check('t5 date', r.date, '2026-07-04');

r = parseTranscript('spent half a day on the retaining wall no charge warranty work', NOW);
check('t6 type', r.jobType, 'Retaining Wall');
check('t6 hours', r.hours, 4);
check('t6 client null', r.client, null);

r = parseTranscript('cleaned up the yard', NOW);
check('t7 client null', r.client, null);
check('t7 type null', r.jobType, null);
check('t7 amount null', r.amount, null);
check('t7 status default', r.status, 'Completed');
check('t7 date today', r.date, '2026-07-05');

r = parseTranscript('rebuilt the mailbox for the Nguyen house total was 15 hundred', NOW);
check('t8 client', r.client, 'Nguyen');
check('t8 type', r.jobType, 'Mailbox');
check('t8 amount', r.amount, 1500);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

const o = require('./pkg-lock-ours.json');
const t = require('./pkg-lock-theirs.json');
const n = require('./package-lock.json');

const okeys = Object.keys(o.packages);
const tkeys = Object.keys(t.packages);
const nkeys = Object.keys(n.packages);

const onlyInTheirs = tkeys.filter(k => !nkeys.includes(k));
const onlyInOurs = okeys.filter(k => !nkeys.includes(k));

console.log('Ours package count:', okeys.length);
console.log('Theirs package count:', tkeys.length);
console.log('New package count:', nkeys.length);
console.log('Theirs-only missing from new:', onlyInTheirs.length, onlyInTheirs.slice(0, 5));
console.log('Ours-only missing from new:', onlyInOurs.length, onlyInOurs.slice(0, 5));

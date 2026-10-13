import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { SearchEngine, normalize, tokens, editDistance } from '../docs/javascripts/search-core.mjs';
import { romanizeIndic, phoneticKey } from '../docs/javascripts/search-normalize.mjs';

const json = async name => JSON.parse(await readFile(new URL('../site/assets/' + name, import.meta.url), 'utf8'));
const compact = await json('works-index.json'), index = await json('universal-search.json');
const graph = await json('identity-graph.json');
for (const file of ['javascripts/abp.js', 'javascripts/universal-search.js', 'javascripts/search-core.mjs', 'javascripts/search-normalize.mjs', 'javascripts/search-worker.mjs', 'stylesheets/search.css']) {
  assert.deepEqual(await readFile(new URL('../docs/' + file, import.meta.url)), await readFile(new URL('../site/' + file, import.meta.url)), 'built search asset matches source: ' + file);
}
assert.equal(createHash('sha256').update(await readFile(new URL('../site/assets/works-index.json', import.meta.url))).digest('hex'), index.compactDigest, 'work rows and postings are a matching version');
const start = performance.now(), engine = new SearchEngine(compact, index);
console.log('Engine startup ms:', +(performance.now() - start).toFixed(2));
assert.equal(compact.works.length, 43085);
assert.equal(index.coverage.categories, 42);
assert.equal(index.coverage.sections, 2112);
assert.equal(new Set(compact.works.map(w => w[6])).size, compact.works.length);
for (let i = 0; i < compact.works.length; i++) {
  const work = compact.works[i];
  assert.ok(engine.titleRows.get(tokens(work[0]).join(' ')).includes(i), 'every canonical title directly indexed');
  for (const token of new Set(tokens(work[0]))) assert.ok(index.postings[token].includes(i), 'every canonical title token indexed');
}
const ids = new Set([...index.nodes.map(n => n.id), ...index.entities.map(e => e.id), ...index.aliases.map(a => a.id), ...compact.works.map(w => w[6])]);
for (const edge of graph) {
  assert.ok(ids.has(edge.from) && ids.has(edge.to), 'graph has no dangling references');
  assert.ok(edge.source);
}
for (const node of index.nodes) {
  assert.ok(node.works.length && node.works.every(i => i >= 0 && i < compact.works.length));
  assert.ok(node.url.startsWith('categories/') && !node.url.includes('..'));
  for (const token of new Set(tokens(node.name))) assert.ok(index.nodePostings[token].some(i => index.nodes[i].id === node.id));
}
console.log('PASS all records, canonical IDs, hierarchy nodes, postings and graph references');
assert.equal(normalize('Śiva Kṛṣṇa'), 'siva krsna');
assert.equal(normalize('शिव कवच'), 'शिव कवच');
assert.notEqual(normalize('क'), normalize('की'));
assert.equal(normalize('aि'), 'aि', 'Indic marks beside Latin letters are not discarded');
assert.equal(normalize('x\u0301'), 'x', 'decomposed Latin accents fold consistently');
assert.deepEqual(tokens('शिव स्तोत्र'), ['शिव', 'स्तोत्र']);
assert.equal(editDistance('bake bihari', 'banke bihari'), 1);
assert.equal(romanizeIndic('शिव'), 'shiva');
assert.equal(phoneticKey('Bholenaath'), phoneticKey('Bholenath'));
assert.ok(engine.search('Bholenaath').identities.some(e => e.id === 'deity:shiva'));
const accepted = [
  ['Bake Bihari', 'banke-bihari'], ['Banke Bihari', 'banke-bihari'], ['बाँके बिहारी', 'banke-bihari'],
  ['Kanhaiya', 'krishna'], ['Gopal', 'krishna'], ['Mahesh', 'shiva'], ['Bholenath', 'shiva'],
  ['शिव', 'shiva'], ['சிவன்', 'shiva'], ['Bajrangbali', 'hanuman'], ['Anjaneya', 'hanuman'],
  ['Pillaiyar', 'ganesha'], ['Ganapati', 'ganesha'], ['Murugan', 'murugan'], ['Ranganatha', 'ranganatha'],
];
for (const [query, expected] of accepted) {
  const result = engine.search(query);
  assert.ok(result.identities.some(e => e.id === 'deity:' + expected), query + ': identity');
  assert.ok(result.hits.length, query + ': canonical works');
}
assert.ok(engine.search('Bake Bihari').identities[0].parents.some(e => e.id === 'deity:krishna'));
assert.ok(engine.search('Bake Bihari').identities[0].parents.some(e => e.edgeFrom === 'deity:banke-bihari' && e.edgeTo === 'deity:krishna'), 'relationship direction remains explicit');
assert.ok(engine.search('Krishna').identities[0].children.some(e => e.id === 'deity:banke-bihari'));
assert.ok(engine.suggest('bake bi').some(s => /Banke Bihari.*Krishna/.test(s.label)));
for (const query of ['bholen', 'anjane', 'बाँके']) assert.ok(engine.suggest(query).length);
for (const query of ['Balaji', 'Madhava', 'Shyam']) assert.ok(engine.search(query).identities.length > 1, query + ': ambiguity retained');
assert.deepEqual(engine.search('Shyam Baba').identities.map(e => e.id), ['deity:khatu-shyam']);
for (const query of ['Krishna Bhajan', 'Banke Bihari Aarti', 'शिव कवच', 'Vishnu Sahasranama', 'Navagraha', 'Jyotirlinga', 'Shiva स्तोत्र']) {
  const result = engine.search(query);
  assert.ok(result.hits.length || result.nodes.length, query + ': results');
  assert.equal(new Set(result.hits.map(h => compact.works[h.index][6])).size, result.hits.length, 'deduplication');
  assert.ok(result.hits.every((hit, i) => !i || result.hits[i - 1].score >= hit.score));
}
for (const category of new Set(compact.places.map(p => p[1]))) {
  const result = engine.search('', { category });
  assert.ok(result.hits.length && result.hits.every(h => compact.places[compact.works[h.index][5]][1] === category));
  const sample = compact.works[result.hits[0].index];
  assert.ok(engine.search(sample[0], { category }).hits.some(h => compact.works[h.index][6] === sample[6]));
}
const filtered = engine.search('Krishna Bhajan', { form: 'Kavach' });
assert.ok(filtered.hits.every(hit => engine.formMatches.get('bhajan').has(compact.works[hit.index][3]) && engine.formMatches.get('kavach').has(compact.works[hit.index][3])), 'typed and selected form filters intersect rather than override each other');
const sampleRow = compact.works[0], sampleCategory = compact.places[sampleRow[5]][1];
const multiple = engine.search(sampleRow[0], { category: sampleCategory, language: sampleRow[2], tier: sampleRow[4], form: compact.forms[sampleRow[3]] });
assert.ok(multiple.hits.some(hit => hit.index === 0), 'all four filters preserve a matching exact title');
assert.ok(multiple.hits.every(hit => {
  const w = compact.works[hit.index];
  return compact.places[w[5]][1] === sampleCategory && w[2] === sampleRow[2] && w[4] === sampleRow[4] && engine.formMatches.get(tokens(compact.forms[sampleRow[3]]).join(' ')).has(w[3]);
}));
assert.equal(engine.search('a-completely-unpublished-word-zzqqxx').hits.length, 0);
assert.equal(engine.search('<script>alert("xss")</script>').hits.length, 0);
assert.doesNotThrow(() => engine.search('constructor'), 'prototype-named tokens are ordinary text');
assert.ok(engine.suggest('Hanuman Chal').some(s => /Hanuman Chalisa/i.test(s.label)), 'canonical work-title autocomplete');
const aliasFixture = { ...index, aliases: [...index.aliases, { text: 'Devotional work alternative test', work: compact.works[0][6], source: 'test-only', status: 'verified' }] };
const fixtureEngine = new SearchEngine(compact, aliasFixture);
assert.equal(fixtureEngine.search('Devotional work alternative test').hits[0].index, 0, 'work aliases resolve a CWID, not a guessed substring');
const measurements = [];
for (let i = 0; i < 5; i++) for (const query of ['Bake Bihari', 'शिव कवच', 'Krishna Bhajan', 'Balaji', 'Navagraha', 'Hanuman Chalisa Hindi']) {
  const began = performance.now(); engine.search(query); measurements.push(performance.now() - began);
}
measurements.sort((a, b) => a - b);
console.log(JSON.stringify({ coverage: index.coverage, aliases: index.aliases.length, graphEdges: graph.length,
  measuredQueries: measurements.length, p50ms: measurements[Math.floor(measurements.length * .5)], p95ms: measurements[Math.floor(measurements.length * .95)] }, null, 2));
console.log('PASS multilingual aliases, typo tolerance, ambiguity, combined queries, ranking and all-category filtering');

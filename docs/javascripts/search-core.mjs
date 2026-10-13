/* Pure deterministic engine, shared by the worker and Node coverage tests. */
import { romanizeIndic, phoneticKey } from './search-normalize.mjs';
export function normalize(value) {
  return String(value).normalize('NFKC').toLowerCase()
    .replace(/\p{Script=Latin}[\u0300-\u036f]*/gu, part => part.normalize('NFD').replace(/[\u0300-\u036f]/gu, ''));
}
export const tokens = value => normalize(value).match(/[\p{L}\p{M}\p{N}]+/gu) || [];
const phrase = value => tokens(value).join(' ');
const union = lists => new Set(lists.flatMap(list => [...list]));
const intersection = (a, b) => new Set([...a].filter(value => b.has(value)));
const broadRelations = new Set(['FORM_OF', 'REGIONAL_FORM_OF', 'MANIFESTATION_OF', 'AVATAR_OF', 'WORSHIPPED_AS']);

export function editDistance(a, b, limit = 1) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] !== b[j - 1]));
    if (Math.min(...next) > limit) return limit + 1;
    prev = next;
  }
  return prev[b.length];
}

export class SearchEngine {
  constructor(compact, index) {
    if (index.version !== 1) throw new Error('Unsupported search index version');
    this.data = compact;
    this.workRows = new Map(compact.works.map((w, i) => [w[6], i]));
    this.index = index;
    this.entities = new Map(index.entities.map(e => [e.id, e]));
    this.nodes = new Map(index.nodes.map(n => [n.id, n]));
    this.nodeNames = index.nodes.map(n => phrase(n.name));
    this.recordedLanguages = compact.langs.map(phrase);
    this.recordedForms = compact.forms.map(phrase);
    this.formMatches = new Map(index.forms.map(form => {
      const variants = [form.name, ...form.aliases].map(phrase);
      return [phrase(form.name), new Set(this.recordedForms.flatMap((name, i) =>
        variants.some(v => (' ' + name + ' ').includes(' ' + v + ' ')) ? [i] : []))];
    }));
    this.recordedForms.forEach((name, i) => {
      if (!this.formMatches.has(name)) this.formMatches.set(name, new Set());
      this.formMatches.get(name).add(i);
    });
    this.titles = compact.works.map(w => phrase(w[0]));
    this.titleRows = new Map();
    this.titles.forEach((title, i) => {
      if (!this.titleRows.has(title)) this.titleRows.set(title, []);
      this.titleRows.get(title).push(i);
    });
    this.vocabulary = Object.keys(index.postings).sort();
    this.aliases = new Map();
    const add = (text, value) => {
      const key = phrase(text);
      if (!key) return;
      if (!this.aliases.has(key)) this.aliases.set(key, []);
      this.aliases.get(key).push(value);
    };
    index.aliases.forEach(a => add(a.text, a));
    index.forms.forEach(form => [form.name, ...form.aliases].forEach(text => add(text, { text, form: form.name })));
    index.languages.forEach(language => [language.name, ...language.aliases].forEach(text => add(text, { text, languageFilter: language.name })));
    this.aliasKeys = [...this.aliases.keys()];
    this.phoneticAliases = new Map();
    for (const key of this.aliasKeys) {
      const phonetic = phoneticKey(key);
      if (!phonetic || !this.aliases.get(key).some(a => a.entity)) continue;
      if (!this.phoneticAliases.has(phonetic)) this.phoneticAliases.set(phonetic, []);
      this.phoneticAliases.get(phonetic).push(key);
    }
    this.allRows = Array.from({ length: compact.works.length }, (_, i) => i);
    this.facets = { category: new Map(), language: new Map(), form: new Map(), tier: new Map() };
    compact.works.forEach((work, i) => {
      for (const [key, value] of Object.entries({ category: compact.places[work[5]][1], language: work[2], form: work[3], tier: work[4] })) {
        if (!this.facets[key].has(value)) this.facets[key].set(value, new Set());
        this.facets[key].get(value).add(i);
      }
    });
  }

  resolve(query) {
    const words = tokens(query), consumed = new Set(), matches = [];
    // Longest phrases first: "Shyam Baba" is not the unqualified name "Shyam".
    for (let length = Math.min(8, words.length); length >= 1; length--) {
      for (let start = 0; start + length <= words.length; start++) {
        if (Array.from({ length }, (_, i) => start + i).some(i => consumed.has(i))) continue;
        const key = words.slice(start, start + length).join(' ');
        let candidates = this.aliases.get(key), corrected = false;
        if (!candidates && /[^a-z ]/.test(key)) {
          candidates = this.aliases.get(phrase(romanizeIndic(key)));
          corrected = Boolean(candidates);
        }
        if (!candidates && key.length >= 5 && /^[a-z ]+$/.test(key)) {
          const similar = this.aliasKeys.filter(alias => Math.abs(alias.length - key.length) <= 1 && /^[a-z ]+$/.test(alias) && editDistance(key, alias) <= 1);
          // Never guess between different corrections. One correction can still
          // intentionally refer to several identities (e.g. Balaji).
          if (similar.length === 1) { candidates = this.aliases.get(similar[0]); corrected = true; }
        }
        if (!candidates) {
          const alternatives = this.phoneticAliases.get(phoneticKey(key)) || [];
          // A phonetic variant is allowed only when every verified candidate
          // belongs to the same identity; otherwise request a clearer spelling.
          const values = alternatives.flatMap(alias => this.aliases.get(alias).filter(a => a.entity));
          if (new Set(values.map(a => a.entity)).size === 1) { candidates = values; corrected = true; }
        }
        if (!candidates) continue;
        const identities = candidates.filter(c => c.entity);
        const works = candidates.filter(c => c.work);
        const structured = candidates.filter(c => c.form || c.languageFilter);
        const useful = works.length ? works : identities.length ? identities : structured.length ? structured : candidates;
        matches.push(...useful.map(candidate => ({ ...candidate, corrected, input: key })));
        for (let i = start; i < start + length; i++) consumed.add(i);
      }
    }
    return { matches, residual: words.filter((_, i) => !consumed.has(i)), words };
  }

  wordRows(word, partial = false) {
    const read = key => Object.hasOwn(this.index.postings, key) ? this.index.postings[key] : null;
    const exact = read(word) || read(phrase(romanizeIndic(word)));
    if (exact) return new Set(exact);
    const keys = partial && word.length >= 2 ? this.vocabulary.filter(key => key.startsWith(word)) : [];
    if (keys.length) return union(keys.map(key => this.index.postings[key]));
    if (word.length >= 5 && /^[a-z]+$/.test(word)) {
      const fuzzy = this.vocabulary.filter(key => Math.abs(key.length - word.length) <= 1 && editDistance(word, key) <= 1);
      if (fuzzy.length === 1) return new Set(this.index.postings[fuzzy[0]]);
    }
    return new Set();
  }

  connected(id, direction) {
    const visited = new Set([id]), queue = [{ id, depth: 0 }], result = [];
    while (queue.length) {
      const current = queue.shift();
      if (current.depth >= 8) continue;
      for (const edge of this.index.relationships) {
        if (!broadRelations.has(edge.type) || edge[direction === 'parents' ? 'from' : 'to'] !== current.id) continue;
        const next = edge[direction === 'parents' ? 'to' : 'from'];
        if (visited.has(next)) continue;
        visited.add(next);
        const value = { id: next, type: edge.type, source: edge.source, depth: current.depth + 1, edgeFrom: edge.from, edgeTo: edge.to };
        result.push(value); queue.push(value);
      }
    }
    return result;
  }

  search(query, filters = {}) {
    const began = performance.now(), parsed = this.resolve(query), full = phrase(query);
    let ids = [...new Set(parsed.matches.filter(m => m.entity).map(m => m.entity))];
    if (filters.identity && this.entities.has(filters.identity)) ids = [filters.identity];
    const identities = ids.map(id => {
      const matched = parsed.matches.find(m => m.entity === id);
      return { ...this.entities.get(id), matched: matched?.text || this.entities.get(id).name,
        corrected: Boolean(matched?.corrected), ambiguous: ids.length > 1 || Boolean(matched?.scope?.startsWith('ambiguous')),
        parents: this.connected(id, 'parents'), children: this.connected(id, 'children') };
    });
    const direct = union(ids.map(id => this.index.entityWorks[id] || []));
    const parentIds = union(ids.map(id => this.connected(id, 'parents').map(p => p.id)));
    const childIds = union(ids.map(id => this.connected(id, 'children').map(p => p.id)));
    const parent = union([...parentIds].map(id => this.index.entityWorks[id] || []));
    const child = union([...childIds].map(id => this.index.entityWorks[id] || []));
    const nodeMatches = parsed.matches.filter(m => m.node).map(m => this.nodes.get(m.node)).filter(Boolean);
    const nodeRows = union(nodeMatches.map(n => n.works));
    const workMatches = new Set(parsed.matches.filter(m => m.work).map(m => this.workRows.get(m.work)).filter(i => i !== undefined));
    const formNames = parsed.matches.filter(m => m.form).map(m => phrase(m.form));
    if (filters.form) formNames.push(phrase(filters.form));
    const languages = parsed.matches.filter(m => m.languageFilter).map(m => phrase(m.languageFilter));
    let candidates = workMatches.size ? workMatches : ids.length ? union([direct, parent, child]) : nodeMatches.length ? nodeRows : null;
    for (let i = 0; i < parsed.residual.length; i++) {
      const set = this.wordRows(parsed.residual[i], i === parsed.residual.length - 1);
      candidates = candidates ? intersection(candidates, set) : set;
    }
    const constrain = set => { candidates = candidates ? intersection(candidates, set) : set; };
    for (const name of formNames) constrain(union([...(this.formMatches.get(name) || [])].map(id => this.facets.form.get(id) || [])));
    if (languages.length) constrain(union(this.recordedLanguages.flatMap((name, id) =>
      languages.some(language => (' ' + name + ' ').includes(' ' + language + ' ')) ? [this.facets.language.get(id) || []] : [])));
    if (filters.category) constrain(this.facets.category.get(Number(filters.category)) || new Set());
    if (filters.language !== undefined && filters.language !== '') constrain(this.facets.language.get(Number(filters.language)) || new Set());
    if (filters.tier) constrain(this.facets.tier.get(filters.tier) || new Set());
    if (!candidates) candidates = new Set(full || Object.entries(filters).some(([key, value]) => key !== 'nodeLimit' && Boolean(value)) ? this.allRows : []);
    for (const row of this.titleRows.get(full) || []) candidates.add(row);
    const hits = [], seen = new Set();
    for (const index of candidates) {
      const work = this.data.works[index], place = this.data.places[work[5]];
      if (filters.category && place[1] !== Number(filters.category)) continue;
      if (filters.language !== undefined && filters.language !== '' && work[2] !== Number(filters.language)) continue;
      if (filters.tier && work[4] !== filters.tier) continue;
      const recordedLanguage = this.recordedLanguages[work[2]];
      const exactTitle = this.titles[index] === full;
      if (!exactTitle && languages.length && !languages.some(name => (' ' + recordedLanguage + ' ').includes(' ' + name + ' '))) continue;
      const requiredForms = exactTitle ? filters.form ? [phrase(filters.form)] : [] : formNames;
      if (!requiredForms.every(name => this.formMatches.get(name)?.has(work[3]))) continue;
      if (seen.has(work[6])) continue;
      seen.add(work[6]);
      const title = this.titles[index];
      const exact = full && title === full, titleMatch = full && title.includes(full);
      const score = exact ? 1500 : workMatches.has(index) ? 1400 : titleMatch ? 1200 : direct.has(index) ? 900 : child.has(index) ? 600 : parent.has(index) ? 300 : 500;
      const reason = exact ? 'Exact work title' : workMatches.has(index) ? 'Verified alternative work title' : titleMatch ? 'Work title match' : direct.has(index)
        ? `Matched through alternate name: ${identities.map(e => e.matched).join(' / ')}`
        : parent.has(index) ? `Broader related deity: ${[...parentIds].map(id => this.entities.get(id).name).join(' / ')}`
        : child.has(index) ? 'Verified related devotional form' : nodeRows.has(index) ? 'Canonical section match' : 'Title, hierarchy or recorded metadata match';
      hits.push({ index, score, reason });
    }
    hits.sort((a, b) => b.score - a.score || a.index - b.index);
    const queryWords = parsed.words;
    const matchingNodeIds = new Set(nodeMatches.map(n => n.id));
    const nodeHits = this.index.nodes.filter((n, i) => matchingNodeIds.has(n.id) || full && queryWords.every(w => this.nodeNames[i].includes(w)))
      .filter(n => !filters.category || n.category === Number(filters.category));
    const nodes = nodeHits.slice(0, Math.max(30, Math.min(10000, Number(filters.nodeLimit) || 30)));
    return { hits, identities, nodes, nodeCount: nodeHits.length, parsed: { forms: formNames, languages, residual: parsed.residual },
      suggestions: this.suggest(query), elapsedMs: performance.now() - began };
  }

  suggest(query) {
    const key = phrase(query);
    if (key.length < 2) return [];
    const choices = [], seen = new Set();
    for (const alias of this.aliasKeys) {
      const prefix = alias.startsWith(key);
      const correctedPrefix = !prefix && key.length >= 5 && /^[a-z ]+$/.test(key) && editDistance(key, alias.slice(0, key.length + (alias.length > key.length ? 1 : 0))) <= 1;
      if (!prefix && !correctedPrefix) continue;
      for (const item of this.aliases.get(alias)) {
        if (!item.entity && !item.node && !item.work) continue;
        const id = item.entity || item.node || item.work;
        if (seen.has(id)) continue;
        seen.add(id);
        const entity = this.entities.get(item.entity);
        const parent = item.entity && this.connected(item.entity, 'parents')[0];
        choices.push({ query: item.text, identity: item.entity || '',
          label: item.text + (parent ? ' — ' + this.entities.get(parent.id).name : entity && item.text !== entity.name ? ' — ' + entity.name : ''),
          corrected: !prefix });
      }
      if (choices.length >= 8) break;
    }
    const words = tokens(query);
    let rows;
    for (let i = 0; i < words.length; i++) {
      const set = this.wordRows(words[i], i === words.length - 1);
      rows = rows ? intersection(rows, set) : set;
    }
    const titles = new Set();
    for (const row of [...(rows || [])].slice(0, 256)) {
      if (!this.titles[row].includes(key) || titles.has(this.titles[row])) continue;
      titles.add(this.titles[row]);
      const title = this.data.works[row][0];
      choices.push({ query: title, identity: '', label: title, corrected: false });
      if (choices.length >= 8) break;
    }
    return choices.slice(0, 8);
  }
}

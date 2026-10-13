import { SearchEngine } from './search-core.mjs';
let engine;
self.onmessage = ({ data }) => {
  try {
    if (data.type === 'init') engine = new SearchEngine(data.compact, data.index);
    const result = data.type === 'init' ? true : engine.search(data.query, data.filters);
    self.postMessage({ id: data.id, result });
  } catch (error) { self.postMessage({ id: data.id, error: error.message }); }
};

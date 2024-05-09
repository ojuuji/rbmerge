export default async function fetchCsv(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`non-200 status: ${response.status} ${response.statusText}`);
    }
    const ct = response.headers.get('content-type');
    if (!ct.startsWith('text/csv')) {
      throw new Error(`unexpected content type: ${ct}`);
    }
    const csv = await response.text();
    return csv;
  }
  catch (e) {
    console.log(`error fetching ${path}: ${e}`);
    return null;
  }
}

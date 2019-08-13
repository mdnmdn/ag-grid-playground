const casual = require('casual');

const l = console.log;

const maxRecords = 50000;
const baseSeed = 32423;

const data = [];

module.exports = (req, res) => {
  if (!data.length) generateRows();
  const { page = 0, pageSize = 40 } = req.query;
  l({q: req.query});
  const params = {
    page: 0,
    pageSize: 40,
    ...req.query,
  }

  let effectivePage = Number(page);


  const firstRecord = page * pageSize;
  const lastRecord = firstRecord + pageSize;

  const maxPage = Math.ceil(maxRecords / pageSize);
  if (effectivePage >= maxPage) effectivePage = maxPage - 1;

  const results = {
    metadata: {
      page: effectivePage,
      pageSize,
      maxPage,
      rows: maxRecords,
    },
    rows: fetchRows(firstRecord, lastRecord),
  }

  res.json(results);
}

const fetchRows = (first, last) => {
  return data.filter(r => r.pos >= first && r.pos < last);
}

const generateRows = () => {
  for(let i = 0; i < maxRecords; i++) {
    casual.seed(baseSeed + i);
    data.push({
      pos: i,
      id: casual.integer(1, 99999),
      name: casual.name,
      country: casual.country,
    });
  }
};
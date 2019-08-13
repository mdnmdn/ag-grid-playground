const casual = require('casual');
const _ = require('lodash');

const l = console.log;

const maxRecords = 58230;
const baseSeed = 32423;

const data = [];

module.exports = async (req, res) => {
  if (!data.length) await generateRows();
  const { startRow = 0, endRow = 40, sortModel, filterModel } = req.query;

  const sort = parseSort(sortModel);
  const filters = parseFilters(filterModel);

  l({q: req.query});
  const params = {
    ...req.query,
  }

  const selectedData = fetchRows(startRow, endRow, filters, sort);

  const results = {
    metadata: {
      startRow,
      endRow,
      rows: selectedData.count,
    },
    rows: selectedData.rows,
  }

  res.json(results);
}

const fetchRows = (first, last, filters, sort) => {
  let r = _.chain(data);

  if (filters && filters.length) filters.forEach( f => {
      r = r.filter(createPredicate(f));
    });

  if (sort) {
    r = r.sortBy(sort.field);
    if (sort.order !== 'asc') r = r.reverse();
  }
  const count = r.size().value();
  r = r.slice(first, last);
  return {
    count,
    rows: r.value(),
  }
}

const generateRows = () => asyncLoop(maxRecords, i => {
    casual.seed(baseSeed + i);
    data.push({
      pos: i,
      id: casual.integer(1, 99999),
      name: casual.name,
      country: casual.country,
    });
  });

const parseSort = sortModel => {
  if (!sortModel) return null;
  const result = {field: null, order: 'asc' };
  [result.field, result.order] = sortModel.split(':');
  return result;
};

const parseFilters = filterModel => {
  if (!filterModel) return null;
  console.log({filterModel});
  const filters = [];
  
  filterModel.split('#').forEach(d => {
    const filter1 = {};
    const filter2 = {};
    let operator = null;
    [
      filter1.field,
      filter1.operator,
      filter1.value,
      operator,
      filter2.operator,
      filter2.value,
    ] = d.split(':::');
    if (operator !== 'OR') {
      filters.push(filter1);
      if (filter2.operator) {
        filter2.field = filter1.field;
        filters.push(filter2);
      }      
    } else {
      filters.push({
        field: filter1.field,
        operator: 'OR',
        value: [
          {operator: filter1.operator, value: filter1.value},
          {operator: filter2.operator, value: filter2.value},
        ]
      });
    }
  });
  console.log({filters});
  return filters;
};

const createPredicate = filter => {
  const truePredicate = () => true;
  if (filter.operator === 'OR') return truePredicate;


  if (filter.operator === 'contains') {
    const val = filter.value;
    if (!val) return truePredicate;
    const lowerCaseVal = val.toLowerCase();
    return row => row[filter.field] && row[filter.field].toString().toLowerCase().indexOf(lowerCaseVal) !== -1;
  }

  if (filter.operator === 'startsWith') {
    const val = filter.value;
    if (!val) return truePredicate;
    const lowerCaseVal = val.toLowerCase();
    return row => row[filter.field] && row[filter.field].toString().toLowerCase().startsWith(lowerCaseVal);
  }

  if (filter.operator === 'endsWith') {
    const val = filter.value;
    if (!val) return truePredicate;
    const lowerCaseVal = val.toLowerCase();
    return row => row[filter.field] && row[filter.field].toString().toLowerCase().endsWith(lowerCaseVal);
  }

  if (filter.operator === 'equals') {
    const val = filter.value;
    if (!val) return truePredicate;
    const lowerCaseVal = val.toLowerCase();
    return row => row[filter.field] && row[filter.field].toString().toLowerCase() === lowerCaseVal;
  }

  if (filter.operator === 'lessThan') {
    const val = filter.value;
    if (!val) return truePredicate;
    const lowerCaseVal = val.toLowerCase();
    return row => row[filter.field] && row[filter.field] <  lowerCaseVal;
  }

  if (filter.operator === 'greaterThan') {
    const val = filter.value;
    if (!val) return truePredicate;
    const lowerCaseVal = val.toLowerCase();
    return row => row[filter.field] && row[filter.field] >  lowerCaseVal;
  }

  console.log('unsupported operator' ,filter.operator);
  return truePredicate;
}

const asyncLoop = async (repetitions, executor, { delay = 0, batchSize = 100 } = {}) =>
  new Promise((resolve, reject) => {
    let counter = 0;
    let timeoutToken;
    let error = false;
    let execute = () => {
      let batchCounter = 0;
      console.log('execute', counter, batchCounter)
      while(batchCounter < batchSize && counter < repetitions) {
        try{ 
          executor(counter);
        } catch(err) {
          reject(err);
          error = true;
        }
        batchCounter++;
        counter++;
      }
      if (counter >= repetitions || error) {
        if(timeoutToken) clearTimeout(timeoutToken);
        timeoutToken = null;
        if (!error) resolve();
      } else {
        timeoutToken = setTimeout(execute, delay);
      }
    }
  
    execute();
    timeoutToken = setTimeout(execute, delay);
  });
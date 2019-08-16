const casual = require('casual').it_IT;
const _ = require('lodash');
const moment = require('moment');
const { MongoClient } = require('mongodb');

const l = console.log;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27021/testdata';

let mongoConnection = null;

const getMongo = async () => {
  if (!mongoConnection){
    mongoConnection = await MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  }
  return mongoConnection;
}

const getMongoDb = async name => {
  const mongo = await getMongo();
  return mongo.db();
}




module.exports = async (req, res) => {
  const { startRow = 0, endRow = 40, sortModel, filterModel } = req.query;

  const sort = parseSort(sortModel);
  const filters = parseFilters(filterModel);

  l({q: req.query});

  const selectedData = await fetchRows(startRow, endRow, filters, sort);

  l({q: typeof selectedData.rows});

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

const fetchRows = async (first, last, filters, sort) => {

  const db = await getMongoDb();

  const collection = await db.collection('visit')

  let query = collection;

  let mongoFilters = {};
  let mongoSort = {};

  if (filters && filters.length) {
    const $and = [];
    mongoFilters.$and = $and;
    filters.forEach( f => {
      $and.push(createFilter(f));      
    });
  }

  query = query.find(mongoFilters);
  
  if (sort) {
    
    mongoSort[sort.field] = sort.order === 'asc' ? 1 : -1;
    l({ sort, mongoSort })
    query = query.sort(mongoSort);
  }

  const firstNumber = parseInt(first);
  if(firstNumber) query = query.skip(firstNumber);
  const lastNumber = parseInt(last);
  if(lastNumber) query = query.limit(lastNumber - firstNumber);



  const [rows, count] = await Promise.all([
    query.toArray(),
    collection.countDocuments(mongoFilters),
  ]);



  return {
    count,
    rows,
  }
}

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
        ],
      });
    }
  });
  console.log({filters});
  return filters;
};

const createFilter = filter => {
  
  l({ filter });

  const { field, operator, value } = filter;
 
  if (operator === 'contains') {
    return { [field]: { $regex: value, $options: 'i' } }
  }

  if (operator === 'startsWith') {
    return { [field]: { $regex: `^${value}`, $options: 'i' } }
  }

  if (operator === 'endsWith') {
    return { [field]: { $regex: `^${value}$`, $options: 'i' } }
  }

  if (operator === 'equals') {
    return { [field]: { $regex: `${value}$`, $options: 'i' } }
  }

  if (operator === 'lessThan') {
    return { [field]: { $lt: value } }
  }

  if (operator === 'greaterThan') {
    return { [field]: { $gt: value } }
  }

  if (operator === 'OR') {
    return { 
      $or: [
        createFilter({ ...value[0], field }),
        createFilter({ ...value[1], field }),
      ],
    };
  }

  console.log('unsupported operator' ,operator);
  return null;
}

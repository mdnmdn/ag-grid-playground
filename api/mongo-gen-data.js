const casual = require('casual').it_IT;
const _ = require('lodash');
const moment = require('moment');
const { MongoClient } = require('mongodb');

const l = console.log;

const maxRecords = 58230;
const baseSeed = 32423;

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




const genPeople = (seed) => {

  const numPeople = 100;

  const people = [];

  casual.seed(seed || 791);

  const provinces = require('./data/italy_provincies');
  const regions = require('./data/italy_regions');

  for(let i = 0; i < numPeople; i++){
    const name = {
      firstName: casual.first_name,
      lastName: casual.last_name,
    }

    const city = casual.random_element(provinces);
    const region = regions.find(r => r.id_regione == city.id_regione);

    people.push({
      ...name,
      email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@${casual.random_element(['gmail.com', 'hotmail.com', 'libero.it', 'yahoo.it'])}`,
      phone: casual.numerify('34#.#######'),
      city: city.provincia,
      region: region.regione,
    })
  }

  return people;
}

const genShops = (seed) => {
  const numShops = 400;
  const shops = [];

  const people = genPeople(seed);
  const groups = require('./data/groups');

  casual.seed(seed || 322);

  for(let i = 0; i < numShops; i++){
    const group = casual.random_element(groups);
    const person = casual.random_element(people);

    shops.push({
      id: casual.numerify('PDV-######'),
      name: `${group.group} ${casual.string}`,
      address: casual.address1,
      ...group,
      ...person,
    })
  }

  return shops;
}

const genVisits = (seed) => {

  const shops = genShops(seed);

  casual.seed(seed || 322);

  const averageVisitPerDay = 200;

  const visits = [];

  let day = moment().add(-90, 'day').hours(0).minutes(0).seconds(0).milliseconds(0);
  const lastDay = moment().add(30, 'day');

  const today = moment();

  while(day < lastDay) {
    const dayOfWeek = day.format('E');
    if (dayOfWeek <= 5) {
      const visitPerDay = averageVisitPerDay + casual.integer(-30, 30);
      let dayShops = [...shops];
      for (i = 0; i < visitPerDay; i++) {
        const shopPos = casual.integer(0, dayShops.length);
        const shop = dayShops[shopPos];
        dayShops.splice(shopPos, 1);

        let feedback = day < today;
        if (feedback && casual.integer(0,10) > 8) feedback = false;

        visits.push({
          visitDate: day.toDate(),
          feedback,
          ...shop,
        });
      }
    } 
    day = day.add(1, 'day');
  }

  return visits;
};

const addToMongo = async (visits) => {
  const visitsToProcess = [...visits];
  const batchSize = 200;

  const db = await getMongoDb();
  const mongoCollection = db.collection('visit');

  while(visitsToProcess.length > 0) {
    l(`Visits to process: ${visitsToProcess.length}/${visits.length}`);
    const batch = visitsToProcess.splice(0, batchSize);
    await mongoCollection.insertMany(batch);
  }

}

module.exports = async (req, res) => {
  const db = await getMongoDb();

  await db.collection('things').insertOne({d:1});

  const rowCount = await db.collection('things').countDocuments();

  const visits = genVisits();

  await addToMongo(visits);

  res.json({rowCount, visits: visits.length });
  return;

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
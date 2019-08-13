const casual = require('casual');

module.exports = (req, res) => {
  res.end('Wow! ' + casual.name);
}
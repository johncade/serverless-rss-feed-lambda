const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);

const feeds = require('./lib/feeds2.json');
const RssFeed = require('./lib');
const feedParse = new RssFeed(feeds);

function run () {
  return new Promise((resolve, reject) => {
      feedParse.logFeeds()
          .then(result => {
              return writeFile('./results.json', JSON.stringify(result));
          })
          .then(() => {
              console.log('done');
              resolve(true);
          })
          .catch((err) => {
              console.log(err); 
              reject(false);
          });
  })  
}

run();


require('dotenv').config();
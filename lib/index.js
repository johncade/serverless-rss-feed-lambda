const FeedParser = require('feedparser');
const request = require('request'); // for fetching the feed
const { Article } = require('../src/schema');
const mongoose = require('mongoose')
const uuid = require('uuid/v4');


async function fetchFeed (feed) {
  mongoose.connect('mongodb+srv://server:gatsby@cluster0-aathf.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true });
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function () {
    // we're connected!
    console.log('Connected to Mongo server..');
  });

  const req = request(feed);
  const options = [];
  const feedparser = new FeedParser(options);

  req.on('error', function (error) {
    // handle any request errors
  });

  req.on('response', function (res) {
    var stream = this; // `this` is `req`, which is a stream

    if (res.statusCode !== 200) {
      this.emit('error', new Error('Bad status code'));
    } else {
      stream.pipe(feedparser);
    }
  });

  feedparser.on('error', function (error) {
    // always handle errors
  });

  feedparser.on('readable', function () {
    // This is where the action is!
    var stream = this; // `this` is `feedparser`, which is a stream
    var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
    var item;
    const items = [];
    while (item = stream.read()) {
      const obj =  {
        title: item.title,
        author: item.meta.author,
        description: item.description,
        summary: item.summary,
        id: uuid(),
        guid: item.meta.guid
      }
      items.push(obj)
     // console.log(item.meta)
    }
    Article.insertMany(items);
    console.olog('done');
  });
  return {};
};


function MongoDB () {
  const db = 'foo'
  return db
}



module.exports = {
  fetchFeed,
  MongoDB
};

const { fetchFeed } = require('../lib');

exports.handler = async (event, context) => {
  // Log the event argument for debugging and for use in local development.
  console.log(JSON.stringify(event, undefined, 2)); 
  return fetchFeed('http://sports.espn.go.com/espn/rss/ncf/news');
};
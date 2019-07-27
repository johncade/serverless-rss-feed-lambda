const Algorithmia = require('algorithmia');
const debug = require('debug')('algorithm');

const validator = require('./validator');
// this API Key will only work on Algorithmia's website; get your own key at https://algorithmia.com/user#credentials
var algoClient = Algorithmia.client(process.env.ALGO_KEY);

var algorithms = {
  autotag: '/nlp/AutoTag/1.0.1',
  html2text: '/util/Html2Text/0.1.4',
  scrapeRss: '/tags/ScrapeRSS/0.1.6',
  sentiment: '/nlp/SentimentAnalysis/1.0.3',
  summarizer: '/nlp/Summarizer/0.1.6'
};

function sentimentScoreToText(sentimentScore) {
  var sentimentType = 'neutral';
  if (sentimentScore >= 0.2) {
    sentimentType = 'positive'
  } else if (sentimentScore <= -0.2) {
    sentimentType = 'negative'
  }
  return Math.abs(sentimentScore) >= 0.4 ? 'very ' + sentimentType : sentimentType;
}

class RssFeed {
  constructor(feeds) {
    this.results = [];
    this.feeds = feeds;
    this.feedData = [];
  }

  async logFeeds() {
     console.log('logging feeds')
      const promises = this.feeds.map(feed => this._logFeed(feed))
      
    return Promise.all(promises);
  }

  async _sentimentAnalyzeFeedEntry(entryText) {
    const response = await algoClient.algo(algorithms.sentiment).pipe({ document: entryText });
    const score = Math.round(response.result[0].sentiment * 100) / 100;
    return sentimentScoreToText(score);
  }

  async _processFeed(feed) {
      const response = await algoClient.algo(algorithms.scrapeRss).pipe(feed);
      const promises = await response.result.map(async (feed) => {
        if (validator.validateEntry(feed)) {
          return this._processFeedEntry(feed);
        }
        console.log('Feed failed validagtion');
        console.log(feed);
        return {};
      });
      return await Promise.all(promises);
  }

  async _summarizeFeedEntry(entryText) {
      const response = await algoClient.algo(algorithms.summarizer).pipe(entryText)
      return response.result;
  }

  async _autotagFeedEntry(entryText) {
    const text = typeof (entryText) == 'string' ? entryText.split('\n') : [];
    const response = await algoClient.algo(algorithms.autotag).pipe(text);
    return response.result;
  }

  async _processFeedEntry(entry) {

    const response = await algoClient.algo(algorithms.html2text).pipe(entry.url);
    const text = response.result;
    let tags, summary;
    if (text) {
      summary = await this._summarizeFeedEntry(text);
      tags = await this._autotagFeedEntry(text);
    }


    return {
      title: entry.title,
      description: entry.description,
      url: entry.url,
      content: text,
      summary,
      tags,
    }
  }

  async _logFeed(feed) {
    console.log('Logging', feed);
    const stories = await this._processFeed(feed);
    console.log('stories done...');
    return stories;
  }
}

// const feeds = require('../lib/feeds2.json');
// const feedParse = new RssFeed(feeds);

// const feed = feedParse.logFeeds();

module.exports = RssFeed;

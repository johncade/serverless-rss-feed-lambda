const Algorithmia = require('algorithmia');
const fs = require('fs');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
// this API Key will only work on Algorithmia's website; get your own key at https://algorithmia.com/user#credentials
var algoClient = Algorithmia.client('sim43GD8oBTTqjwRb7/tfCO9/RV1');

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
    constructor (feeds) {
        this.results = [];
        this.feeds = feeds;
        this.feedData = [];
    }
    async _sentimentAnalyzeFeedEntry(entryText) {
        const response = await algoClient.algo(algorithms.sentiment).pipe({ document: entryText });
        console.log(Object.keys(response.result));
        const score = Math.round(response.result[0].sentiment * 100) / 100;
        return sentimentScoreToText(score);
    }

    async _processFeeds() {
        const response = await algoClient.algo(algorithms.scrapeRss).pipe(this.feedUrl);
        this.feedData.concat(response.result);
        const promises = await response.result.map(async (feed) => {
           return this._processFeedEntry(feed);
        });
        return Promise.all(promises);
    }

    _summarizeFeedEntry (entryText) {
        return new Promise((resolve, rejec) => {
            algoClient.algo(algorithms.summarizer).pipe(entryText)
            .then(response => {
                resolve(response.get());
            })
        })
    }

   async _autotagFeedEntry (entryText) {
       const text = typeof (entryText) == 'string' ? entryText.split('\n') : [];
       const response = await algoClient.algo(algorithms.autotag).pipe(text);
       return response.result;
    }   

    async _processFeedEntry (entry) {

    const response = await algoClient.algo(algorithms.html2text).pipe(entry.url);
    const text = response.result;
    const summary = await this._summarizeFeedEntry(text);
    const tags = await this._autotagFeedEntry(text);

    return {
        title: entry.title,
        description: entry.description,
        url: entry.url,
        content: text,
        summary,
        tags,
        }    
    }

    async logFeed() {
        const stories = await this._processFeeds();

        await writeFile('./results.json', JSON.stringify(stories));
        console.log('stories done...');
    }
}

const feedParse = new RssFeed('https://www.espn.com/espn/rss/ncf/news');

feedParse.logFeed();
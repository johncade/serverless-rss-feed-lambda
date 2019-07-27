// this API Key will only work on Algorithmia's website; get your own key at https://algorithmia.com/user#credentials
var algoClient = Algorithmia.client('sim43GD8oBTTqjwRb7/tfCO9/RV1');

var algorithms = {
  autotag: '/nlp/AutoTag/1.0.1',
  html2text: '/util/Html2Text/0.1.4',
  scraperss: '/tags/ScrapeRSS/0.1.6',
  sentiment: '/nlp/SentimentAnalysis/1.0.3',
  summarizer: '/nlp/Summarizer/0.1.6'
};

/**
 * once DOM is ready, update vars, set initial URL, and add handlers
 */
function init() {
  setInviteCode('rss');
  updateRssUrl();
  requireHttp($('#rssUrl'));
};

/**
 * copy URL of RSS feed from dropdown into input text
 */
function updateRssUrl() {
  $('#rssUrl').val($('#rssSelector :selected').val());
}

/**
 * Display error message to user; can also be used to test if error is present
 * @param response (optional) response to inspect for error; if error is not present, returns immediately (nothing will be displayed)
 * @param errorMessage (optional) message to display instead of the error itself
 * @returns {boolean} true if there was an error
 */
function displayError(response, errorMessage) {
  if(response && response.error) {
    console.log(response.error);
    $('#status-label').html('<span class="text-danger">' + (errorMessage?errorMessage:response.error) + '</span>');
    return true;
  }
  return false;
}

/**
 * convert a sentiment score [-1 to 1] to natural language [(very) negative / (very) positive / neutral] by quintile
 * @param sentimentScore
 * @returns {string}
 */
function sentimentScoreToText(sentimentScore) {
  var sentimentType = 'neutral';
  if (sentimentScore >= 0.2) {
    sentimentType = 'positive'
  } else if (sentimentScore <= -0.2) {
    sentimentType = 'negative'
  }
  return Math.abs(sentimentScore) >= 0.4 ? 'very '+sentimentType : sentimentType;
}

/**
 * scrape the RSS feed and analyze its entries
 */
var processFeed = function() {
  // clear out any old results
  ('#results').empty();
  ('#status-label').empty();
  $('#fetch-spinner').removeClass('hidden');
  $('#rssSelector').attr('disabled','disabled');
  $('#rssUrl').attr('disabled','disabled');
  // query RSS scraper algorithm with selected feed URL
  var feedUrl = $('#rssUrl').val();
  algoClient.algo(algorithms.scraperss).pipe(feedUrl).then(function(response) {
    $('#fetch-spinner').addClass('hidden');
    $('#rssSelector').removeAttr('disabled');
    $('#rssUrl').removeAttr('disabled');
    if (displayError(response, 'Failed to load RSS feed; please check that it is a valid URL')) {return;}
    $('#resultsWrapper').removeClass('hidden');
    // smooth scroll to results section
    $('html, body').animate({
      scrollTop: $("#resultsWrapper").offset().top
    }, 1000);
    // process no more than 6 RSS entries
    response.result.slice(0,6).forEach(processFeedEntry);
  });

};

/**
 * insert a section into page showing an RSS feed entry's title, generated summary & tags, and sentiment analysis 
 * @param entry {{url:string,title:string}} feed entry with URL and Title
 */
var processFeedEntry = function(entry) {
  // create section and elements into which we will stick the results of our algorithms
  var row = $('<section class="rss-result"><div class="row whitespace-none">'
    + '<div class="col-md-12 col-lg-9">'
    + '<p class="item-title">ARTICLE TITLE</p>'
    + '<h4 class="result"><a href="' + entry.url + '">' + entry.title + '</a></h4>'
    + '<p class="item-title">GENERATED SUMMARY</p>'
    + '<p class="summary"><span class="aspinner"></span></p>'
    + '<p class="item-title">GENERATED TAGS</p>'
    + '<div class="tags"><span class="aspinner"></span></div>'
    + '<p class="item-title">SENTIMENT ANALYSIS</p>'
    + '<div class="sentiment"><span class="aspinner"></span></div>'
    + '</div></section>');
  $('#results').append(row);
  // fetch text from the page to which this entry points, and extract summary, tags, and sentiment
  algoClient.algo(algorithms.html2text).pipe(entry.url).then(function (response) {
    if (displayError(response, 'Error fetching ' + entry.url + ': ' + response.error)) {
      return;
    }
    summarizeFeedEntry(response.result, row.find('.summary:first'));
    autotagFeedEntry(response.result, row.find('.tags:first'));
    sentimentAnalyzeFeedEntry(response.result, row.find('.sentiment:first'));
  });
};

/**
 * get a summary of the entryText (via https://algorithmia.com/algorithms/nlp/Summarizer), insert into targetElement
 * @param entryText full plaintext of the entry 
 * @param targetElement jQuery DOM element into which results should be placed
 */
function summarizeFeedEntry(entryText, targetElement) {
  // call Algorithmia API for summary of text
  algoClient.algo(algorithms.summarizer).pipe(entryText).then(function(response) {
    if(displayError(response.error)) {return;}
    targetElement.text(response.result);
  });
}

/**
 * extract tags from entryText (via https://algorithmia.com/algorithms/nlp/AutoTag), insert into targetElement
 * @param entryText full plaintext of the entry 
 * @param targetElement jQuery DOM element into which results should be placed
 */
function autotagFeedEntry(entryText, targetElement) {
  var topicLabels = [];
  entryText = typeof(entryText)=='string'? entryText.split('\n') : [];
  // call Algorithmia API for autotag analysis
  algoClient.algo(algorithms.autotag).pipe(entryText).then(function(response) {
    if(!displayError(response.error)) {
      for (var key in response.result) {
        topicLabels.push('<span class="label label-info">' + response.result[key] + '</span> ');
      }
      targetElement.html(topicLabels.join(''));
    }
  });
}

/**
 * analyze sentiment of entryText (via https://algorithmia.com/algorithms/nlp/SentimentAnalysis), insert into targetElement
 * @param entryText full plaintext of the entry
 * @param targetElement jQuery DOM element into which results should be placed
 */
function sentimentAnalyzeFeedEntry(entryText, targetElement) {
  // call Algorithmia API for sentiment analysis
  algoClient.algo(algorithms.sentiment).pipe({document:entryText}).then(function(response) {
    if(displayError(response)) {return;}
    var sentimentScore = Math.round(response.result[0].sentiment*100)/100;
    targetElement.html('<p>'+sentimentScore+' ('+sentimentScoreToText(sentimentScore)+')</p>');
  });

}
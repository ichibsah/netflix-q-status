// ==UserScript==
// @name          Netflix Q Status
// @namespace     http://www.pantz.org/
// @description   Show Netflix DVD queue status on websites. Add to queue button.
// @version       1.4
// @include       /^https?://www\.rottentomatoes\.com/.*$/
// @include       /^https?://www\.imdb\.com/.*$/
// @include       /^https?://www\.metacritic\.com/.*$/
// @include       /^https?://www\.fandango\.com/.*$/
// @grant         GM_addStyle
// @grant         GM_xmlhttpRequest
// ==/UserScript==

// turn debug on for console debugging messages
var debug = false;

// style for pop up box
var style1 = '#popuptopnqs { height:auto; width:350; background:#b9090b;' +
             'text-align:left; padding:1px 1px 3px 1px; '+
             'margin:0px 0px 3px 0px; font-weight:bold; color:#fff;}' +
             'a.lh:link {color:#fff;} a.lh:visited {color:#fff;} a.lh:active' +
             '{color:#fff;} #bpright {float:right; padding:6px;} ' +
             '#bpleft {float:left; padding:3px;}';

// add the GM style
GM_addStyle(style1);

// frame detection. detects top frame.
// needed to stop multiple code exec in all (i)frames
var frameless = (window === window.top)?true:false;

// check html5 storage support
if (typeof(sessionStorage) == 'undefined' ) {
  // html5 session storage not supported. set var
  var sStorage = false;
  // add the default red icon and be done. no queue icons.
  addIcons();
  debug && console.log("HTML5 session storage not supported");
} else {
  // we have HTML5 storage
  var sStorage = true;
  debug && console.log("HTML5 session storage supported");
  // try to get last update time from storage
  var lastUpdateTime = sessionStorage.getItem("NqsLastUpdateTime");

  // if time key DNE (null obj), don't try update because getQueue never worked
  if (lastUpdateTime != null) {
   // if frameless is true we only execute code in the top frame
    if (frameless) {
      // get current time
      var currentTime = unixTime();
      // get delta of times
      var deltaTime = currentTime - lastUpdateTime;
      // update movie cache if greater than set # of secs

      if (deltaTime > 360) {
        debug && console.log("Netflix Queue cache expired. Refreshing...");
        // cache expired. get new netflix queue info
        getQueue();
        // set timer and see if getQueue returns faster than timer
        // if not add icons, if so getQueue clears timer
        var queueTimer = setTimeout(
                           function() {
                             addIcons();
                             queueTimer = undefined;
                           },
                           8000
                         );
      } else {
        // cache still good, just add icons to page
        addIcons();
      }
    }
  } else {
    // session key was not there, means we were returned null obj
    // if frameless is true we only execute code in the top frame
    if (frameless) {
      // fire to get url, which then fires getQueue if successful
      getRssId();
      // set timer and see if getRssId & getQueue return faster than timer
      // if not add icons. if so getQueue clears timer
      var queueTimer = setTimeout(
                         function() {
                           addIcons();
                           queueTimer = undefined;
                         },
                         8000
                       );
    }
  }
}

// add all of the icons to the webpage
function addIcons () {
  // get website hostname
  var hostName = window.location.hostname;

  /***** begin rottentomatoes.com *****/
  // only run if hostname matches
  if (hostName.match(/rottentomatoes\.com/i)) {
    // XPath query parts
    var xp = '//td[contains(@class, "middle_col")]//a | ' +
             '//td//a[contains(@class, "unstyled articleLink")]'
    // XPath query
    var Snap1 = document.evaluate(xp,
                                  document,
                                  null,
                                  XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                                  null);

    for (var i = 0; i < Snap1.snapshotLength; i++) {
      var elm1 = Snap1.snapshotItem(i);
      var moviename = elm1.innerHTML;
      elm1.parentNode.insertBefore(CreateLink(moviename), elm1);
    }
  }
  /***** end rottentomatoes.com *****/

  /***** begin imdb.com *****/
  // only run if hostname matches
  if (hostName.match(/imdb\.com/i)) {
    // XPath query, any anchor tag with /title
    var Snap1 = document.evaluate("//a[contains(@href,'/title')]",
                                  document,
                                  null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                                  null);

    for (var i = 0; i < Snap1.snapshotLength; i++) {
      var elm1 = Snap1.snapshotItem(i);
      // regexes in strings with double escaped escape chars \ is \\
      var regx1 = '^(?:https?\\:\\/\\/www\\.imdb|\\/).*title\\/tt';
      var regx2 = '\\d+(\\?ref|\\/\\?ref|/\\/\\?pf|\\?pf|\\/$)';
      var urlRegex = new RegExp(regx1 + regx2,'i');
      // if no match go to next link
      if (!urlRegex.test(elm1)) {
        continue;
      }
      // suck out movie name
      var moviename = elm1.innerHTML;
      // get rid bad titles
      if (moviename.match('<')) {
        continue;
      }
      elm1.parentNode.insertBefore(CreateLink(moviename), elm1);
    }
  }
  /***** end imdb.com *****/

  /***** begin metacritic.com *****/
  // only run if hostname matches
  if (hostName.match(/metacritic\.com/i)) {
    // XPath query parts
    var xp = '//div[contains(@class,"title_wrapper")]' +
             '//a[contains(@href,"/movie/")]//span |' +
             '//td[contains(@class,"title_wrapper")]' +
             '//div[contains(@class,"title")]' +
             '//a[contains(@href,"/movie/")] |' +
             '//div[contains(@class,"product_title")]' +
             '//a[contains(@href,"/tv/")] |' +
             '//a[contains(@class,"title") and contains(@href,"/movie/")]';
    // XPath query
    var Snap1 = document.evaluate(xp,
                                  document,
                                  null,
                                  XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                                  null);

    for (var i = 0; i < Snap1.snapshotLength; i++) {
      var elm1 = Snap1.snapshotItem(i);
      var moviename = elm1.innerHTML;
      // work around span tag in anchor tag messing up link
      var gp = elm1.parentNode;
      gp.parentNode.insertBefore(CreateLink(moviename), gp.nextSibling);
    }
  }
  /***** end metacritic.com *****/

  /***** begin fandango.com *****/
  //only run if hostname matches
  if (hostName.match(/fandango\.com/i)) {
    // XPath query parts
    var xp = '//a[contains(@class,"visual-title dark") or' +
             ' contains(@class,"light")]';
    // XPath query
    var Snap1 = document.evaluate(xp,
                                  document,
                                  null,
                                  XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                                  null);

    for (var i = 0; i < Snap1.snapshotLength; i++) {
      var elm1 = Snap1.snapshotItem(i);
      var moviename = elm1.innerHTML;
      elm1.parentNode.insertBefore(CreateLink(moviename), elm1);
    }
  }
  /***** end fandango.com *****/
}

// script site url
var nqsUrl = 'https://github.com/psyer/netflix-q-status';

// json page search link
var jurl = "https://dvd.netflix.com/JSON/SearchPageJSON?v1=";

// html page search link
var hurl = 'https://dvd.netflix.com/Search?v1=';

function jsonSearchUrl(moviename) {
  // make the JSON search url
  return jurl + EncodeMovieName(moviename);
}

function htmlSearchUrl(moviename) {
  // make html page search link
  return hurl + EncodeMovieName(moviename);
}

function CreateLink(moviename) {
  // create span tag
  var newLink = document.createElement("span");
  // create image tag
  var NfxImg = document.createElement("IMG");
  // the "not in queue" icon
  var NfxImgIcoN = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAY' +
                   'AAAAf8/9hAAAACXRFWHRYLUluZGV4ADC0w5xiAAAA90lEQVQ4jaWTsU7D' +
                   'MBRFT1GkpK1ikDriFRBZWIoov5IB/gqJtV0rhkQMfEHdjcndOpkFNrOgl' +
                   'DYMFVWJiyMld3tXusd+T+91Xrr9kj0993scklx9c1UUjn9UNZbXQ9I8I8' +
                   '0zXi/OCe/vSPOMx5NjZlHoAIKqIYTgZjTaviolUspdPRGC268P/w/29Rv' +
                   '0yQuIhWgHSJKkOUBrzWUbwJsxiDYtLLQG6gfpbQHgVMpmgE9rge0uNAIA' +
                   'zJXyhmsBxphagLPK1lrmSmGt5Wk6ZaH1bqCH1Kle4ziOUd3o38DD+99bc' +
                   'AAAsyjEBAG9suSsWAEwWK8ZbDYO8AdN/UvYu2+1+AAAAABJRU5ErkJggg' +
                   '==';
  // the "in queue" icon
  var NfxImgIcoQ = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAY' +
                   'AAAAf8/9hAAAACXRFWHRYLUluZGV4ADC0w5xiAAAAeklEQVQ4jWM8fPjw' +
                   'fwYKAAsDAwODjY0NWZqPHDkCMQAb2MXFg8J3+/YFqzomYjTjEsNqAC6Fu' +
                   'OSY8Clw+/YFw+noarB6AaYZGxuvC8gBg9gA5MDCFzMoBmALcUIJCsMF+E' +
                   'IcmxxWL+AyBOYiZFfhzAvIhuALA0ZKszMAFkgt9SJ1+CYAAAAASUVORK5' +
                   'CYII=';
  // html5 storage not supported use default icon
  if (sStorage === false) {
    //use default red netflix icon
    NfxImg.setAttribute("src",NfxImgIcoN);
  } else {
    // is supported. check if in queue.
    if ( sessionStorage.getItem(normMovieName(moviename)) == "null" ) {
      // exists! use Q icon
      NfxImg.setAttribute("src",NfxImgIcoQ);
    } else {
      // not in queue use default icon
      NfxImg.setAttribute("src",NfxImgIcoN);
    }
  }
  // place image in span tag
  newLink.appendChild(NfxImg);
  // attach a listener to our image. on click run popup box function.
  // use anon function. pass movie name and page event status
  newLink.addEventListener(
    "click",
    function(event){
      getMovie(event,moviename)
    },
    false
  );
  // add space after image
  newLink.appendChild(document.createTextNode(" "));
  // return our image with our listener attached to be placed after anchor tag
  return newLink;
}

// encode movie name to be url friendly for search, encodeURI sucks
function EncodeMovieName(str) {
  // clean up lead/trail spaces
  str = str.replace(/^\s+|\s+$/gm,"");
  // movie names with html escapes need to be translated before encode
  str = str.replace(/\&quot\;/g,"\"");
  str = str.replace(/\&amp\;/g,"&");
  str = str.replace(/\&lt\;/g,"<");
  str = str.replace(/\&gt\;/g,">");
  // let this guy do most of the work
  str = encodeURIComponent(str);
  // encodeURIComponent() does not encode !'()*-._~ gotta fix that
  str = str.replace(/\!/g,"%21");
  str = str.replace(/\'/g,"%27");
  str = str.replace(/\(/g,"%28");
  str = str.replace(/\)/g,"%29");
  str = str.replace(/\./g,"%2E");
  str = str.replace(/\_/g,"%5F");
  str = str.replace(/\*/g,"%2A");
  str = str.replace(/\-/g,"%2D");
  return str;
}

// normailize all movie names for better in queue detection
function normMovieName(str) {
  // lowercase movie name
  str = str.toLowerCase();
  // replace any clutter with a blank
  // regexes in strings with double escaped escape chars \ is \\
  var regx1 = '[:\\\'\\"\\.\\?\\!\\$\\+\\#@&-]|\\s+|the |and |<[^>]*>';
  var regx2 = '|\\([^\\)]*\\)|\\f|\\v|\\r|\\n|\\t';
  var regx3 = '|\\u0085|\\u000C|\\u2028|\\u2029'
  var mnregx = new RegExp(regx1 + regx2 + regx3,'g');
  str = str.replace(mnregx,"");
  return str;
}

// generate unix time for session value
function unixTime () {
  // get unix time
  var unixTime = Math.round(new Date().getTime() / 1000);
  return unixTime;
}

// log response info
function repInfo(rep,msg) {
console.log([msg,
            rep.finalUrl,
            rep.status + ' ' + rep.statusText,
            rep.responseHeaders,
            ].join("\n"));
}

function showErrorBox(msg,event,movie) {
  // msg and event required. movie is optional
  var body = '<div id="popuptopnqs"><b>ERROR</b></div>' +
  '<div style="padding:7px;">' + msg;

  if (movie != undefined) {
    var url = 'Here is a manual link to your movie search: ' +
    '<a href="' + htmlSearchUrl(movie) + '">' + movie + '</a><hr>';
    body += url
  }
  // show popup with error
  showBox(event,body);
}

function getJson(event,moviename) {
  // Set our own connect error timeout because GM_xmlhttpRequest takes
  // waaaaay to long to timeout with onerror
  var errorTimer = setTimeout(
                     function(){
                         var msg = 'It is taking to long to connect' +
                                   'to the Nexflix search page.'
                         return showErrorBox(msg,event,moviename);
                     },
                     10000);
  // make the http request to netflix. if it fails in any way show an error
  GM_xmlhttpRequest({
    method: "GET",
    url: jsonSearchUrl(moviename),
    onerror: function(rep) {
      var msg = 'Could not connect/load JSON info from Netflix.'
      showErrorBox(msg,event,moviename);
      // log connection failure to console
      debug && repInfo(rep,"JSON query request failed!!");
    },

    onload: function(rep) {
      // clear our timer because onload returned fast enough
      clearTimeout(errorTimer);
      // debug server response to console log
      debug && repInfo(rep,"JSON query request finished");
      // if we recieved a page back OK then parse and show it
      if (rep.statusText == "OK") {
        // try to parse response as pure JSON
        var mjson = JSON.parse(rep.responseText);

        // check for rowMovies key in JSON, else throw error box
        if (mjson.hasOwnProperty('rowMovies')) {
          debug && console.log("Found top key in JSON. Looking good...");
          var rm = mjson.rowMovies[0];

          // log JSON output for debug
          debug && console.log("JSON returned: " + JSON.stringify(rm));

          // if nothing in rowMovies then no movies were returned
          if (rm === undefined) {
            var msg = 'There were no results found for the title ' + moviename;
            return showErrorBox(msg,event);
          }

          // let anything not found fail through to 'undefined'
          // title, always provided
          if (rm.hasOwnProperty('title')) {
            var title = rm.title;
          }
          // title url, always provided
          if (rm.hasOwnProperty('mdpUrl')) {
            var titleUrl = rm.mdpUrl;
          }
          // title year, always provided
          if (rm.hasOwnProperty('year')) {
            var year = rm.year;
          }
          // title duration, not always provided
          if (rm.hasOwnProperty('duration')) {
            var duration = rm.duration;
          }
          // title mpaa rating, always provided
          if (rm.hasOwnProperty('mpaaRating')) {
            var rating = rm.mpaaRating;
          }
          // title image, always provided
          if (rm.hasOwnProperty('imgSrc')) {
            var titleImg = rm.imgSrc;
          }
          // if we are signed in we get buttons, else undef
          if (rm.hasOwnProperty('buttonGroup')) {
            var bg = rm.buttonGroup;
            // buttons for queue state and url for adding
            if (bg.hasOwnProperty('queueButton')) {
              var bgqb = bg.queueButton;
              var qHref = bgqb.href;
              var qState = bgqb.state;
            }
            // if movie is streamable we get a button, else undef
            if (bg.hasOwnProperty('playButton')) {
              var bgpb = bg.playButton;
              var playHref = bgqb.href;
              var playState = bgqb.state;
            }
          }
          // if signed in we get starbar info, else undef
          if (rm.hasOwnProperty('starbar')) {
            var sb = mjson.rowMovies[0].starbar;
            if (sb.hasOwnProperty('rating')) {
              var starRat = sb.rating;
            }
            if (sb.hasOwnProperty('prediction')) {
              var starPre = sb.prediction;
            }
          }
          // title synopsis, always provided
          if (rm.hasOwnProperty('synopsis')) {
            var titleSyn = rm.synopsis;
          }

          // show box if we have title and queue state else show error
          if (title != undefined && qState != undefined) {
            // set button status
            // in Q link
            if (qState.match('(IN_QUEUE|IN_DVD)')) {
              status = '<span id="nonqsstatus" title="' + qHref +
              '"style="text-decoration:none; border:1px solid black;' +
              'padding:5px; background:#f6f5f4;color:#b9090b;' +
              ' font-size:13px;font-weight:bold;">In Queue</span>';
            // add link
            } else if (qState.match('ADD')) {
              status = '<span id="nqsstatus" title="' + qHref +
              '"style="text-decoration:none;border:1px solid black;' +
              'padding:5px;background:#b9090b;color:#fff;' +
              'font-size:13px;font-weight:bold;">Add</span>';
            // save link
            } else if (qState.match('SAVE')) {
              status = '<span id="nqsstatus" title="' + qHref +
              '"style="text-decoration:none; border:1px solid black;' +
              'padding:5px;background:#8bb109;color:#fff;font-size:13px;' +
              'font-weight:bold;">Save</span>';
            // home link
            } else if (qState.match('AT_HOME')) {
              status = '<span id="nonqsstatus" title="' + qHref +
              '"style="text-decoration:none; border:1px solid black;' +
              'padding:5px; background:#f6f5f4;color:#333;font-size:13px;' +
              'font-weight:bold;">At Home</span>';
            // Discs link
            } else if (qState.match('CHOOSE_DISCS')) {
              status = '<span id="nonqsstatus" title="' + titleUrl +
              '" style="text-decoration:none; border:1px solid black;' +
              'padding:5px; background:#fff;color:#000; font-size:13px;' +
              'font-weight:bold;"><a href="' + qHref +
              '" target="new">Choose Discs</a></span>';
            }

            // throw in stream link if found
            if (playHref != undefined) {
              status = status + ' <span style="text-decoration:none;' +
              'border:1px solid black; padding:5px; background:#fff;' +
              'color:#333; font-size:13px;font-weight:bold;"><a href="' +
              playHref + '">Play</a></span>';
            }

            // set rating state
            if (starRat != undefined) {
              rat = '<b>Your rating</b>: ' + starRat + '<br>';
            } else {
              rat = '';
            }
            // set year
            if (year != undefined) {
              yr = '<b>Released</b>: ' + year + '<br>';
            } else {
              yr = '';
            }
            // set duration
            if (duration != undefined) {
              dur = '<b>Duration</b>: ' + duration + '<br>';
            } else {
              dur = '';
            }
            // set MPAA Rating
            if (rating != undefined) {
              mrat = '<b>MPAA Rating</b>: ' + rating + '<br>';
            } else {
              mrat = '';
            }

            // put together code for titles pop up box with all parts
            var boxBody = '<div id="popuptopnqs">' +
            '<a class="lh" href="' + titleUrl + '"> ' + title +
            '</a></div><img style="margin:0px 5px 0px 1px;" align="left" ' +
            'width="110" height="150" src="' + titleImg + '">' +
            '<div style="padding:3px;">' + titleSyn + '<br><br>' +
            dur + yr + mrat + rat + '</div><hr><br>' +
            '<span id="bpleft">' + status + '</span>';
            // show our movie box
            showBox(event,boxBody);

          } else {
              var msg1 = "Title or queue state does not match in JSON. ";
              var msg2 = "The addon might need to be updated. Please go " +
                         "to <a href=" + nqsUrl + ">here</a> to check " +
                         "for any update.";
              // show error for failed match
              showErrorBox(msg1+msg2,event,moviename);
              debug && console.log(msg1);
          }
        } else {
            // show error for failed key match
            var msg1 = "Top key in the JSON output did not match.";
            var msg2 = "The addon might need to be updated. Please go " +
                       "to <a href=" + nqsUrl + ">here</a> to check " +
                       "for any update.";
            // show error for failed match
            showErrorBox(msg1+msg2,event,moviename);
            debug && console.log(msg1);
        }
      } else { // We did not get an OK response from the server. Show error.
          var msg = 'There was a problem connecting to ' +
                    'the Nexflix JSON search page. ';
          showErrorBox(msg,event,moviename);
      }
    }
  });
}

function refreshCreds(event,moviename) {
  GM_xmlhttpRequest({
    method: "GET",
    url: 'https://dvd.netflix.com',
    onload: function(rep) {
      debug && repInfo(rep,"Session keep-alive returned");
      // make sure we got ok status from server
      if (rep.statusText == "OK") {
        // check for sign in text
        var pat = rep.responseText.match(/title\=\"Sign In\"/);

        // if the pattern worked then we are not signed in. error and stop.
        if (pat != null) {
          var msg = 'You are not signed into Netflix. ' +
          'This script only works for Netflix DVD members. ' +
          'Please sign in and try again.';
          showErrorBox(msg,event);
          return false;
        }

        if (sStorage === true) {
          sessionStorage.setItem("NqsServerKeepAlive",unixTime());
          getJson(event,moviename);
        } else {
          getJson(event,moviename);
        }
      } else {
        // non-ok returned show error box

      }
    },
  });
}

function getMovie(event,moviename) {
  if (sStorage === true) {
    var serverKeepAlive = sessionStorage.getItem("NqsServerKeepAlive");

    // if time key DNE (null obj), then check cache
    if (serverKeepAlive != null) {

      // get current time
      var currentTime = unixTime();

      // get delta of times
      var deltaTime = currentTime - serverKeepAlive;

      // JSON endpoint creds times out after about 5.5mins
      // have to hit a main page to re-up creds before JSON call
      // if last time we clicked icon is higher than # secs, hit main page
      if (deltaTime > 300) {
        debug && console.log("Netflix creds expired. Refreshing...");
        // do keep alive refresh
        refreshCreds(event,moviename);
      } else {
        debug && console.log("Keep alive cache still good. Getting JSON...");
        // cache still good just grab JSON
        getJson(event,moviename);
      }

    } else {
        // call was null we don't have a time, run and set time
        debug && console.log("No keep alive time found. Setting...");
        // do keep alive refresh
        refreshCreds(event,moviename);
    }
  } else {
      // no html5 local storage, just hit the main page each time, yuck!
      debug && console.log("O NO, no html5 storage, hit main page, pop box");
      refreshCreds(event,moviename);
  }

}

function getRssId() {
  // if we have rssid then bail
  if (haveRssId() === true) { return null; }

  // make the http request to netflix RSS Url Page.
  GM_xmlhttpRequest({
    method: "GET",
    url: "https://dvd.netflix.com/RSSFeeds",
    onerror: function(rep) {
      // log error
      console.log("We got an error response from Netflix RSS Url page");
    },
    onload: function(rep) {
      // if we recieved a page back OK then parse
      if (rep.statusText == "OK") {
        // parse Netflix rss page. suck out rss url id.

        // make rss id regex
        var wRegex =  /\/QueueRSS\?id=(\w+)"/;

        // set response
	var responseTxt = rep.responseText;

        // run regex. put matched values in array
        movieLinePat = responseTxt.match(wRegex);

        if (movieLinePat != null) {
          // store netflix rss id in sessionStorage
          sessionStorage.setItem('NqsNetflixRssId', movieLinePat[1]);
          // fire getQueue to retrieve queue items from rss feed
          getQueue();
        } else {
          sessionStorage.setItem('NqsNetflixRssId', "null");
          console.log('Failed to find RSS Url ID with RegEx');
        }
      } else {
          // response was non-ok log error
          repInfo(rep,"Non OK response from Netflix server getting RSS id.");
      }
    }
  });
}

function getQueue() {
  // if we don't have rssid then bail
  if (haveRssId() === false) { return null; }

  var rssId = sessionStorage.getItem('NqsNetflixRssId');
  var rssUrl = "https://dvd.netflix.com/QueueRSS?id=" + rssId;

  // make the http request to netflix
  GM_xmlhttpRequest({
    method: "GET",
    url: rssUrl,
    onerror: function(rep) {
      // log error
      console.log( "We got an error response from Netflix RSS queue page.");
    },
    onload: function(rep) {
      // if server response OK, then parse page with regex and grab move titles
      if (rep.statusText == "OK") {
        debug && console.log("Got OK response from RSS queue page");

        // copy response obj
	var responseTxt = rep.responseText;

        // regex for grabbing movie title lines in rss
        var rssTitleLineRegex = /<title>\d+.*<\/title>/g;

        // regex for pulling just movie title
        var rssTitleRegex = /<title>\d+- (.*?)<\/title>/;

        // run regex, put matched title lines in array
        movieLinePat = responseTxt.match(rssTitleLineRegex);

        // if regex worked store movie names, else log error and just add icons
        if (movieLinePat != null) {
          // loop through regex array. set as session vars
          for (var i = 0; i < movieLinePat.length; i++) {
            // put normalized movie name in session store
            movieNamePat = rssTitleRegex.exec(movieLinePat[i]);
            if (movieNamePat != null) {
              sessionStorage.setItem(normMovieName(movieNamePat[1]), "null");
            }
          }

          // set last connection time
          sessionStorage.setItem("NqsLastUpdateTime",unixTime());

          // if queue req beats timer clear it and add icons
          if ( queueTimer != undefined ) {
            // clear timer
            clearTimeout(queueTimer);
            // add icons
            addIcons();
          }

        // regex failed to get movie title log error
        } else {
            console.log("The Netflix queue RegEx is broken");
        }

      // We did not get an OK response from the server. Log error.
      } else {
          repInfo(rep,"Non OK response from Netflix server for RSS info.");
      }
    }
  });
}

function haveRssId() {
  // try to query RssId object from session storage
  var rssId = sessionStorage.getItem('NqsNetflixRssId');

  // if null string or obj returns, then we don't have it
  if (rssId === "null" || rssId === null) {
    return false;
  } else {
    return true;
  }
}

function hideBox() {
  // get popup box element id
  var PopUpId = document.getElementById('popupnqs');
  // hide the popup box
  PopUpId.style.visibility = "hidden";
  // remove the div from the DOM
  PopUpId.parentNode.removeChild(PopUpId);
}

function showBox(event,boxBody) {
   // if popup exists close it
  if (document.getElementById('popupnqs')) { hideBox(); }

  // start div for popup
  var popupWrapper = document.createElement("div");
  // give div our id for the popup
  popupWrapper.setAttribute("id",'popupnqs');
  // set box position absolute
  popupWrapper.style.position = 'absolute';
  // hide it while it's being generated
  popupWrapper.style.visibility = 'hidden';
  // make sure we left align some sites override
  popupWrapper.style.textAlign = 'left';
  // make it only so wide
  popupWrapper.style.width = '350px';
  // it can be a tall as it needs
  popupWrapper.style.height = 'auto';
  // add a nice border
  popupWrapper.style.border = '3px solid black';
  // make sure text is specific color
  popupWrapper.style.color = '#000';
  // make sure background is specific color
  popupWrapper.style.backgroundColor = 'white';
  // make sure our popup is always on top
  popupWrapper.style.zIndex = '9999999';

  // put our html we were passed in the box
  popupWrapper.innerHTML = boxBody;

  // make span for close listener
  var closeLink = document.createElement("span");
  // set id so we can add style
  closeLink.setAttribute("id",'bpright');
  // insert close text
  closeLink.appendChild(document.createTextNode("Close"));
  // add listener to span
  closeLink.addEventListener("click", hideBox, false);
  // add close link span to div
  popupWrapper.appendChild(closeLink);
  // get page body element
  var bod = document.getElementsByTagName("BODY")[0];
  // add div to page body
  bod.appendChild(popupWrapper);

  // if correct button id exists attach listener
  var gIdStat = document.getElementById('nqsstatus');
  if (gIdStat != null) {
    gIdStat.addEventListener("click",
                             function(event){addToQueue(event)},
                             false);
  }

  // get mouse X coordinate
  var mX = event.pageX;
  // get mouse Y coordinate
  var mY = event.pageY;
  // get div (box) width X
  var dX = popupWrapper.clientWidth;
  // get div (box) height Y
  var dY = popupWrapper.clientHeight;
  // window size Y
  var sY = window.innerHeight;
  // window size X
  var sX = window.innerWidth;
  // get scrolled page Y offset
  var oY = self.pageYOffset;
  // get scrolled page X offset
  var oX = self.pageXOffset;

  // get half of each on screen area with scroll comp
  var qW = (sX/2)+oX; qH=(sY/2)+oY;

  // pop down and right from cursor
  if ( mX<=qW && mY<=qH ) { pX = mX; pY = mY; }
  // pop up and right from cursor
  if ( mX<=qW && mY>=qH ) { pX = mX; pY = mY-dY; }
  // pop up and left from cursor
  if ( mX>=qW && mY>=qH ) { pX = mX-dX; pY = mY-dY; }
  // pop down and left from cursor
  if ( mX>=qW && mY<=qH ) { pX = mX-dX; pY = mY; }

  // if we can't get mouse chords then default to popup in center of screen
  if (typeof pX === 'undefined' && typeof pY === 'undefined') {
    // center box
    pX = sX/2-dX/2+oX; pY = sY/2-dY/2+oY;
  }

  // set box Y chord relative to cursor with css
  popupWrapper.style.top = pY + 'px';
  // set box X cord relative to cursor with css
  popupWrapper.style.left = pX + 'px';
  // finally! make our box visible
  popupWrapper.style.visibility = "visible";
}

function addToQueue (event) {
  // grab add to queue url from title property and put it in a var
  var addToQueueUrl = document.getElementById('nqsstatus').title;

  // make the http request to netflix. if it fails in any way show an error
  GM_xmlhttpRequest({
    method: "GET",
    url: addToQueueUrl,
    onerror: function(rep) {
      // show the error popup
      var msg = 'Could not connect to Netflix when trying' +
                'to add move to queue.'
      showErrorBox(msg,event);
    },

    onload: function(rep) {
      // if we recieved a page back OK then parse and show it
      if (rep.statusText == "OK") {
        // blank out current button
        document.getElementById('bpleft').innerHTML = '';
        // put in added to queue button
        document.getElementById('bpleft').innerHTML = '<span id="nqsstatus"' +
        'style="text-decoration:none;border:1px solid black;padding:5px;' +
        'background:#f6f5f4;color:#b9090b;font-size:13px;font-weight:bold;">' +
        'Added to Queue</span>';
        // We did not get an OK response from the server. Show error.
      } else {
          // show the error popup
          var msg = 'Non-OK response from Netflix when trying' +
                    'to add move to queue.'
          showErrorBox(msg,event);
      }
    }
  });
}

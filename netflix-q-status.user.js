// ==UserScript==
// @name          Netflix Q Status
// @namespace     http://www.pantz.org/
// @description   Show Netflix queue status on websites. Add to queue button.
// @version       1.1
// @include       http://www.rottentomatoes.com/*
// @include       http://www.imdb.com/*
// @include       http://www.metacritic.com/*
// @include       http://www.fandango.com/*
// @grant         GM_addStyle
// @grant         GM_xmlhttpRequest
// ==/UserScript==

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
  var sStorage = 1;
  // add the default red icon and be done. no queue icons.
  addIcons();
} else {
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
    var xp = '//td[contains(@class, "middle_col")]//a |' +
              ' //td//a[contains(@class, "unstyled articleLink")]';
    // XPath query
    var Snap1 = document.evaluate(
                  xp,
                  document,
                  null,
                  XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                  null
                );

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
    var Snap1 = document.evaluate(
                  "//a[contains(@href,'/title')]",
                  document,
                  null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                  null
                );

    for (var i = 0; i < Snap1.snapshotLength; i++) {
      var elm1 = Snap1.snapshotItem(i);
      // regexes in strings with double escaped escape chars \ is \\ 
      var regx1 = '^(?:http\\:\\/\\/www\\.imdb|\\/).*title\\/tt';
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
    var xp = '//*[contains(@class,"_title") or contains(@class,"releases")]' +
             ' //a[contains(@href,"/movie/") or contains(@href,"/tv/")]';
    // XPath query
    var Snap1 = document.evaluate(
                  xp,
                  document,
                  null,
                  XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                  null
                );

    for (var i = 0; i < Snap1.snapshotLength; i++) {
      var elm1 = Snap1.snapshotItem(i);
      var moviename = elm1.innerHTML;
      elm1.parentNode.insertBefore(CreateLink(moviename), elm1);
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
    var Snap1 = document.evaluate(
                  xp,
                  document,
                  null,
                  XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                  null
                );

    for (var i = 0; i < Snap1.snapshotLength; i++) {
      var elm1 = Snap1.snapshotItem(i);
      var moviename = elm1.innerHTML;
      elm1.parentNode.insertBefore(CreateLink(moviename), elm1);
    }
  }
  /***** end fandango.com *****/
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
  if (sStorage == 1) {
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

// encode movie name to be url friendly for search
function EncodeMovieName(str) {
  str = str.replace(/\&quot\;/g,"\"");
  str = str.replace(/\&amp\;/g,"&");
  str = str.replace(/\&lt\;/g,"<");
  str = str.replace(/\&gt\;/g,">");
  str = str.replace(/\!/g,"%21");
  str = str.replace(/\"/g,"%22");
  str = str.replace(/#/g,"%23");
  str = str.replace(/\$/g,"%24");
  str = str.replace(/&/g,"%26");
  str = str.replace(/\'/g,"%27");
  str = str.replace(/@/g,"%40");
  str = str.replace(/\+/g,"%2B");
  str = str.replace(/\//g,"%2F");
  str = str.replace(/\?/g,"%3F");
  str = str.replace(/\:/g,"%3A");
  str = str.replace(/\;/g,"%3B");
  str = str.replace(/=/g,"%3D");
  str = str.replace(/\[/g,"%5B");
  str = str.replace(/\]/g,"%5D");
  str = str.replace(/\,/g,"%2C");
  str = str.replace(/^\s+/,""); // remove leading spaces
  str = str.replace(/ /g,"+");
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

function getMovie(event,moviename) {
  // Set our own connect error timeout because GM_xmlhttpRequest takes 
  // waaaaay to long to timeout with onerror
  var errorTimer = setTimeout(
                     function(){
                       return errorTimeout(event,moviename)
                     },
                     10000
                   );
  // make the movie search url for the http request
  var murl1 = "http://dvd.netflix.com/Search?v1=";
  var movieUrl = murl1 + EncodeMovieName(moviename);
  
  // make the http request to netflix. if it fails in any way show an error
  GM_xmlhttpRequest({
    method: "GET",
    url: movieUrl,
    onerror: function(response) {
      var boxBody = '<div id="popuptopnqs"><b>ERROR</b></div>'+
      '<div style="padding:7px;">Could not connect/load info from Netflix.' +
      'Here is a manual link to your movie search.' +
      '<a href="' + movieUrl + '">' + moviename + '</a><hr>';
      // show the error popup
      showBox(event,boxBody); 
    },
   
    onload: function(response) {
      // clear our timer because onload returned fast enough
      clearTimeout(errorTimer);

      // if we recieved a page back OK then parse and show it
      if (response.statusText == "OK") { 
        // check for sign in text
        var pat = response.responseText.match(/\"Sign In\"/);

        // if the pattern worked then we are not signed in. error and stop.
        if (pat != null) { 
          var boxBody = '<div id="popuptopnqs"><b>ERROR</b></div>' +
          '<div style="padding:7px;">You are not signed into Netflix.' +
          'This script only works for Netflix members. ' + 
          'Please sign in and try again.<hr>';
          // throw error box for login
          showBox(event,boxBody); 
          return false;        
        }

        // normalize netflix page. strip things to make parsing easier
        var normMovieHtml = response.responseText;
        // regexes in strings with double escaped escape chars \ is \\
        var regx1 = '\\f|\\v|\\r|\\n|\\t|\\0|\\s+|';
        var regx2 = '\\u0085|\\u000C|\\u2028|\\u2029';
        var nMovieHtml = new RegExp(regx1 + regx2,'g');
        var normMovieHtml = normMovieHtml.replace(nMovieHtml," ");

        // grab first movie result. sometimes first results are not movies
        var matchPat = normMovieHtml.match(
                         /<div class="agMovie" (.*?)<\/span><\/div>/
                       ); 

        // if the pattern worked then show movie info box else throw error box      
        if (matchPat != null) { 

          // surely have movie info so put it in a var
          var movieHtml = matchPat[1]; 

          // parse filtered and normailized Netflix page with regex's.
          //  Suck out movie info.  regex for movie name
          var patMovieNameM = movieHtml.match(/alt="(.*?)"/);
          // regex for movie box image
          var patImgLinkM = movieHtml.match(/src="(.*?)"/);
          // regex for add to queue link
          var patAddLinkM = movieHtml.match(/_0" href="(.*?)"><span/);
          // regex for queue status
          var patQueueStatM = movieHtml.match(/inr">(.*?)<\/span>/);
           // regex for rating
          var patRatM = movieHtml.match(/You rated this movie: (.*?)</);
          // regex for movie synopsis
          var patSynposisM = movieHtml.match(/"synopsis">(.*?)<\/p>/);
          // regex for stream link
          var patStreamLinkM = movieHtml.match(/_1" href="(.*?)"><span/); 
          
          // if matches are not null then the regex worked
          // so show box. else show error box
          if ((patMovieNameM != null) &&
              (patImgLinkM != null) &&
              (patAddLinkM != null) &&
              (patQueueStatM != null) &&
              (patSynposisM != null)) {

            // movie name
            var patMovieName = patMovieNameM[1];
            // box image
            var patImgLink = patImgLinkM[1];
            // add to queue link
            var patAddLink = patAddLinkM[1];
            // queue status
            var patQueueStat = patQueueStatM[1];
            // movie synposis
            var patSynposis = patSynposisM[1];
            // if rating is there set var
            if (patRatM != null) { 
              var patRat = patRatM[1]; 
            }
            // if url is there set var
            if (patStreamLinkM != null) { 
              var patStream = patStreamLinkM[1];
            }

            // set default status state
            var status = "Unknown";
            // in Q link
            if (patQueueStat.match('(In Q|In DVD)')) {
              status = '<span id="nonqsstatus" title="' + patAddLink +
              '"style="text-decoration:none; border:1px solid black;' +
              'padding:5px; background:#f6f5f4;color:#b9090b;' +
              ' font-size:13px;font-weight:bold;">In Queue</span>';
            // add link
            } else if (patQueueStat.match('Add')) {
              status = '<span id="nqsstatus" title="' + patAddLink + 
              '"style="text-decoration:none;border:1px solid black;' +
              'padding:5px;background:#b9090b;color:#fff;' +
              'font-size:13px;font-weight:bold;">Add</span>';
            // save link
            } else if (patQueueStat.match('Save')) {
              status = '<span id="nqsstatus" title="' + patAddLink + 
              '"style="text-decoration:none; border:1px solid black;' +
              'padding:5px;background:#8bb109;color:#fff;font-size:13px;' +
              'font-weight:bold;">Save</span>';
            // home link
            } else if (patQueueStat.match('Home')) {
              status = '<span id="nonqsstatus" title="' + patAddLink + 
              '"style="text-decoration:none; border:1px solid black;' + 
              'padding:5px; background:#f6f5f4;color:#333;font-size:13px;' +
              'font-weight:bold;">At Home</span>';
            // Discs link
            } else if (patQueueStat.match('Choose Discs')) {
              status = '<span id="nonqsstatus" title="' + patMovieName + 
              '" style="text-decoration:none; border:1px solid black;' +
              'padding:5px; background:#fff;color:#000; font-size:13px;' +
              'font-weight:bold;"><a href="' + patAddLink + 
              '" target="new">Choose Discs</a></span>';
            } 
            
            // throw in stream link if found
            if (patStream != null) { 
              status = status + ' <span style="text-decoration:none;' +
              'border:1px solid black; padding:5px; background:#f6f5f4;' +
              'color:#333; font-size:13px;font-weight:bold;"><a href="' + 
              patStream + '">Play</a></span>'; 
            }

            // set rating state
            var rating = "Rating Unknown"; 
            if (patRatM != null) {
              // if word is "movie" then person rated it
              rating = 'You rated this a: ' + patRat;
            } else {
              // person has not rated
              rating = 'You have not rated this';
            }
    
            // put code into a var for an innerHTML insert later.
            var boxBody = '<div id="popuptopnqs">' +
            '<a class="lh" href="' + movieUrl + '"> ' + patMovieName +
            '</a></div><img style="margin:0px 3px 0px 1px;" align="left" ' +
            'width="110" height="150" src="' + patImgLink + '">' +
            '<div style="padding:3px;">' + patSynposis + '<br><br>' +
            '<b>' + rating + '</b></div><hr><br>' +
            '<span id="bpleft">' + status + '</span>';
            // show our movie box
            showBox(event,boxBody);
          } else {
              var regexErrorMessage = "movie parts of the";
              // show error for failed move parts match
              regexError(regexErrorMessage);
          }
        } else {
            var regexErrorMessage = "movie block part of the"; 
            // show error for failed movie block match
            regexError(regexErrorMessage);
        }
      } else { // We did not get an OK response from the server. Show error.
          var boxBody = '<div id="popuptopnqs"><b>ERROR</b></div>' +
          '<div style="padding:7px;">There was a problem connecting to the '+
          'Nexflix search page. Try this manual link to your movie search.' +
          ' <a href="' + movieUrl + '">' + moviename + '</a><hr>';
          // show popup with error
          showBox(event,boxBody);
      }
      // our regular expression failed to match. Show error message.
      function regexError(regErrorM) {
        var boxBody = '<div id="popuptopnqs"><b>ERROR</b></div>' +
        '<div style="padding:7px;">There was a problem matching the info on the' +
        ' Nexflix search page. The ' + regErrorM + ' regular expression ' +
        'needs to be updated. Please go ' +
        '<a href="https://github.com/psyer/netflix-q-status">here</a>' +
        ' to check for an update. Here is a manual link to your movie search' +
        '.<a href="' + movieUrl + '">' + moviename + '</a><hr>';
        // show popup with error
        showBox(event,boxBody);
      } 
    }
  });
}

function getRssId() {
  // if we have rssid then bail 
  if (haveRssId() === true) { return null; }

  // make the http request to netflix RSS Url Page.
  GM_xmlhttpRequest({
    method: "GET",
    url: "http://dvd.netflix.com/RSSFeeds",
    onerror: function(response) {
      // log error
      console.log("We got an error response from Netflix RSS Url page");
    },
    onload: function(response) {
      // if we recieved a page back OK then parse
      if (response.statusText == "OK") {
        // parse Netflix rss page. suck out rss url id.

        // make rss id regex         
        var wRegex =  /\/QueueRSS\?id=(\w+)"/;
        
        // set response 
	      var responseTxt = response.responseText;

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
          console.log([
            "Non OK response from Netflix server to get RSS id. Response was:",
            response.status,
            response.statusText,
            response.finalUrl,
          ].join("\n"));
      }
    }
  });
}
                    
function getQueue() {
  // if we don't have rssid then bail 
  if (haveRssId() === false) { return null; }

  var rssId = sessionStorage.getItem('NqsNetflixRssId');
  var rssUrl = "http://dvd.netflix.com/QueueRSS?id=" + rssId;
  
  // make the http request to netflix
  GM_xmlhttpRequest({
    method: "GET",
    url: rssUrl,
    onerror: function(response) {
      // log error
      console.log( "We got an error response from Netflix queue page.");
    },
    onload: function(response) {
      // if server response OK, then parse page with regex and grab move titles
      if (response.statusText == "OK") {

        // copy response obj
	      var responseTxt = response.responseText;
        
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
          console.log([
            "Non OK response from Netflix server for RSS info. Response was:",
            response.status,
            response.statusText,
            response.finalUrl,
          ].join("\n"));
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
  if (document.getElementById('nqsstatus') != null) {
    document.getElementById('nqsstatus').addEventListener(
                                           "click",
                                           function(event){
                                             addToQueue(event)
                                           },
                                           false
                                         );
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

// called if connection to netflix takes to long
function errorTimeout (event,moviename) {
  var boxBody = '<div id="popuptopnqs"><b>ERROR</b></div>' +
  '<div style="padding:7px;">It is taking to long to connect' +
  'to the Nexflix search page. Try this manual link to your movie search:' +
  '<a href="' + movieUrl + '">' + moviename + '</a><hr>';
  // show popup with error
  showBox(event,boxBody);
}

function addToQueue (event) {
  // grab add to queue url from title property and put it in a var
  var addToQueueUrl = document.getElementById('nqsstatus').title;

  // make the http request to netflix. if it fails in any way show an error
  GM_xmlhttpRequest({
    method: "GET",
    url: addToQueueUrl,
    onerror: function(response) {
      var boxBody = '<div id="popuptopnqs"><b>ERROR</b></div>' +
      '<div style="padding:7px;">' + 
      'Could not connect to Netflix. Connection issue?.<hr>';
      // show the error popup
      showBox(event,boxBody);
    },

    onload: function(response) {
      // if we recieved a page back OK then parse and show it
      if (response.statusText == "OK") {
        // blank out current button
        document.getElementById('bpleft').innerHTML = '';
        // put in added to queue button
        document.getElementById('bpleft').innerHTML = '<span id="nqsstatus"' +
        'style="text-decoration:none;border:1px solid black;padding:5px;' +
        'background:#f6f5f4;color:#b9090b;font-size:13px;font-weight:bold;">' +
        'Added to Queue</span>';
        //We did not get an OK response from the server. Show error.
      } else {
          var boxBody = '<div id="popuptopnqs"><b>ERROR</b></div>' +
          '<div style="padding:7px;">There was a problem connecting' +
          'to Netflix. Invalid server response.<hr>';
          // show popup with error
          showBox(event,boxBody);
      }
    }
  });
}


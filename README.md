# Netflix Q Status

Greasemonkey script (that works with Firefox and Chrome) for Netflix DVD subscribers to add the latest movies to your Netflix queue quick and easy! Shows your movies queue status on popular movie websites and has a simple "Add to Queue" button.

## Screenshots
![alt text](http://i.imgur.com/mYb7YvN.png "add to queue and streaming play button example")

![alt text](http://i.imgur.com/Oyy3OaY.png "save to queue button example")

![alt text](http://i.imgur.com/iQ9qwDo.png "save to queue button example")


**Warning: This script only works for Netflix DVD subscribers logged into their Netflix account.**

## Description
This script will put an icon next to each movie title on many popular movie websites. A "Q" icon will appear if the movie is in your Netflix DVD queue. A "N" icon will appear if it is not. Clicking one these icons will popup a box showing the movies name, box cover, description, rating, and the status of the movie in your Netflix queue.
 
The queue status button resembles the button on the Netflix website by showing "Add", "Save", "At Home", or "In Queue". The button can be clicked so you can add the movie to your queue instantly. All without having to leave the site your on.

If you have a streaming account the "Play" button will pop up if the movie is available to be streamed.

Works best with a Netflix DVD account as that is the biggest and best available list of movies. Netflix movie streaming selection leaves much to be desired. 

## Sites
The sites the script supports are the following

* imdb.com
* rottentomatoes.com
  * Top Movies (/top) and main page work.
  * Any /browse url pages will not work. To much ajax usage.
* fandango.com
* metacritic.com

## Browser Compatibility
* Firefox 3.6 & up w/Greasemonkey Plugin
* Chrome 13 & up

## Install

### Chrome
You can not load scripts directly into Chrome 21 and up anymore. You have to save the script locally and drag it into the extensions area. The steps are the following.

1. Download the script file from the site and save it to your computer.
2. Click the 3 horizontal bars button at the right end of the browser url bar.
3. Select "More Tools" > "Extensions".
4. Locate the script file on your computer and drag the file onto the extensions page.
5. Review the list of permissions in the dialog that appears. If you would like to proceed, click Install.

### Firefox
Follow the instructions on how to [Download and install Greasemonkey](http://www.greasespot.net/) plugin at the Greasmonkey website. After install, you can add this Greasemonkey script. Remember to enable the script after you install it. 

## Permissions
This script will ask for full access to the sites listed in the sites section. All it does is read the html coming back from the site and find where it can put icon.

You click said icon, and it will send a query to Netflix DVD search and see if it can find a match. Which it then puts the top match in the pop up box.

It also grabs your DVD queue from Netflix every 5 mins so it can have a list to compare the movie titles to and tell you what movies are already in your queue with the Q icon.

NO funny business at all. If you don't believe me read the code yourself.

## Notes/Suggestions
* Make sure your logged into your Netflix account before using this script. It uses the Netflix DVD search page info to populate the popup box.
* The top of the popup has a link to the Netflix page for the title..
* The movie that comes up in the popup box is the first movie listing from the Netflix search page. On really obscure movies or movies Netflix has a hard time finding you will get the wrong movie in the popup box. The script is only as good as the Netflix search engine. Don't worry, most of the time it's correct.
* Use the movie box picture and the description to make sure you are viewing the correct movie you want. Comparing the pictures and descriptions assures your putting the correct movie in your queue.
* Movie names/titles from Netflix and movie websites don't always match up. Sometimes you will not see a Q icon when you should. Just click the icon to check the status.
* The script is not perfect and you will see icons next to things that are not movie titles sometimes. Other times you will not see a icon next to a title. Most sites don't use an exact scheme for their movie title elements/urls so it's hard to get the right tags every time. Deal with it or submit a better Xpath to fix it.

## Reason for the script
Before writing the script I would hit "In Theaters" and "Coming Soon" sections of the popular movie websites (rottentomatoes.com and such) so I could add movies to my queue before they go to DVD. I would also look at other movies that have been out for a while and check their ratings to see if they were worth putting in my queue. That led to a lot of annoying copying and pasting titles into the Netflix search box. Sites like canistream.it are good quick checks of where you can get movies, but you don't have things like top lists, curated lists from users, etc. Also, you can't look at the respective sites ratings on said movie with sites like canistream.it.

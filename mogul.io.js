var request = require("request");
var cheerio = require("cheerio");

url = "http://www.imdb.com/title/tt1229340";

request(url, function(error, response, html) {
    if(!error) {
        var $ = cheerio.load(html);
        var title, release, rating;

        var headerRegex = /(.+)\s\((\d\d\d\d)\)/;
        var headerHTML = $("h1").text()
        var matches = headerRegex.exec(headerHTML);
        
        title = matches[1];
        release = matches[2];
        
        // Remove weird newline character.
        rating = $(".ratingValue").first().text().replace(/\r?\n|\r/, "");

        console.log("Title: " + title);
        console.log("Released: " + release);
        console.log("Rating: " + rating);
    }
});

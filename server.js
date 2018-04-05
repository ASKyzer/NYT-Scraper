// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Require all models
var db = require("./models");

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

//Define port
var port = process.env.PORT || 3000

// Initialize Express
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/scrapingthenews");

// ROUTES //

// Get request to scrape the NYT website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("https://www.nytimes.com/", function(error, response, html) {
    // Then we load that into cheerio and save it to $ for a shorthand selector.
    var $ = cheerio.load(html);
    // Now, we grab every article tag and do the following:
    $("article").each(function(i, element) {

      // Save an empty result Object
      var result = {};

      // Add the title, summary and link and save them as properties of the result object
      result.title = $(this).children("h2").text();
      result.summary = $(this).children(".summary").text();
      result.link = $(this).children("h2").children("a").attr("href");

      // Create a new Article using the result object built from Scraping
      db.Article.create(result)
      .then(function(dbArticle) {
        // View the added result in the console
        console.log(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        return res.json(err);
      })
    }) // end of article.each function

    // If we were able to sucessfully scrape and save the article, send a message to the client
    res.send("Scrape Complete");
  }) // end of request to the NYT
}) // end of get request for /scrape route

//* Route to get all the articles we scraped from mongodb
app.get("/articles", function(req, res) {
  // Grab everything from the Articles array
  db.Article.find({})
  .then(function(dbArticle) {
    // If sucessful, send them back to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
  })
}) //end of GET request to /articles route





// Listen on port
app.listen(port, function() {
  console.log("App running on port " + port);
});

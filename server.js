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

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// ROUTES //

//GET requests to render Handlebars pages
app.get("/", function(req, res) {
  db.Article.find({ isSaved: false}, function(error, data) {
      var hbsObject = {
        article: data
      }
      console.log(hbsObject);
      res.render("home", hbsObject);
  }).catch(function(err) {
    res.json(err)
  })
});

app.get("/saved", function(req, res) {
  db.Article.find({isSaved: true}).populate("notes").exec(function(error, articles) {
    var hbsObject = {
      article: articles
    };
    res.render("saved", hbsObject);
  });
});

// Get request to scrape the NYT website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("https://www.nytimes.com/", function(error, response, html) {
    // Then we load that into cheerio and save it to $ for a shorthand selector.
    var $ = cheerio.load(html);

    // Save an empty result Object
    var result = [];

    // Now, we grab every article tag and do the following:
    $("article").each(function(i, element) {

        // Add the title, summary and link and save them as properties of the result object
        var title = $(element).children("h2").text();
        var summary = $(element).children(".summary").text();
        var link = $(element).children("h2").children("a").attr("href");

        if( i <= 19) {
          result.push ({
            title: title,
            summary: summary,
            link: link
          })
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
        } else {
            return false;
          }
    }) // end of article.each function
    // If we were able to sucessfully scrape and save the article, send a message to the client
    res.send("Scrape Complete");
    res.redirect("/")
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

// Route for grabbing a specific article by id and poupulate it with it's Note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query to find the matching on in our db.
  db.Article.findOne({ _id: req.params.id })
  // now populate all of the notes associated with it
  .populate("notes")
  .then(function(dbArticle) {
    // If sucessful, find the article with the given id and send it bavk to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If there is an error, send it bavk to the client
    res.json(err);
  })
}) // end of GET request to our /article/:id route.

// Route to save the article
app.post("/articles/saved/:id", function(req, res) {
  // Use the article id to find and update the isSaved boolean to true,
  db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: true })
    .then(function(dbArticle) {
      // If successful, send it bavk to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    })
}) // end of POST request to /articles/save/:id route


// Route to create and update article with it's note.
app.post("articles/:id", function(req, res) {
  // Create a new not and pass the req.body to the entry
  db.Note.create(req.body.text)
  .then(function(dbNote) {
    // If the note was created successfully, find one Article with that id and update it to be associated with the note.
    return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote.id }, { new: true});
  })
  .then(function(dbArticle) {
    // if successful in updating the article, send it bavk to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
  })
}) // end of POST request to our notes/save/:id route

// Delete a note
app.delete("delete/:id", function(req, res) {
  // Find note by it's id and delete it.
  db.Note.findOneAndRemove({ _id: req.params.id })
  .then(function(dbArticle) {
    // if successful in updating the article, send it bavk to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
  })
}) // end of POST request to our notes/save/:id route

// Listen on port
app.listen(port, function() {
  console.log("App running on port " + port);
});

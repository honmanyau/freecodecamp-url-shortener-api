'use strict'
// server.js
// where your node app starts

// init project
const https = require('https');
const http = require('http');
const express = require('express');
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const autoIncrement = require('mongoose-auto-increment');

/* Initialise connection to Mongo database */
autoIncrement.initialize(mongoose.connect(process.env.MONGO_URI));
mongoose.connection.on("error", (error) => {
  console.log("Error occured while connecting to databse—" + error);
});
mongoose.connection.once("open", () => {
  console.log("Connected!")
});

/* Schema for databse */
const urlSchema = mongoose.Schema({
  target: String,
  shortened: String,
  date: {type: Date, default: Date.getTime}
});

/* Model for databse */
urlSchema.plugin(autoIncrement.plugin, "URL");
const URL = mongoose.model("URL", urlSchema);

/* Express middlewares and methods for handling requests */
app.use(express.static('public'));
app.use((request, response, next) => {
  console.log(request.method + " " + request.url + " " + request.params);
  next();
})

app.get("/", (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/api", (request, response) => {
  console.log("API Call Received!")
  let protocol = http;
  let targetURL = request.query.url;
  
  if (!targetURL.match(/:\/\//)) {
    targetURL = "https://" + targetURL;
  }
  
  // Preliminary URL check
  if (targetURL.match(/^(http|https):\/\/([-a-zA-Z0-9@:%._\+~#=]{2,256})\./)) {
    if (targetURL.startsWith("https://")) {
      protocol = https;
    }  
  }
  else {
    response.json({
      "error": "It doesn't appear to be a valid URL."
    });
  }
  
  // Remove slash at the end of a URL string to avoid duplication in the database
  if (targetURL[targetURL.length - 1] === "/") {
    targetURL = targetURL.slice(0, targetURL.length - 1);
  }
  
  // Check that the URL supplied is valid before adding to the database
  protocol.get(targetURL, (remoteResponse) => {
    let shortenedURL = "";
    
    console.log("Status of URL provided by the client: " + remoteResponse.statusCode);
    
    URL.find({target: targetURL}, (error, result) => {
      if (error) {
        console.log("Error when performing URL.find()—" + error);
      }
      
      // Add the URL to the database if it doesn't already exist
      if (result.length === 0) {
        // Get the next document number with mongoose-auto-increment
        URL.nextCount((error, count) => {
          shortenedURL = "https://kurz.glitch.me/" + count.toString(36);
          
          // Create a new document
          const newURL = new URL({
            target: targetURL,
            shortened: shortenedURL
          }); 
          
          // Save document
          newURL.save((error, document) => {
            if (error) {
              console.log("Error while saving document: ", document);
            }
          });
          
          response.json({
            "target": targetURL,
            "shortened": shortenedURL
          });          
        });
      }
      // Return the corresponding entry if the URL supplied already exists in the database
      else if (result.length > 0) {
        console.log("Request URL is already in database.")
        
        URL.find({target: targetURL}, (error, result) => {
          shortenedURL = result[0].shortened;
          console.log(shortenedURL)
          
          response.json({
            "target": targetURL,
            "shortened": shortenedURL
          });
        })
      }
    });
  })
  .on("error", (error) => {
    console.log("ERROR!", error);
    
    response.json({
      "error": "It doesn't appear to be a valid URL."
    });
  });
});

app.get("/:input", (request, response) => {
  const input = request.params.input;
  
  if (parseInt(input, 36) || input === "0") {
    URL.find({_id: parseInt(input, 36)}, (error, result) => {
      if (result.length > 0) {
        response.redirect(result[0].target);  
      }
      else {
        response.json({
      "error": "It doesn't appear to be a valid URL."
    });
      }
    });
  }
  else {
    response.json({
      "error": "It doesn't appear to be a valid URL."
    });
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
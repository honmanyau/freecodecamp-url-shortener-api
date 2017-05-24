'use strict'
// client-side js
// run by the browser each time your view template is loaded

// add other scripts at the bottom of index.html
// const dreams = document.getElementById("#dreams");

const xhr = new XMLHttpRequest();
const form = document.getElementById("shortener-form");
const input = document.getElementById("input-text");
const output = document.getElementById("output-text");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  
  output.innerHTML = "<code>--Shortening--</code>";
  
  xhr.open("GET", "https://kurz.glitch.me/api?url=" + input.value, true);
  xhr.onload = (event) => {
    const data = JSON.parse(event.target.response);
    
    if (data.shortened) {
      output.innerHTML = "<a href=\"" + data.shortened + "\">" + data.shortened + "</a>"; 
    }
    else if (data.error) {
      output.innerHTML = "The URL supplied is invalid.";
    }
  }
  xhr.send();
});
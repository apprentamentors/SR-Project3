const express    = require("express");
const bodyParser = require("body-parser");
const session    = require("express-session");
const mongo      = require("mongodb").MongoClient;
const routes     = require("./routes.js");
const auth       = require("./auth.js");
require("dotenv/config");

const app = express();
const port = process.env.PORT || 3002;

app.use(express.static(__dirname + "/public"));
app.use(bodyParser());

mongo.connect(process.env.DATABASE, (err, db) => {
  if(err) {
    console.log("Database error: " + err);
  }
  else {
    auth(app, db);
    routes(app, db);
    console.log("Successful database connection");
  }
});

app.listen(port, function() {
  console.log("Node is listening on http://localhost:" + port);
});

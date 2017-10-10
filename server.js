const express    = require("express");
const bodyParser = require("body-parser");
const session    = require("express-session");
const passport   = require("passport");
const mongo      = require("mongodb").MongoClient;
const ObjectID   = require("mongodb").ObjectID;
const LocalStrategy = require("passport-local");
const bcrypt     = require("bcrypt");
const multer     = require("multer");
require("dotenv/config");

const app = express();
const port = process.env.PORT || 3002;

//const storage = ;
const upload     = multer({ dest: "/uploads/"})

app.use(express.static(__dirname + "/public"));
app.use(bodyParser());

app.set("view-engine", "pug");

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

mongo.connect(process.env.DATABASE, (err, db) => {
  if(err) {
    console.log("Database error: " + err);
  }
  else {
    console.log("Successful database connection");
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });
    passport.deserializeUser((id, done) => {
      db.collection("users").findOne(
        {_id: new ObjectID(id)},
        (err, doc) => {
          done(null, doc);
        }
      );
    });

    passport.use(new LocalStrategy(
      function(username, password, done) {
        db.collection("users").findOne({ username: username }, function(err, user) {
          console.log("User " + username + " attempted to log in.");
          if(err) { return done(err); }
          if(!user) { return done(null, false); }
          if(!bcrypt.compareSync(password, user.password)) { return done(null, false); }
          return done(null, user);
        });
      }
    ));

    function ensureAuthenticated(req, res, next) {
      if(req.isAuthenticated()){
        return next();
      }
      res.redirect("/");
    };

    app.route("/")
      .get(function(req, res) {
        res.render(__dirname + "/views/pug/index.pug", {
          title: "Box",
          showLogin: true,
          showRegistration: true
        });
      });

    app.route("/register")
      .post((req, res, next) => {
        var hash = bcrypt.hashSync(req.body.password, 8);
        db.collection("users").findOne({ username: req.body.username }, function(err, user) {
          if(err) {
            next(err);
          }
          else if(user) {
            res.redirect("/");
          }
          else {
            db.collection("users").insertOne(
              {
                username: req.body.username,
                password: hash
              },
              (err, doc) => {
                if(err) {
                  res.redirect("/");
                }
                else {
                  next(null, user);
                }
              }
            )
          }
        })},
        passport.authenticate("local", {
          failureRedirect: "/"
        }),
        (req, res, next) => {
          res.redirect("/profile");
        }
    );
    app.route("/login")
      .post(passport.authenticate("local", {
        failureRedirect: "/"
      }), function(req, res) {
        res.redirect("/profile");
      })

    app.route("/profile")
      .get(ensureAuthenticated, function(req, res) {
        res.render(__dirname + "/views/pug/profile.pug", {
          title: "Box | " + req.user.username,
          username: req.user.username
        });
      });

    app.route("/upload")
      .post(upload.single("userFile"), function(req, res, next) {
        if(!req.file) {
          console.log("No file received");
          return res.send({
            success: false
          });
        }
        else {
          console.log(req.file);
          return res.redirect("/profile");
        }
      });
    app.route("/logout")
      .get((req, res) => {
        req.logout();
        res.redirect("/");
      });

    app.use((req, res, next) => {
      res.status(404)
        .type("text")
        .send("Not Found");
    });
  }
});

app.listen(port, function() {
  console.log("Node is listening on http://localhost:" + port);
});

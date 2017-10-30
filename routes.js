const passport = require("passport");
const bcrypt   = require("bcrypt");
const multer     = require("multer");

module.exports = function(app, db) {

  var storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    }
  });
  var upload   = multer({ storage: storage });

  function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()){
      return next();
    }
    res.redirect("/");
  };

  app.route("/")
    .get(function(req, res) {
      res.sendFile(__dirname + "/views/index.html");
    });

  app.route("/login")
    .post(passport.authenticate("local", {
      failureRedirect: "/"
      }), function(req, res) {
        res.redirect("/profile");
    });

  app.route("/logout")
    .get(function(req, res) {
      req.logout();
      res.redirect("/");
    });

  app.route("/profile")
    .get(ensureAuthenticated, function(req, res) {
      res.sendFile(__dirname + "/views/profile.html");
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
          db.collection("users").insertOne({
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
          })
        }
      })},
        passport.authenticate("local", {
          failureRedirect: "/"
        }),
          (req, res, next) => {
            res.redirect("/profile");
          }
  );

  app.route("/upload")
    .post(function(req, res, next) {
      console.log(req.file);
      console.log(JSON.stringify(req.file));
      /*if(!req.file) {
        console.log("No file received");
        return res.send({
          success: false
        });
      }*/
      /*else {
        return res.json({
          fileName: req.file.originalname,
          userName: req.user.username,
          fileSize: req.file.size,
          filePath: req.file.path
        });
      }*/
    });

  app.route("/uploads/*")
    .get(function(req, res) {
      res.sendFile(__dirname + req.originalUrl);
    });

  app.use((req, res, next) => {
    res.status(404)
    .type("text")
    .send("Not Found");
  });
}

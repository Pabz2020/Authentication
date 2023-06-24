require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook');
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({secret: "pabasarajayawardhana", resave: false, saveUninitialized: false}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    // console.log(accessToken);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] })
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login"}),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

  app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/secrets", (req, res)=>{
    User.find({"secret": {$ne:null}}).then((foundUsers)=>{
        res.render("secrets", { allUsersWithSecrets: foundUsers});
    }).catch((err)=>{
        console.log(err);
    });
});

app.get("/submit", (req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.render("login");
    }
});

app.get("/logout", (req, res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });
});

app.post("/register", (req, res)=>{
    
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res, ()=>{
                res.redirect("/secrets");
            });
        }
    })
    
});

app.post("/login", (req, res)=>{
    
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err)=>{
        if (err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            });
        }
    });

});

// app.post("/submit", (req,res)=>{
//     const submittedSecret = req.body.secret;
//     User.findById({_id: req.user._id}).then((foundUser)=>{
//         foundUser.secret = submittedSecret;
//     }).catch((err)=>{
//         console.log(err);
//     });
// });

app.post("/submit", (req, res) => {
    if (req.isAuthenticated()) {
      const submittedSecret = req.body.secret;
      User.findById(req.user._id)
        .then((foundUser) => {
          foundUser.secret = submittedSecret;
          foundUser.save();
          res.redirect("/secrets");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/submit");
        });
    } else {
      res.redirect("/login");
    }
  });
  


app.listen(3000, ()=>{
    console.log("Server is running on port 3000...");
});


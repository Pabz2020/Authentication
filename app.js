require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    username: String,
    password: String
});

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res)=>{
    res.render("home");
})

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.post("/register", (req, res)=>{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User ({
            username: req.body.username,
            password: hash
        });
        newUser.save().then(()=>{
            res.render("secrets");
        }).catch((err)=>{
            console.log(err);
        });
    });
    
});

app.post("/login", (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({username: username}).then((foundUser)=>{
        if(!foundUser){
            res.send("Invalid username!");
        }else{
            bcrypt.compare(password, foundUser.password, function(err, result) {
                if(result === true){
                    res.render("secrets");
                }else{
                    res.send("Invalid password!");
                }
            });
        }
    }).catch((err)=>{
        console.log(err);
    });
});










app.listen(3000, ()=>{
    console.log("Server is running on port 3000...");
});


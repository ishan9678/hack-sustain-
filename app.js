// packages
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require("lodash");
var multer = require("multer");
var session = require("express-session");
var passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usersDB");

const upload = multer();

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// get
app.get("/", (req, res) => {
  res.render("landing");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/car", (req, res) => {
  res.render("car");
});

app.get("/flight", (req, res) => {
  res.render("flight");
});

app.get("/diet", (req, res) => {
  res.render("diet");
});

// post
app.post("/register", (req, res) => {
  const newUser = new User({
    name: req.body.name,
    username: req.body.username,
    email: req.body.mail,
  });

  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

app.post("/predict", async (req, res) => {
  try {
    const formData = req.body;

    // Send the form data to the Flask server
    const flaskResponse = await axios.post(
      "http://flask-server-ip:flask-server-port/predict",
      formData
    );

    console.log("Response from Flask:", flaskResponse.data);
    res.send("Form data sent to Flask.");
  } catch (error) {
    console.error("Error sending data to Flask:", error);
    res.status(500).send("Error sending data to Flask.");
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

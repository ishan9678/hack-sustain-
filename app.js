const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");

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

mongoose.connect("mongodb://localhost:27017/usersDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

app.get("/house", (req, res) => {
  res.render("house");
});

app.get("/results", (req, res) => {
  // Access the session variables for each category's emissions
  const carEmissions = req.session.storedCarEmissions || 0; // Default to 0 if not set
  const flightEmissions = req.session.flightEmissions || 0;
  const dietEmissions = req.session.dietEmissions || 0;
  const houseEmissions = req.session.houseEmissions || 0;

  // Calculate the total emissions
  const totalEmissions =
    carEmissions + flightEmissions + dietEmissions + houseEmissions;

  // Render the results view and pass the total emissions value
  res.render("results", { totalEmissions });
});

app.post("/register", (req, res) => {
  const newUser = new User({
    name: req.body.name,
    username: req.body.username,
    email: req.body.mail,
  });

  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, () => {
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

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/home");
      });
    }
  });
});

app.post("/predict", (req, res) => {
  try {
    const formData = {
      mileage: parseFloat(req.body.mileage),
      fuel_type: req.body.fuel_type,
      vehicle_class: req.body.vehicle_class,
      avgDistance: parseFloat(req.body.avgDistance), // Adding average daily distance
    };

    // Placeholder emission factors for different fuel types (in kg CO2 per km)
    const emissionFactors = {
      premium: 0.2,
      diesel: 0.15,
      regular: 0.25,
    };

    // Placeholder emission factors for different vehicle classes (in kg CO2 per km)
    const classEmissionFactors = {
      compact: 0.1,
      sedans: 0.15,
      suv: 0.2,
    };

    // Calculate emissions based on the formula: mileage * fuel type factor * vehicle class factor * avg daily distance * 30 (for a month)
    const carEmissions =
      formData.mileage *
      emissionFactors[formData.fuel_type] *
      classEmissionFactors[formData.vehicle_class] *
      formData.avgDistance *
      30;

    // Store the calculated car emissions for further use
    const storedCarEmissions = carEmissions;
    req.session.CarEmissions = storedCarEmissions;

    console.log("Stored car emissions:", storedCarEmissions);
    res.redirect("/flight"); // Redirect to the home page after calculation
  } catch (error) {
    console.error("Error processing form data:", error);
    res.status(500).send("Error processing form data.");
  }
});

app.post("/questionare", (req, res) => {
  // Redirect to the "car" page
  res.redirect("/car");
});

app.post("/calculate-flight-emissions", (req, res) => {
  try {
    const numFlights = parseInt(req.body.num_flights);
    const avgFlightTime = parseFloat(req.body.avg_flight_time);

    // Placeholder emission factor for flights (in kg CO2 per hour per person)
    const flightEmissionFactor = 100;

    // Calculate emissions based on the formula: numFlights * avgFlightTime * flightEmissionFactor
    const flightEmissions = numFlights * avgFlightTime * flightEmissionFactor;
    req.session.flightEmissions = flightEmissions;

    console.log("Flight emissions:", flightEmissions);
    res.redirect("/diet"); // Redirect to the home page after calculation
  } catch (error) {
    console.error("Error processing form data:", error);
    res.status(500).send("Error processing form data.");
  }
});

app.post("/calculate-diet-emissions", (req, res) => {
  try {
    const dietType = req.body.diet;

    // Define emissions factors for different diet types
    const emissionsFactors = {
      "Meat Eater": 100, // Example value (adjust according to actual factors)
      Vegetarian: 50, // Example value (adjust according to actual factors)
      Vegan: 25, // Example value (adjust according to actual factors)
    };

    if (emissionsFactors.hasOwnProperty(dietType)) {
      // Calculate emissions for a month (replace with your calculation logic)
      const emissionsForMonth = emissionsFactors[dietType] * 30; // Assuming a month has 30 days

      console.log("Diet type:", dietType);
      console.log("Emissions for a month:", emissionsForMonth);
      req.session.dietEmissions = emissionsForMonth;
      res.redirect("/house");
    } else {
      throw new Error("Invalid diet type.");
    }
  } catch (error) {
    console.error("Error processing form data:", error);
    res.status(500).send("Error processing form data.");
  }
});

app.post("/calculate-house-emissions", (req, res) => {
  try {
    const residenceType = req.body.residence;

    // Define emissions factors for different residence types
    const emissionsFactors = {
      Flat: 50, // Example value (adjust according to actual factors)
      Bungalow: 100, // Example value (adjust according to actual factors)
      Duplex: 75, // Example value (adjust according to actual factors)
      Penthouse: 90, // Example value (adjust according to actual factors)
      Mansion: 120, // Example value (adjust according to actual factors)
    };

    if (emissionsFactors.hasOwnProperty(residenceType)) {
      // Calculate emissions for a month (replace with your calculation logic)
      const emissionsForMonth = emissionsFactors[residenceType] * 30; // Assuming a month has 30 days

      console.log("Residence type:", residenceType);
      console.log("Emissions for a month:", emissionsForMonth);
      req.session.houseEmissions = emissionsForMonth;

      res.redirect("/results");
    } else {
      throw new Error("Invalid residence type.");
    }
  } catch (error) {
    console.error("Error processing form data:", error);
    res.status(500).send("Error processing form data.");
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});

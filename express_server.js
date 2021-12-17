const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// This method doesn't generate uppercase characters
// const generateRandomString = () => {
//   return Math.random().toString(36).slice(2, 8);
// };

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let newString = '';
  for (let i = 0; i < 6; i++) {
    newString += characters.charAt(Math.floor(Math.random() * 62));
  }
  return newString;
};

const emailLookup = (users, email) => {
  let usersKeys = Object.keys(users);
  for (let i = 0; i < usersKeys.length; i++) {
    if (users[usersKeys[i]]["email"] === email) {
      return true; // Returns true if email is found
    }
  }
  return false;
};

const passwordLookup = (users, email, password) => {
  let usersKeys = Object.keys(users);
  for (let i = 0; i < usersKeys.length; i++) {
    if (users[usersKeys[i]]["email"] === email) {
      if (users[usersKeys[i]]["password"] === password) {
        return true; // Returns true if password matches email
      }
    }
  }
  return false;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  console.log(req.cookies.user_id);
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render('urls_new', templateVars);
});

app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  console.log(req.body);  // Log the POST request body to the console
  //res.redirect(`/u/${newShortURL}`);
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  //const templateVars = { shortURL: req.params.shortURL, longURL: longURL };
  //res.render('urls_show', templateVars);
  res.redirect(longURL);
});

app.post("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: longURL
  };
  res.render('urls_show', templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/login", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.send("403 Forbidden");
  } else if (!emailLookup(users, req.body.email)) {
    res.send("403 Forbidden");
  } else if (!passwordLookup(users, req.body.email, req.body.password)) {
    res.send("403 Forbidden");
  } else {

    let user = Object.keys(users);
    let userID = "";

    for (let i = 0; i < user.length; i++) {
      if (users[user[i]]["email"] === req.body.email) {
        userID = users[user[i]]["id"];
      }
    }

    res.cookie("user_id", userID);
    console.log(users);
    console.log(req.body.email);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render('registration', templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.send("400 Bad Request");
  } else if (emailLookup(users, req.body.email)) {
    res.send("400 Bad Request");
  } else {
    let newUserID = generateRandomString();
    users[newUserID] = {};
    users[newUserID]["id"] = newUserID;
    users[newUserID]["email"] = req.body.email;
    users[newUserID]["password"] = req.body.password;

    res.cookie("user_id", newUserID);
    console.log(users);
    console.log(req.body.email);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("login", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

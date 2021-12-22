const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { generateRandomString, getUserByEmail } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

const urlsForUser = (id) => {
  let filtered = {};
  let allKeys = Object.keys(urlDatabase);
  for (let i = 0; i < allKeys.length; i++) {
    if (urlDatabase[allKeys[i]]["userID"] === id) {
      filtered[allKeys[i]] = urlDatabase[allKeys[i]];
    }
  }
  console.log(filtered);
  return filtered;
};

app.get("/", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.send("Error: please log in or register to view URLs.");
  } else {
    const templateVars = {
      urls: urlsForUser(req.session.user_id),
      user: users[req.session.user_id]
    };
    res.render('urls_index', templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect('/login');
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render('urls_new', templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.send('Only registered users can shorten URLs');
  } else {
    if (req.body.longURL === "") {
      res.send('Error: URL cannot be empty.');
    } else {
      let newShortURL = generateRandomString();
      urlDatabase[newShortURL] = {};
      urlDatabase[newShortURL]["longURL"] = req.body.longURL;
      urlDatabase[newShortURL]["userID"] = req.session.user_id;
      console.log(urlDatabase);
      res.redirect(`/urls/${newShortURL}`);
    }
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.send("Error: shortened link invalid.");
  } else {
    const longURL = urlDatabase[req.params.shortURL]["longURL"];
    res.redirect(longURL);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === undefined) {
    res.send("Error: please log in or register to view URLs.");
  } else {
    const filteredDatabase = urlsForUser(req.session.user_id);
    if (filteredDatabase[req.params.shortURL] === undefined) {
      res.send("Error: the requested URL does not exist or does not belong to you.");
    } else {
      const longURL = filteredDatabase[req.params.shortURL]["longURL"];
      const templateVars = {
        shortURL: req.params.shortURL,
        longURL: longURL,
        user: users[req.session.user_id]
      };
      res.render('urls_show', templateVars);
    }
  }
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL]["longURL"] = req.body.newURL; // Update database
  const longURL = req.body.newURL;
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: longURL,
    user: users[req.session.user_id]
  };
  res.render('urls_show', templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const filteredDatabase = urlsForUser(req.session.user_id);
  if (filteredDatabase[req.params.shortURL] === undefined) {
    res.send("Error: the requested URL does not exist or does not belong to you.");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/login", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.send("403 Forbidden");
  } else if (!getUserByEmail(req.body.email, users)) {
    res.send("403 Forbidden");
  } else if (!bcrypt.compareSync(req.body.password, getUserByEmail(req.body.email, users)["password"])) {
    res.send("403 Forbidden");
  } else {

    let user = Object.keys(users);
    let userID = "";

    for (let i = 0; i < user.length; i++) {
      if (users[user[i]]["email"] === req.body.email) {
        userID = users[user[i]]["id"];
      }
    }

    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = undefined;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render('registration', templateVars);
  }
});

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.send("400 Bad Request");
  } else if (getUserByEmail(req.body.email, users)) {
    res.send("400 Bad Request: Account with email address already exists.");
  } else {
    let newUserID = generateRandomString();
    users[newUserID] = {};
    users[newUserID]["id"] = newUserID;
    users[newUserID]["email"] = req.body.email;
    users[newUserID]["password"] = bcrypt.hashSync(req.body.password, 10);

    req.session.user_id = newUserID;
    console.log(users);
    console.log(req.body.email);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("login", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const express = require("express");
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { generateRandomString, getUserByEmail } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(express.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['secret']
}));

const urlDatabase = {
  'b6UTxQ': {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  'i3BoGr': {
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

// filters URLs for each individual user
const urlsForUser = (id) => {
  let urlsUser = {};
  for (const shortU in urlDatabase) {
    if (urlDatabase[shortU].userID === id) {
      urlsUser[shortU] = urlDatabase[shortU];
    }
  }
  return urlsUser;
};

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (!(req.session.user_id)) {
    res.send("<h1>Error: Please log in or register to view URLs.</h1>");
  }
  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    user_id: users[req.session.user_id]
  };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!(req.session.user_id)) { // if the user is not logged in, redirect to /login
    res.redirect('/login');
  }

  const templateVars = {
    user_id: users[req.session.user_id]
  };
  res.render('urls_new', templateVars);
});

app.post("/urls", (req, res) => { // add a new URL
  if (!(req.session.user_id)) {
    res.send('<h1>Only registered and logged in users can create new tiny URLs.</h1>');
  } else if (req.body.longURL === "") {
    res.send('<h1>Error: The URL cannot be empty.</h1>');
  } else {
    const shortURL = generateRandomString();
    // Add new URL to the database
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].longURL = req.body.longURL;
    urlDatabase[shortURL].userID = req.session.user_id;
    console.log(urlDatabase);
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get("/u/:id", (req, res) => { // redirect to the original URL
  if (!(req.params.id in urlDatabase)) {
    res.send("<h1>Error: The shorted URL does not exist. Please check that the short URL has been entered correctly.</h1>");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  if (!(req.params.id in urlDatabase)) {
    res.send("<h1>The shorted URL does not exist. Please check that the short URL has been entered correctly.</h1>");
  } else if (!(req.session.user_id)) {
    res.send("<h1>Error: Please log in to view details of this URL.</h1>");
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.send("<h1>This URL does not belong to you. You can only make changes to URLs that you own.</h1>");
  }
  const templateVars = {
    user_id: users[req.session.user_id],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  if (!(req.session.user_id)) {
    res.send("<h1>You must be logged in to make changes to a URL.</h1>");
  } else {
    urlDatabase[req.params.id].longURL = req.body.newLongURL;
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => { // delete a URL from the list
  if (!(req.params.id in urlDatabase)) {
    res.send("<h1>The shorted URL does not exist. Please check that the short URL has been entered correctly.</h1>");
  } else if (!(req.session.user_id)) {
    res.send("<h1>You must be logged in to delete a URL.</h1>");
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.send("<h1>This URL does not belong to you. You can only make changes to URLs that you own.</h1>");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);

  if (user === null) {
    res.send("<h1>403 Forbidden</h1>");
  } else if (!(bcrypt.compareSync(req.body.password, user.password))) {
    res.send("<h1>403 Forbidden</h1>");
  } else {
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) { // if user is logged in, redirect to /urls
    res.redirect("/urls");
  }
  const templateVars = {
    user_id: users[req.session.user_id]
  };
  res.render('registration', templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.send("<h1>400 Bad Request: Email and password fields cannot be empty.</h1>");
  } else if (getUserByEmail(req.body.email, users)) {
    res.send("<h1>400 Bad Request: Account with email address already exists.</h1>");
  } else {
    const newUserID = generateRandomString();
    users[newUserID] = {};
    users[newUserID].id = newUserID;
    users[newUserID].email = req.body.email;
    users[newUserID].password = bcrypt.hashSync(req.body.password, 10);

    req.session.user_id = newUserID;
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) { // if user is logged in, redirect to /urls
    res.redirect("/urls");
  }
  const templateVars = { user_id: users[req.session.user_id] };
  res.render("login", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

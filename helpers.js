
const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let newString = '';
  for (let i = 0; i < 6; i++) {
    newString += characters.charAt(Math.floor(Math.random() * 62));
  }
  return newString;
};

const getUserByEmail = function(email, database) {
  let user = {};
  let userKeys = Object.keys(database);

  for (let i = 0; i < userKeys.length; i++) {
    if (database[userKeys[i]]["email"] === email) {
      user = database[userKeys[i]];
      return user;
    }
  }
};

module.exports = {
  generateRandomString,
  getUserByEmail
};

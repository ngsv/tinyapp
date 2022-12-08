
const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
};

const getUserByEmail = (email, database) => {
  let user = {};
  for (const u in database) {
    if (database[u].email === email) {
      user = database[u];
      return user;
    }
  }
  return null;
};

module.exports = {
  generateRandomString,
  getUserByEmail
};

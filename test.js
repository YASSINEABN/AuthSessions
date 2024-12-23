const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const testdata = require('./users.json').users;
var fs = require('fs');

const app = express();
app.use(express.json());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  const userExists = testdata.some(element => element.email === email);

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), username, email, password: hashedPassword };
  testdata.push(newUser);

  fs.writeFile('users.json', JSON.stringify({ users: testdata }, null, 2), function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error saving user data' });
    }
  });

  return res.status(201).json({ message: 'User registered successfully', user: { id: newUser.id, username: newUser.username } });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = testdata.find(element => element.email === email);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user.username;
    res.send('Login successful!');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.get('/protected-resource', (req, res) => {
  if (req.session.user) {
    res.send(`Welcome, ${req.session.user}!`);
  } else {
    res.status(401).send('Unauthorized. Please log in.');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

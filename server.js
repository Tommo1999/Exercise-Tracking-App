require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Required for generating password reset tokens

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (like images, CSS, JS) from the "images" folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve static files for CSS and JS (typically from a "public" folder or similar)
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection setup
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// MongoDB connection and server setup
MongoClient.connect(MONGO_URI)
  .then((client) => {
    const db = client.db('ExerciseTrackerApp_db');
    const usersCollection = db.collection('Users');
    const workoutsCollection = db.collection('Workouts'); // General workouts collection

    // Serve the home page
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'index.html'));
    });

    // Serve the signup page
    app.get('/signup', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'signup.html'));
    });

    // Serve the login page
    app.get('/login', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'login.html'));
    });

    // Serve the Forgot Password page
    app.get('/forgot-password', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'forgot-password.html'));
    });

    // Serve the dashboard page (after login)
    app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
    });

    // Forgot Password Route
    app.post('/forgot-password', async (req, res) => {
      const { usernameOrEmail } = req.body;
      const user = await usersCollection.findOne({
        $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      });

      if (!user) {
        return res.send('User not found');
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetLink = `http://localhost:${PORT}/reset-password/${resetToken}`;

      // Save the reset token in the user's document
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { resetToken, resetTokenExpiration: Date.now() + 3600000 } } // Token expires in 1 hour
      );

      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: 'Password Reset',
        text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      res.send('Password reset link has been sent');
    });

    // Reset Password Route
    app.post('/reset-password/:token', async (req, res) => {
      const { token } = req.params;
      const { password } = req.body;

      const user = await usersCollection.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
      });

      if (!user) {
        return res.send('Token is invalid or expired');
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, resetToken: null, resetTokenExpiration: null } }
      );

      res.send('Your password has been reset');
    });

    // Signup Logic
    app.post('/signup', async (req, res) => {
      try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
          return res.status(400).send('All fields are required.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await usersCollection.findOne({
          $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
        });

        if (existingUser) {
          return res.status(400).send('Username or email already in use.');
        }

        await usersCollection.insertOne({
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          password: hashedPassword,
        });

        res.status(200).send('User registered successfully!');
      } catch (error) {
        console.error('Error signing up user:', error);
        res.status(500).send('Error signing up. Please try again.');
      }
    });

    // Login Logic
    app.post('/login', async (req, res) => {
      const { usernameOrEmail, password } = req.body;

      try {
        const user = await usersCollection.findOne({
          $or: [{ email: usernameOrEmail.toLowerCase() }, { username: usernameOrEmail.toLowerCase() }],
        });

        if (!user) {
          return res.status(401).send('Invalid username or email.');
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
          return res.status(401).send('Invalid password.');
        }

        res.status(200).send('User logged in successfully!');
      } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).send('Error logging in. Please try again.');
      }
    });

    // Add Workout Logic
    app.post('/add-workout', async (req, res) => {
      const { username, workoutType, exercise, reps, weights, cardio, date, weightUnit } = req.body;

      if (!username || !workoutType || !exercise || !reps || !weights || !cardio || !date || !weightUnit) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      if (isNaN(reps) || isNaN(weights)) {
        return res.status(400).json({ message: 'Reps and weights must be numbers.' });
      }

      if (weightUnit !== 'kg' && weightUnit !== 'lbs') {
        return res.status(400).json({ message: 'Weight unit must be either "kg" or "lbs".' });
      }

      if (isNaN(cardio) && typeof cardio !== 'string') {
        return res.status(400).json({ message: 'Cardio must be a number (duration in minutes) or a string (type of cardio).' });
      }

      const userWorkoutCollection = db.collection(username.toLowerCase());

      try {
        await userWorkoutCollection.insertOne({
          workoutType,
          exercise,
          reps: Number(reps),
          weights: Number(weights),
          cardio: cardio,
          date,
          weightUnit,
        });

        res.status(200).json({ message: 'Workout data added successfully!' });
      } catch (error) {
        console.error('Error adding workout data:', error);
        res.status(500).json({ message: 'Error adding workout data. Please try again.' });
      }
    });

  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Required for generating password reset tokens
const fileUpload = require('express-fileupload'); // Added for handling file uploads

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the "images" folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve static files from the 'views' folder
app.use(express.static(path.join(__dirname, 'views')));

// Set up MongoDB connection in Heroku
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Use file upload middleware
app.use(fileUpload());

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
        return res.status(404).json({ message: 'User not found' });
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

      res.status(200).json({ message: 'Password reset link has been sent' });
    });

    // Reset Password Route (This should be a form where the user can input their new password)
    app.get('/reset-password/:token', (req, res) => {
      const { token } = req.params;
      res.sendFile(path.join(__dirname, 'views', 'reset-password.html', token));
    });

    app.post('/reset-password/:token', async (req, res) => {
      const { token } = req.params;
      const { password } = req.body;

      const user = await usersCollection.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ message: 'Token is invalid or expired' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, resetToken: null, resetTokenExpiration: null } }
      );

      res.status(200).json({ message: 'Your password has been reset' });
    });

    // Signup Logic
    app.post('/signup', async (req, res) => {
      try {
        const { username, email, password } = req.body;

        // Ensure all fields are provided
        if (!username || !email || !password) {
          return res.status(400).json({ message: 'All fields are required.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if username or email already exists
        const existingUser = await usersCollection.findOne({
          $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
        });
        if (existingUser) {
          return res.status(400).json({ message: 'Username or email already in use.' });
        }

        // Insert new user data into the 'Users' collection
        await usersCollection.insertOne({
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          password: hashedPassword,
        });

        res.status(200).json({ message: 'User registered successfully!' });
      } catch (error) {
        console.error('Error signing up user:', error);
        res.status(500).json({ message: 'Error signing up. Please try again.' });
      }
    });

    // Login Logic
    app.post('/login', async (req, res) => {
      const { usernameOrEmail, password } = req.body;

      try {
        // Check if the user exists by email or username
        const user = await usersCollection.findOne({
          $or: [{ email: usernameOrEmail.toLowerCase() }, { username: usernameOrEmail.toLowerCase() }],
        });

        if (!user) {
          return res.status(401).json({ message: 'Invalid username or email.' });
        }

        // Check if password matches
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
          return res.status(401).json({ message: 'Invalid password.' });
        }

        res.status(200).json({ message: 'User logged in successfully!' });
      } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in. Please try again.' });
      }
    });

    // Add Workout Logic
    app.post('/add-workout', async (req, res) => {
      const { username, workoutType, exercise, reps, weights, cardio, date, weightUnit } = req.body;

      // Ensure all required fields are provided
      if (!username || !workoutType || !exercise || !reps || !weights || !cardio || !date || !weightUnit) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      // Validate reps and weights are numbers
      if (isNaN(reps) || isNaN(weights)) {
        return res.status(400).json({ message: 'Reps and weights must be numbers.' });
      }

      // Validate weight unit is either 'kg' or 'lbs'
      if (weightUnit !== 'kg' && weightUnit !== 'lbs') {
        return res.status(400).json({ message: 'Weight unit must be either "kg" or "lbs".' });
      }

      // Cardio validation: Check if cardio is a string (e.g., exercise type) or number (e.g., duration in minutes)
      if (isNaN(cardio) && typeof cardio !== 'string') {
        return res.status(400).json({ message: 'Cardio must be a number (duration in minutes) or a string (type of cardio).' });
      }

      // Ensure workout data is stored in a collection per user, based on their username
      const userWorkoutCollection = db.collection(username.toLowerCase()); // Collection named after the user's username

      try {
        // Insert workout data into the user's specific collection
        await userWorkoutCollection.insertOne({
          workoutType,
          exercise,
          reps: Number(reps),
          weights: Number(weights),
          cardio: cardio,  // Can be a string (e.g., "Running") or a number (e.g., "30" minutes)
          date,
          weightUnit, // Store weight unit
        });

        res.status(200).json({ message: 'Workout data added successfully!' });
      } catch (error) {
        console.error('Error adding workout data:', error);
        res.status(500).json({ message: 'Error adding workout data. Please try again.' });
      }
    });

    // Add Exercise Logic
    app.post('/add-exercise', async (req, res) => {
      const { username, exercise, reps, weight, date } = req.body;

      // Ensure all required fields are provided
      if (!username || !exercise || !reps || !date) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      // Validate reps and weight are numbers
      if (isNaN(reps) || (weight && isNaN(weight))) {
        return res.status(400).json({ message: 'Reps and weight must be numbers.' });
      }

      // Ensure exercise data is stored in a collection per user, based on their username
      const userExerciseCollection = db.collection(username.toLowerCase()); // Collection named after the user's username

      try {
        // Insert exercise data into the user's specific collection
        await userExerciseCollection.insertOne({
          exercise,
          reps: Number(reps),
          weight: weight ? Number(weight) : null,
          date,
        });

        res.status(200).json({ message: 'Exercise data added successfully!' });
      } catch (error) {
        console.error('Error adding exercise data:', error);
        res.status(500).json({ message: 'Error adding exercise data. Please try again.' });
      }
    });

    // Download Workout Data as Excel
    app.get('/download-workout/:username', async (req, res) => {
      const { username } = req.params;

      const userWorkoutCollection = db.collection(username.toLowerCase());

      try {
        const workouts = await userWorkoutCollection.find().toArray();

        // Create a new Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Workouts');

        // Add column headers
        worksheet.columns = [
          { header: 'Date', key: 'date' },
          { header: 'Workout Type', key: 'workoutType' },
          { header: 'Exercise', key: 'exercise' },
          { header: 'Reps', key: 'reps' },
          { header: 'Weights', key: 'weights' },
          { header: 'Cardio', key: 'cardio' },
          { header: 'Weight Unit', key: 'weightUnit' },
        ];

        // Add rows of workout data
        workouts.forEach(workout => {
          worksheet.addRow(workout);
        });

        // Set the response headers for downloading the file
        res.setHeader('Content-Disposition', 'attachment; filename=workouts.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Write the workbook to the response stream
        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.error('Error downloading workout data:', error);
        res.status(500).json({ message: 'Error generating workout file. Please try again.' });
      }
    });

    // Upload workout data from Excel file
    app.post('/upload-workout/:username', async (req, res) => {
      const { username } = req.params;

      // Ensure a file is provided
      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
      }

      // Read the uploaded file
      const file = req.files.file;
      const workbook = new ExcelJS.Workbook();

      try {
        await workbook.xlsx.load(file.data);
        const worksheet = workbook.getWorksheet(1); // Get the first worksheet
        const rows = worksheet.getRows(2, worksheet.rowCount); // Get all rows except headers

        const userWorkoutCollection = db.collection(username.toLowerCase());

        rows.forEach(row => {
          const workoutData = {
            date: row.getCell(1).value,
            workoutType: row.getCell(2).value,
            exercise: row.getCell(3).value,
            reps: row.getCell(4).value,
            weights: row.getCell(5).value,
            cardio: row.getCell(6).value,
            weightUnit: row.getCell(7).value,
          };

          // Insert each row of data into the user's specific workout collection
          userWorkoutCollection.insertOne(workoutData);
        });

        res.status(200).json({ message: 'Workouts uploaded successfully!' });
      } catch (error) {
        console.error('Error uploading workout data:', error);
        res.status(500).json({ message: 'Error uploading workout file. Please try again.' });
      }
    });

    // Start the server inside the MongoDB connection promise
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });

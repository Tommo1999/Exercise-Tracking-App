require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

MongoClient.connect(MONGO_URI)
  .then((client) => {
    const db = client.db('fit-track');
    const usersCollection = db.collection('Users');
    const workoutsCollection = db.collection('Workouts');

    // Serve static pages
    app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
    app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'views', 'signup.html')));
    app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
    app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
    app.get('/forgot-password', (req, res) => res.sendFile(path.join(__dirname, 'views', 'forgot-password.html')));

    // Signup
    app.post('/signup', async (req, res) => {
      const { username, email, password } = req.body;
      if (!username || !email || !password) return res.status(400).send('All fields are required.');
      const hashedPassword = await bcrypt.hash(password, 10);
      const existingUser = await usersCollection.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
      });
      if (existingUser) return res.status(400).send('Username or email already in use.');
      await usersCollection.insertOne({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
      });
      res.redirect('/login');
    });

    // Login
    app.post('/login', async (req, res) => {
      const { usernameOrEmail, password } = req.body;
      const user = await usersCollection.findOne({
        $or: [{ email: usernameOrEmail.toLowerCase() }, { username: usernameOrEmail.toLowerCase() }],
      });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid username or email.' });
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) return res.status(401).json({ success: false, message: 'Invalid password.' });
      res.status(200).json({ success: true, username: user.username });
    });

    // Forgot Password
    app.post('/forgot-password', async (req, res) => {
      const { usernameOrEmail } = req.body;
      const user = await usersCollection.findOne({
        $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      });
      if (!user) return res.send('User not found');
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetLink = `http://localhost:${PORT}/reset-password/${resetToken}`;
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { resetToken, resetTokenExpiration: Date.now() + 3600000 } }
      );
      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: 'Password Reset',
        text: `Click to reset your password: ${resetLink}`,
      };
      transporter.sendMail(mailOptions);
      res.send('Password reset link has been sent');
    });

    app.post('/reset-password/:token', async (req, res) => {
      const { token } = req.params;
      const { password } = req.body;
      const user = await usersCollection.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
      });
      if (!user) return res.send('Token is invalid or expired');
      const hashedPassword = await bcrypt.hash(password, 12);
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, resetToken: null, resetTokenExpiration: null } }
      );
      res.send('Password reset successfully');
    });

    // Add Workout 
    app.post('/add-workout', async (req, res) => {
      const {
  username,
  workout,
  date,
  exercises,
  progressYourLifts,
  progressForNextSession,
  workoutRating,
  additionalNotes,
  cardio
} = req.body;

if (!username || !workout || !date || !Array.isArray(exercises) || exercises.length === 0) {
  return res.status(400).json({ message: 'Invalid workout data' });
}
      for (let ex of exercises) {
        if (!ex.name || !Array.isArray(ex.sets) || ex.sets.length === 0) {
          return res.status(400).json({ message: 'Invalid exercise data' });
        }
        for (let set of ex.sets) {
          if (isNaN(set.weight) || isNaN(set.reps)) {
            return res.status(400).json({ message: 'Invalid set data (weight/reps)' });
          }
        }
      }

      try {
        const docs = exercises.map((ex) =>
  ex.sets.map((set, index) => ({
    username,
    workout,
    exerciseName: ex.name,
    weightUnit: ex.weightUnit || 'kg',
    reps: Number(set.reps) || 0,
    weights: Number(set.weight) || 0,
    date,
    timestamp: new Date(),
    progressYourLifts,
    progressForNextSession,
    workoutRating,
    additionalNotes,
    cardio,
    setIndex: index + 1,
  }))
).flat();

        await workoutsCollection.insertMany(docs);
        res.status(200).json({ message: 'Workout added with all exercises and sets' });
      } catch (error) {
        console.error('Error saving workout:', error);
        res.status(500).json({ message: 'Error saving workout' });
      }
    });

    // Get workouts
    app.get('/get-workouts', async (req, res) => {
      const { username } = req.query;
      if (!username) return res.status(400).json({ message: "Username is required" });
      try {
        const workouts = await workoutsCollection
          .find({ username })
          .sort({ date: -1 })
          .toArray();
        res.json(workouts);
      } catch (error) {
        console.error("Error fetching workouts:", error);
        res.status(500).json({ message: "Failed to fetch workouts" });
      }
    });

    // Export workouts to Excel
    app.get('/export-workouts', async (req, res) => {
      const { username } = req.query;
      if (!username) return res.status(400).json({ message: "Username is required" });

      try {
        const workouts = await workoutsCollection.find({ username }).toArray();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Workouts');

        worksheet.columns = [
          { header: 'Exercise Name', key: 'exerciseName' },
          { header: 'Weight Unit', key: 'weightUnit' },
          { header: 'Weight', key: 'weights' },
          { header: 'Reps', key: 'reps' },
          { header: 'Date', key: 'date' },
          { header: 'Progress Your Lifts', key: 'progressYourLifts' },
          { header: 'Progress for Next Session', key: 'progressForNextSession' },
          { header: 'Workout Rating', key: 'workoutRating' },
          { header: 'Additional Notes', key: 'additionalNotes' },
          { header: 'Cardio', key: 'cardio' },
        ];

        workouts.forEach((workout) => {
          worksheet.addRow({
            exerciseName: workout.exerciseName,
            weightUnit: workout.weightUnit,
            weights: workout.weights,
            reps: workout.reps,
            date: workout.date,
            progressYourLifts: workout.progressYourLifts,
            progressForNextSession: workout.progressForNextSession,
            workoutRating: workout.workoutRating,
            additionalNotes: workout.additionalNotes,
            cardio: workout.cardio,
          });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=workouts.xlsx');

        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.error("Error exporting workouts:", error);
        res.status(500).json({ message: "Failed to export workouts" });
      }
    });

  })
  .catch((err) => console.error(`Failed to connect to MongoDB: ${err}`));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

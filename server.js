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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

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
    const workoutDoc = {
      username,
      workout,
      date,
      exercises: exercises.map(ex => ({
        name: ex.name,
        weightUnit: ex.weightUnit || 'kg',
        sets: ex.sets.map(set => ({
          weight: Number(set.weight),
          reps: Number(set.reps)
        }))
      })),
      progressYourLifts,
      progressForNextSession,
      workoutRating,
      additionalNotes,
      cardio,
      timestamp: new Date()
    };

    await workoutsCollection.insertOne(workoutDoc);
    res.status(200).json({ message: 'Workout saved successfully!' });
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
          .sort({ timestamp: -1 })
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

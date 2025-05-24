require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); // ✅ FIXED HERE
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const app = express();

// force https on Heroku
app.use((req, res, next) => {
if(req.headers['x-forwarded-proto'] !== 'https') {
return res.redirect('https://' + req.headers.host + req.url);
}
next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
    });

  app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

//signup logic
app.post('/signup', async (req, res) => {
  const { username, email, password, marketingConsent } = req.body;
  if (!username || !email || !password)
    return res.status(400).send('All fields are required.');
  const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await usersCollection.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() },
    ],
  });

  if (existingUser)
    return res.status(400).send('Username or email already in use.');

  await usersCollection.insertOne({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hashedPassword,
    marketingConsent: !!marketingConsent, // ✅ store as boolean
  });
  res.status(200).json({ message: 'User registered successfully' });
});

//login logic

    app.post('/login', async (req, res) => {
      const { usernameOrEmail, password } = req.body;
      const user = await usersCollection.findOne({
        $or: [{ email: usernameOrEmail.toLowerCase() }, { username: usernameOrEmail.toLowerCase() }],
      });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid username or email.' });
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) return res.status(401).json({ success: false, message: 'Invalid password.' });
      res.status(200).json({ success: true, message: 'Login successful', username: user.username });
    });


//forgot passsword logic

   const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const resetLink = `https://www.repdog.fit/reset-password?email=${encodeURIComponent(email)}`;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = {
    to: [{ email }],
    sender: { name: "RepDog", email: "topdog@repdog.fit" },
    subject: "Reset Your Password",
    htmlContent: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
  };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.status(200).send("Password reset email sent.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send email.");
  }
});

// Reset password form submission
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).send("Missing token or password.");
  }

  try {
    const user = await findUserByResetToken(token); // You need to implement this
    if (!user) return res.status(400).send("Invalid or expired token.");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.send("Password successfully reset.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
});


// add workout data to Mongo
 
    app.post('/add-workout', async (req, res) => {
      const {
        username,
        workout,
        date,
        exercises,
        progressSinceLastSession,
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
            planToProgressNextSession: ex.planToProgressNextSession,
            weightUnit: ex.weightUnit || 'kg',
            sets: ex.sets.map(set => ({
              weight: Number(set.weight),
              reps: Number(set.reps)
            }))
          })),
          progressSinceLastSession,
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

//get workouts from Mongo 

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

// add updated workouts to Mongo
 
    app.put('/update-workout/:id', async (req, res) => {
      const { id } = req.params;
      const { workout, date, exercises, progressSinceLastSession, workoutRating, additionalNotes, cardio } = req.body;

      if (!workout || !date || !Array.isArray(exercises) || exercises.length === 0) {
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
          workout,
          date,
          exercises: exercises.map(ex => ({
            name: ex.name,
            planToProgressNextSession: ex.planToProgressNextSession,
            weightUnit: ex.weightUnit || 'kg',
            sets: ex.sets.map(set => ({
              weight: Number(set.weight),
              reps: Number(set.reps)
            }))
          })),
          progressSinceLastSession,
          workoutRating,
          additionalNotes,
          cardio,
          timestamp: new Date()
        };

        const result = await workoutsCollection.updateOne(
          { _id: new ObjectId(id) }, // ✅ FIXED HERE
          { $set: workoutDoc }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: 'Workout not found or no changes made' });
        }

        res.status(200).json({ message: 'Workout updated successfully!' });
      } catch (error) {
        console.error('Error updating workout:', error);
        res.status(500).json({ message: 'Error updating workout' });
      }
    });


//delete workout from Mongo

    app.delete('/delete-workout/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const result = await workoutsCollection.deleteOne({ _id: new ObjectId(id) }); // ✅ FIXED HERE
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Workout not found' });
        }
        res.status(200).json({ message: 'Workout deleted successfully' });
      } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ message: 'Error deleting workout' });
      }
    });

// export workouts to Excel format

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

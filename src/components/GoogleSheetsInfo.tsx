export  default function GoogleSheetsInfo() {
  return (
    <div className="mt-4 bg-blue-50 p-4 rounded-md text-sm">
      <h4 className="font-medium text-blue-700 mb-2">Google Sheets Setup Instructions</h4>
      <p className="text-blue-800 mb-3">
        To store your workout data, follow these steps to set up Google Sheets with Apps Script:
      </p>
      
      <ol className="list-decimal pl-5 space-y-2 text-blue-800">
        <li>Create a new Google Sheet in your Google Drive</li>
        <li>Create four sheets named: <span className="font-mono bg-blue-100 px-1">Workouts</span>, <span className="font-mono bg-blue-100 px-1">Exercises</span>, <span className="font-mono bg-blue-100 px-1">Sets</span>, and <span className="font-mono bg-blue-100 px-1">Config</span></li>
        <li>In the Workouts sheet, add headers: ID, Date, Name</li>
        <li>In the Exercises sheet, add headers: ID, WorkoutID, Name, Description</li>
        <li>In the Sets sheet, add headers: ID, ExerciseID, SetNumber, Weight, Reps</li>
        <li>Click on Extensions → Apps Script</li>
        <li>Copy the Apps Script code provided below</li>
        <li>Click Deploy → New deployment → Web app</li>
        <li>Set access to "Anyone" and click Deploy</li>
        <li>Copy the deployed URL and update it in the GoogleSheetsService.ts file</li>
      </ol>
      
      <div className="mt-4">
        <p className="font-medium text-blue-700 mb-1">Apps Script Code:</p>
        <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`function doGet(e) {
  const operation = e.parameter.operation;
  let result = { success: false };
  
  try {
    if (operation === 'getWorkouts') {
      result = { 
        success: true,
        workouts: getAllWorkouts()
      };
    } else if (operation === 'saveWorkout') {
      const workout = JSON.parse(e.parameter.data);
      saveWorkout(workout);
      result = { success: true };
    } else if (operation === 'deleteWorkout') {
      const { workoutId } = JSON.parse(e.parameter.data);
      deleteWorkout(workoutId);
      result = { success: true };
    }
  } catch (error) {
    result = { 
      success: false, 
      error: error.toString() 
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAllWorkouts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const workoutsSheet = ss.getSheetByName('Workouts');
  const exercisesSheet = ss.getSheetByName('Exercises');
  const setsSheet = ss.getSheetByName('Sets');
  
  // Get all data
  const workoutsData = getSheetDataAsObjects(workoutsSheet);
  const exercisesData = getSheetDataAsObjects(exercisesSheet);
  const setsData = getSheetDataAsObjects(setsSheet);
  
  // Build the nested object structure
  return workoutsData.map(workout => {
    // Find all exercises for this workout
    const exercises = exercisesData
      .filter(ex => ex.WorkoutID === workout.ID)
      .map(exercise => {
        // Find all sets for this exercise
        const sets = setsData
          .filter(set => set.ExerciseID === exercise.ID)
          .sort((a, b) => parseInt(a.SetNumber) - parseInt(b.SetNumber))
          .map(set => ({
            id: set.ID,
            weight: set.Weight,
            reps: set.Reps
          }));
          
        return {
          id: exercise.ID,
          name: exercise.Name,
          description: exercise.Description,
          sets: sets
        };
      });
      
    return {
      id: workout.ID,
      date: workout.Date,
      name: workout.Name,
      exercises: exercises
    };
  });
}

function saveWorkout(workout) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const workoutsSheet = ss.getSheetByName('Workouts');
  const exercisesSheet = ss.getSheetByName('Exercises');
  const setsSheet = ss.getSheetByName('Sets');
  
  // Save workout
  workoutsSheet.appendRow([
    workout.id,
    workout.date,
    workout.name
  ]);
  
  // Save exercises and their sets
  workout.exercises.forEach(exercise => {
    exercisesSheet.appendRow([
      exercise.id,
      workout.id,
      exercise.name,
      exercise.description
    ]);
    
    // Save sets
    exercise.sets.forEach((set, index) => {
      setsSheet.appendRow([
        set.id,
        exercise.id,
        index + 1,
        set.weight,
        set.reps
      ]);
    });
  });
}

function deleteWorkout(workoutId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const workoutsSheet = ss.getSheetByName('Workouts');
  const exercisesSheet = ss.getSheetByName('Exercises');
  const setsSheet = ss.getSheetByName('Sets');
  
  // Get all exercises for this workout
  const exercisesData = getSheetDataAsObjects(exercisesSheet);
  const exerciseIds = exercisesData
    .filter(ex => ex.WorkoutID === workoutId)
    .map(ex => ex.ID);
  
  // Delete sets for all exercises
  deleteRowsWithValue(setsSheet, 'ExerciseID', exerciseIds);
  
  // Delete exercises
  deleteRowsWithValue(exercisesSheet, 'WorkoutID', [workoutId]);
  
  // Delete workout
  deleteRowsWithValue(workoutsSheet, 'ID', [workoutId]);
}

// Helper functions
function getSheetDataAsObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

function deleteRowsWithValue(sheet, columnName, values) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const columnIndex = headers.indexOf(columnName);
  
  if (columnIndex === -1) return;
  
  // Find rows to delete (in reverse order)
  const rowsToDelete = [];
  for (let i = data.length - 1; i > 0; i--) {
    if (values.includes(data[i][columnIndex])) {
      rowsToDelete.push(i + 1); // +1 because rows are 1-indexed
    }
  }
  
  // Delete rows
  rowsToDelete.forEach(row => {
    sheet.deleteRow(row);
  });
}

// For importing data from MongoDB/other sources
function importData(jsonData) {
  const data = JSON.parse(jsonData);
  data.forEach(workout => saveWorkout(workout));
  return { success: true };
}

// For exporting to MongoDB/other formats
function exportData() {
  return getAllWorkouts();
}`}
        </pre>
      </div>
      
      <div className="mt-4">
        <p className="text-blue-800">
          This setup creates a relational database in Google Sheets. To import into MongoDB Compass:
        </p>
        <ol className="list-decimal pl-5 space-y-1 text-blue-800 mt-2">
          <li>Download the data using the Export button</li>
          <li>Use MongoDB Compass's import feature to load the CSV data</li>
          <li>Configure MongoDB collection mapping as needed</li>
        </ol>
      </div>
    </div>
  );
}
 
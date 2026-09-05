// Load saved app data
let state = loadState();

// Make sure subjects exists
if (!Array.isArray(state.subjects)) {
  state.subjects = [];
}

const generateBtn = document.getElementById("generateBtn");
const timetable = document.getElementById("timetable");

generateBtn.addEventListener("click", generateTimetable);

function generateTimetable() {
  const hours = Number(document.getElementById("hours").value);
  const numberOfDays = Number(document.getElementById("days").value);
  const startTime = document.getElementById("startTime").value;

  // Basic validation
  if (!hours || hours < 1) {
    alert("Please enter at least 1 study hour.");
    return;
  }

  if (!numberOfDays || numberOfDays < 1) {
    alert("Please enter at least 1 study day.");
    return;
  }

  // Get subjects from the app
  let subjects = state.subjects || [];

  // If there are no subjects yet
  if (subjects.length === 0) {
    subjects = [
      { name: "Biology" },
      { name: "Physics" },
      { name: "Chemistry" }
    ];
  }

  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  let html = "";

  let subjectIndex = 0;

  for (let day = 0; day < numberOfDays; day++) {

    html += `
      <div class="day">
        <h3>${dayNames[day]}</h3>
    `;

    for (let hour = 0; hour < hours; hour++) {

      const subject = subjects[subjectIndex % subjects.length];

      const time = addHours(startTime, hour);

      html += `
        <div class="study-session">
          <strong>${time}</strong>
          <br>
          📚 ${subject.name}
        </div>
      `;

      subjectIndex++;
    }

    html += `</div>`;
  }

  timetable.innerHTML = html;
}


// Add hours to a time such as 17:00
function addHours(timeString, hoursToAdd) {

  const [hours, minutes] = timeString.split(":").map(Number);

  const date = new Date();

  date.setHours(hours + hoursToAdd);
  date.setMinutes(minutes);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

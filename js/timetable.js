const generateBtn = document.getElementById("generateBtn");
const timetable = document.getElementById("timetable");

generateBtn.addEventListener("click", generateTimetable);

function generateTimetable() {
  const hours = Number(document.getElementById("hours").value);
  const numberOfDays = Number(document.getElementById("days").value);
  const startTime = document.getElementById("startTime").value;

  if (hours < 1 || numberOfDays < 1 || !startTime) {
    alert("Please enter valid timetable details.");
    return;
  }

  // Get subjects saved by the Study Coach app
  let subjects = [];

  try {
    const saved = localStorage.getItem("studyCoach.v1");

    if (saved) {
      const state = JSON.parse(saved);

      if (Array.isArray(state.subjects)) {
        subjects = state.subjects;
      }
    }
  } catch (error) {
    console.error("Could not load subjects:", error);
  }

  // If the user hasn't created subjects yet
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
          <div class="session-time">${time}</div>
          <div class="session-subject">
            📚 ${subject.name}
          </div>
        </div>
      `;

      subjectIndex++;
    }

    html += `
      </div>
    `;
  }

  timetable.innerHTML = html;
}


function addHours(timeString, hoursToAdd) {

  const [hours, minutes] = timeString
    .split(":")
    .map(Number);

  const date = new Date();

  date.setHours(hours + hoursToAdd);
  date.setMinutes(minutes);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

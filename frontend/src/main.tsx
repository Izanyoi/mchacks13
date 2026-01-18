import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import GoogleCalendar from "./Calendar.tsx";

const sampleEvents = [
  {
    id: 1,
    title: "Meeting with team",
    date: new Date(2026, 0, 19, 10, 0),
    duration: 1,
    color: "bg-blue-500",
  },
  {
    id: 2,
    title: "Lunch with John",
    date: new Date(2026, 0, 19, 12, 0),
    duration: 1,
    color: "bg-green-500",
  },
  {
    id: 3,
    title: "Dentist appointment",
    date: new Date(2026, 0, 21, 14, 0),
    duration: 1.5,
    color: "bg-red-500",
  },
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleCalendar initialEvents={sampleEvents} />
  </StrictMode>,
);

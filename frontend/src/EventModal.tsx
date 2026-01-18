import React, { useState, useEffect } from "react";

interface Event {
  id: number;
  title: string;
  date: Date;
  duration: number;
  color: string;
}

interface EventModalProps {
  event: Omit<Event, "id">;
  showModal: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, "id">) => void;
  weekDates: Date[];
  dayNames: string[];
  monthNames: string[];
  hours: number[];
  formatHour: (hour: number) => string;
}

export default function EventModal({
  event,
  showModal,
  onClose,
  onSave,
  weekDates,
  dayNames,
  monthNames,
  hours,
  formatHour,
}: EventModalProps) {
  const [currentEvent, setCurrentEvent] = useState(event);

  useEffect(() => {
    setCurrentEvent(event);
  }, [event]);

  if (!showModal) {
    return null;
  }

  const handleSave = () => {
    if (currentEvent.title.trim() === "") return;
    onSave(currentEvent);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Create Event
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={currentEvent.title}
              onChange={(e) =>
                setCurrentEvent({ ...currentEvent, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Add title"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day
            </label>
            <select
              value={currentEvent.date.getDay()}
              onChange={(e) => {
                const newDate = new Date(currentEvent.date);
                const dayIndex = parseInt(e.target.value);
                const newDay = weekDates[dayIndex];
                newDate.setDate(newDay.getDate());
                newDate.setMonth(newDay.getMonth());
                newDate.setFullYear(newDay.getFullYear());
                setCurrentEvent({ ...currentEvent, date: newDate });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {weekDates.map((date, i) => (
                <option key={i} value={i}>
                  {dayNames[i]}, {monthNames[date.getMonth()]}{" "}
                  {date.getDate()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <select
              value={currentEvent.date.getHours()}
              onChange={(e) => {
                const newDate = new Date(currentEvent.date);
                newDate.setHours(parseInt(e.target.value));
                setCurrentEvent({ ...currentEvent, date: newDate });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {formatHour(hour)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (hours)
            </label>
            <select
              value={currentEvent.duration}
              onChange={(e) =>
                setCurrentEvent({
                  ...currentEvent,
                  duration: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].map((dur) => (
                <option key={dur} value={dur}>
                  {dur} {dur === 1 ? "hour" : "hours"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex gap-2">
              {[
                "bg-blue-500",
                "bg-green-500",
                "bg-purple-500",
                "bg-red-500",
                "bg-yellow-500",
                "bg-pink-500",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrentEvent({ ...currentEvent, color })}
                  className={`w-8 h-8 rounded ${color} ${currentEvent.color === color ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

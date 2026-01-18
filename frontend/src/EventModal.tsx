import { useState, useEffect } from "react";

interface Event {
  id: number;
  title: string;
  date: Date;
  duration: number;
  color: string;
  priority: number;
  autoSchedule?: boolean;
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
    event.priority = 3;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-96 p-6">
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
              Due Date
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSchedule"
                  checked={currentEvent.autoSchedule || false}
                  onChange={(e) =>
                    setCurrentEvent({ ...currentEvent, autoSchedule: e.target.checked })
                  }
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoSchedule" className="text-sm text-gray-600">
                  Auto Schedule
                </label>
              </div>
            </div>
            <select
              disabled={currentEvent.autoSchedule}
              value={currentEvent.date.getHours()}

              onChange={(e) => {
                const newDate = new Date(currentEvent.date);
                newDate.setHours(parseInt(e.target.value));
                setCurrentEvent({ ...currentEvent, date: newDate });
              }}
              className={`w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${currentEvent.autoSchedule ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                }`}
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
              Priority
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((p) => {
                const PRIORITY_COLORS: Record<number, string> = {
                  1: "bg-blue-500",
                  2: "bg-green-500",
                  3: "bg-yellow-500",
                  4: "bg-orange-500",
                  5: "bg-red-500",
                };
                const color = PRIORITY_COLORS[p];
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentEvent({ ...currentEvent, priority: p, color: color })}
                    className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs ${color} ${currentEvent.priority === p ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
                  >
                    {p}
                  </button>
                )
              })}
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

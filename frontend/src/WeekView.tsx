import React from "react";

interface Event {
  id: number;
  title: string;
  date: Date;
  duration: number;
  color: string;
}

interface WeekViewProps {
  events: Event[];
  weekDates: Date[];
  dayNames: string[];
  isToday: (date: Date) => boolean;
  hours: number[];
  formatHour: (hour: number) => string;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventDelete: (eventId: number) => void;
}

export default function WeekView({
  events,
  weekDates,
  dayNames,
  isToday,
  hours,
  formatHour,
  onTimeSlotClick,
  onEventDelete,
}: WeekViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day Headers */}
      <div className="flex border-b border-gray-200">
        <div className="w-16 flex-shrink-0"></div>
        {weekDates.map((date, i) => (
          <div
            key={i}
            className="flex-1 text-center py-2 border-l border-gray-200"
          >
            <div className="text-xs text-gray-600">{dayNames[i]}</div>
            <div
              className={`text-2xl mt-1 ${isToday(date)
                ? "bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto"
                : "text-gray-800"
                }`}
            >
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex relative">
          {/* Time Labels */}
          <div className="w-16 flex-shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 text-xs text-gray-500 pr-2 text-right relative -top-2"
              >
                {hour > 0 && formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDates.map((date, dayIndex) => (
            <div
              key={dayIndex}
              className="flex-1 relative border-l border-gray-200"
            >
              {/* Hour Lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-12 border-t border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => onTimeSlotClick(date, hour)}
                ></div>
              ))}

              {/* Events */}
              {events
                .filter((event) => {
                  const eventDate = new Date(event.date);
                  return (
                    eventDate.getFullYear() === date.getFullYear() &&
                    eventDate.getMonth() === date.getMonth() &&
                    eventDate.getDate() === date.getDate()
                  );
                })
                .map((event) => {
                  const eventDate = new Date(event.date);
                  return (
                    <div
                      key={event.id}
                      className={`absolute left-1 right-1 ${event.color} text-white text-xs p-1 rounded overflow-hidden cursor-pointer hover:opacity-90 group`}
                      style={{
                        top: `${(eventDate.getHours() + eventDate.getMinutes() / 60) * 48}px`,
                        height: `${event.duration * 48 - 2}px`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${event.title}"?`)) {
                          onEventDelete(event.id);
                        }
                      }}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to delete
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";

interface Event {
  id: number;
  title: string;
  date: Date;
  duration: number;
  color: string;
}

interface CalendarHeaderProps {
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onOpenCreateModal: () => void;
  monthYearDisplay: string;
  events: Event[];
}

export default function CalendarHeader({
  onPreviousWeek,
  onNextWeek,
  onToday,
  onOpenCreateModal,
  monthYearDisplay,
  events,
}: CalendarHeaderProps) {
  return (
    <div className="border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl text-gray-800">Calendar</h1>
          <button
            onClick={onToday}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
          >
            Today
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
            >
              &lt;
            </button>
            <button
              onClick={onNextWeek}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
            >
              &gt;
            </button>
          </div>
          <h2 className="text-xl text-gray-700">{monthYearDisplay}</h2>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
        >
          Create
        </button>
      </div>
    </div>
  );
}

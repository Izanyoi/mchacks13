import { useState, useEffect } from "react";
import CalendarHeader from "./CalendarHeader";
import WeekView from "./WeekView";
import EventModal from "./EventModal";
import AuthModal from "./AuthModal";
import { tasks, schedule, type Block } from "./api";

interface Event {
  id: number;
  title: string;
  date: Date;
  duration: number;
  color: string;
  priority: number;
}

export const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-green-500",
  3: "bg-yellow-500",
  4: "bg-orange-500",
  5: "bg-red-500",
};

export default function GoogleCalendar({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState<{ title: string, date: Date, duration: number, color: string, priority: number }>({
    title: "",
    date: new Date(),
    duration: 1,
    color: "bg-blue-500",
    priority: 1,
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getWeekDates = (date: Date) => {
    const week = [];
    const curr = new Date(date);
    curr.setDate(curr.getDate() - curr.getDay());
    for (let i = 0; i < 7; i++) {
      week.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  const fetchEvents = async () => {
    try {
      const blocks = await schedule.get();
      const mappedEvents = blocks.map((block: Block) => {
        const startDate = new Date(block.start);
        const endDate = new Date(block.end);
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        return {
          id: block.block_id,
          title: block.title,
          date: startDate,
          duration: duration,
          color: PRIORITY_COLORS[block.priority] || "bg-blue-500",
          priority: block.priority,
        };
      });
      setEvents(mappedEvents);
    } catch (e) {
      console.error("Failed to fetch events", e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const newDate = new Date();
    setCurrentDate(newDate);
  };

  const openCreateModal = (date: Date, hour: number) => {
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    setNewEvent({
      title: "",
      date: newDate,
      duration: 1,
      color: "bg-blue-500",
      priority: 1,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleCreateEvent = async (eventData: Omit<Event, "id">) => {
    const start = eventData.date;
    const end = new Date(start.getTime() + eventData.duration * 60 * 60 * 1000);

    try {
      await tasks.add({
        name: eventData.title,
        priority: eventData.priority,
        dueDate: end.toISOString(),
        estimatedTime: eventData.duration * 3600, // Convert hours to seconds
        withFriend: false,
        start: start.toISOString(),
        end: end.toISOString(),
        instances: 1
      });
      await fetchEvents();
      setShowModal(false);
    } catch (e) {
      console.error("Failed to add task", e);
      alert("Failed to create event");
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await tasks.deleteBlock(eventId);
      await fetchEvents();
    } catch (e) {
      console.error("Failed to delete block", e);
      alert("Failed to delete event");
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    openCreateModal(date, hour);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getMonthYearDisplay = () => {
    const firstDate = weekDates[0];
    const lastDate = weekDates[6];

    if (firstDate.getMonth() === lastDate.getMonth()) {
      return `${monthNames[firstDate.getMonth()]} ${firstDate.getFullYear()}`;
    }
    return `${monthNames[firstDate.getMonth()]} - ${monthNames[lastDate.getMonth()]} ${firstDate.getFullYear()}`;
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white text-gray-900">
      <CalendarHeader
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
        onOpenCreateModal={() => openCreateModal(new Date(), 9)}
        monthYearDisplay={getMonthYearDisplay()}
        events={events}
      />

      <WeekView
        events={events}
        weekDates={weekDates}
        dayNames={dayNames}
        isToday={isToday}
        hours={hours}
        formatHour={formatHour}
        onTimeSlotClick={handleTimeSlotClick}
        onEventDelete={handleDeleteEvent}
      />

      <EventModal
        event={newEvent}
        showModal={showModal}
        onClose={closeModal}
        onSave={handleCreateEvent}
        weekDates={weekDates}
        dayNames={dayNames}
        monthNames={monthNames}
        hours={hours}
        formatHour={formatHour}
      />
      <AuthModal />
    </div>
  );
}

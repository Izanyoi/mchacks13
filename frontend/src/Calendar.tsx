import React, { useState } from "react";
import CalendarHeader from "./CalendarHeader";
import WeekView from "./WeekView";
import EventModal from "./EventModal";

interface Event {
  id: number;
  title: string;
  date: Date;
  duration: number;
  color: string;
}

export default function GoogleCalendar({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState<{title: string, date: Date, duration: number, color: string}>({
    title: "",
    date: new Date(),
    duration: 1,
    color: "bg-blue-500",
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
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleCreateEvent = (eventData: Omit<Event, "id">) => {
    const event: Event = {
      id: Date.now(),
      ...eventData,
    };
    setEvents([...events, event]);
    setShowModal(false);
  };

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter((e) => e.id !== eventId));
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
    </div>
  );
}

from datetime import datetime, timedelta, time
from math import ceil

class NoZone:
    def __init__(self, start: datetime.time, end: datetime.time):
        self.start = start
        self.end = end       

class Task:
    def __init__(self, name: str, priority: int, dueDate: datetime.datetime, estimatedTime:datetime.timedelta, withFriend: bool, MAX_BLOCK_DURATION: timedelta = timedelta(hours=3)):
        self.name = name
        self.priority = priority
        self.dueDate = dueDate
        self.estimatedTime = estimatedTime
        self.withFriend = withFriend
        self.start = None
        self.end = None
        self.instances = 1
        self.minTime = None
        self.maxTime = None
        self.MAX_BLOCK_DURATION = MAX_BLOCK_DURATION

    def advancedOptions(self, start: datetime.datetime, end: datetime.datetime, instances: int, minTime: datetime.time, maxTime: datetime.time):
        self.start = start
        self.end = end
        self.instances = instances
        #for minTime and maxTime, options (slider) needs to change depending of estimatedTime and instances
        self.minTime = minTime
        self.maxTime = maxTime
    
    def calculate_instances(self):
        self.instances = max(1, ceil(self.estimatedTime / self.MAX_BLOCK_DURATION))

class Block:
    def __init__(self, task: Task, start: datetime.datetime, end: datetime.datetime):
        self.task = task
        self.start = start
        self.end = end

class Schedule:
    def __init__(self, WORK_START: int = 9, WORK_END: int = 21):
        self.WORK_START = 9
        self.WORK_END = 21    
        self.schedule: list[Block] = []
        self.noZones = [[NoZone(datetime.time(0, 0), datetime.time(self.WORK_START, 0)), NoZone(datetime.time(self.WORK_END, 0), datetime.time(23, 59))],
                        [NoZone(datetime.time(0, 0), datetime.time(self.WORK_START, 0)), NoZone(datetime.time(self.WORK_END, 0), datetime.time(23, 59))],
                        [NoZone(datetime.time(0, 0), datetime.time(self.WORK_START, 0)), NoZone(datetime.time(self.WORK_END, 0), datetime.time(23, 59))],
                        [NoZone(datetime.time(0, 0), datetime.time(self.WORK_START, 0)), NoZone(datetime.time(self.WORK_END, 0), datetime.time(23, 59))],
                        [NoZone(datetime.time(0, 0), datetime.time(self.WORK_START, 0)), NoZone(datetime.time(self.WORK_END, 0), datetime.time(23, 59))],
                        [NoZone(datetime.time(0, 0), datetime.time(self.WORK_START, 0)), NoZone(datetime.time(self.WORK_END, 0), datetime.time(23, 59))],
                        [NoZone(datetime.time(0, 0), datetime.time(self.WORK_START, 0)), NoZone(datetime.time(self.WORK_END, 0), datetime.time(23, 59))]]
    
    def copySchedule(self, schedule):
        self.schedule = schedule.getSchedule()

    def getSchedule(self):
        return self.schedule
    
    def addTask(self, task: Task, start = None, end = None):
        #adding manually
        if start != None and end != None:
            newBlock = Block(task, start, end)
            self.schedule.append(newBlock)
        #need automatic algorithm still

    def changeNoZones(self, newNoZones: list[list[NoZone]]):
        self.noZones = newNoZones
    
    def overlaps(self, a_start, a_end, b_start, b_end):
        return a_start < b_end and b_start < a_end

    def is_free(self, day_index, start, end):
        # NoZones
        for zone in self.noZones[day_index]:
            zone_start = datetime.combine(start.date(), zone.start)
            zone_end = datetime.combine(start.date(), zone.end)
            if self.overlaps(start, end, zone_start, zone_end):
                return False

        # Existing blocks
        for block in self.getSchedule():
            if block.start.date() == start.date():
                if self.overlaps(start, end, block.start, block.end):
                    return False

        return True


def schedule_task(task, schedule, num_days=31):
    task.calculate_instances()
    block_duration = task.estimatedTime / task.instances
    placed = 0

    for day_offset in range(num_days):
        if placed >= task.instances:
            break

        date = datetime.now().date() + timedelta(days=day_offset)
        day_index = day_offset % 7

        for hour in range(schedule.WORK_START, schedule.WORK_END):
            if placed >= task.instances:
                break

            start = datetime.combine(date, time(hour, 0))
            end = start + block_duration

            if schedule.is_free(day_index, start, end):
                schedule.addTask(task, start, end)
                placed += 1

    return placed == task.instances
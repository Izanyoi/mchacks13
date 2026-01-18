import datetime
from math import ceil

class NoZone:
    def __init__(self, start: datetime.time, end: datetime.time):
        self.start = start
        self.end = end       

class Task:
    def __init__(self, name: str, priority: int, dueDate: datetime.datetime, estimatedTime:datetime.timedelta, withFriend: bool, MAX_BLOCK_DURATION: datetime.timedelta = datetime.timedelta(hours=3)):
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

    def changeEstimatedTime(self, time: datetime.timedelta):
        self.estimatedTime = time

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
        self.WORK_START = WORK_START
        self.WORK_END = WORK_END
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
    
    def howBusy(self, day: datetime.date):
        total = 0
        for block in self.getSchedule():
            if block.start.date() == day:
                total += (block.end - block.start).seconds // 3600
        return total
    
    def totalTime(self, day: datetime.date):
        total = 0 
        for noZone in self.noZones[day.weekday()]:
            total += noZone.end.hour + ceil(noZone.end.minute/60) - noZone.start.hour
        return 24 - total

    def getValue(self, day: datetime.date, current, i, z=5):
        value = self.howBusy(day)
        m = abs((day - current).days)
        if m <= z:
            value += (0.2*i + 1)*value
        else:
            value *= 2
        return value

    def findMinDate(self, task):
        fraction: float = (task.priority - 1)/4
        current: datetime.date = datetime.date.today() + (task.dueDate.date() - datetime.date.today()) * fraction
            
        n = (task.dueDate.date() - datetime.date.today()).days

        minDate = datetime.date(3000,12,31)
        minValue = float("inf")
        for i in range(n+1):
            day = datetime.date.today() + i*datetime.timedelta(days=1)
            value = self.getValue(day, current, i)
            if value <= minValue and abs(day-current) < abs(minDate-current):
                minValue = value
                minDate = day
        return minValue, minDate
    
    def addBlock(self, task: Task, start = None, end = None):
        #adding manually
        if start != None and end != None:
            newBlock = Block(task, start, end)
            self.schedule.append(newBlock)
        #need automatic algorithm still
        else:
            if (task.estimatedTime.seconds//3600) >= 5:
                new_task = Task(task.name, task.priority, task.dueDate, datetime.timedelta(hours=3), 
                                task.withFriend, task.MAX_BLOCK_DURATION)
                task.changeEstimatedTime(task.estimatedTime - datetime.timedelta(hours=3))
                self.addBlock(new_task)
            
            minValue, minDate = self.findMinDate(task)
            
            for j in range(24 - task.estimatedTime.seconds // 3600):
                if self.is_free(minDate.weekday(), datetime.time(j, 0), datetime.time(j + task.estimatedTime.seconds // 3600, 0), minDate):
                    #need to change for edgecase of midnight for end date
                    self.schedule.append(Block(task, datetime.datetime(minDate.year, minDate.month, minDate.day, j), datetime.datetime(minDate.year, minDate.month, minDate.day, j + task.estimatedTime.seconds//3600)))
                    break

    def changeNoZones(self, newNoZones: list[list[NoZone]]):
        self.noZones = newNoZones
    
    def overlaps(self, a_start, a_end, b_start, b_end):
        return a_start < b_end and b_start < a_end

    def is_free(self, day_index, start, end, date):
        # NoZones
        for zone in self.noZones[day_index]:
            if self.overlaps(start, end, zone.start, zone.end):
                return False

        # Existing blocks
        for block in self.getSchedule():
            if block.start.date() == date:
                if self.overlaps(start, end, datetime.time(block.start.hour, block.start.minute),datetime.time(block.end.hour, block.end.minute)):
                    return False

        return True

def addTwinBlocks(schedule1: Schedule, schedule2: Schedule, task, start = None, end = None):
    #adding manually
    if start != None and end != None:
        newBlock = Block(task, start, end)
        schedule1.getSchedule.append(newBlock)
        schedule2.getSchedule.append(newBlock)
    #need automatic algorithm still
    else:
        if (task.estimatedTime.seconds//3600) >= 5:
            new_task = Task(task.name, task.priority, task.dueDate, datetime.timedelta(hours=3), 
                            task.withFriend, task.MAX_BLOCK_DURATION)
            task.changeEstimatedTime(task.estimatedTime - datetime.timedelta(hours=3))
            addTwinBlocks(schedule1, schedule2, new_task)
        
        fraction: float = (task.priority - 1)/4
        current: datetime.date = datetime.date.today() + (task.dueDate.date() - datetime.date.today()) * fraction
            
        n = (task.dueDate.date() - datetime.date.today()).days

        minDate = datetime.date(3000,12,31)
        minValue = float("inf")
        difference = float("inf")
        for i in range(n+1):
            day = datetime.date.today() + i*datetime.timedelta(days=1)
            value1 = schedule1.getValue(day, current, i)
            value2 = schedule2.getValue(day, current, i)
            if value1 + value2 < minValue:
                minDate= day
                minValue = value1 + value2
                difference = abs(value1-value2)
            elif value1 + value2 == minValue:
                if abs(value1-value2) < difference:
                    minDate= day
                    minValue = value1 + value2
                    difference = abs(value1-value2)
                elif  abs(value1-value2) == difference and abs(day-current) < abs(minDate-current):
                    minDate= day
                    minValue = value1 + value2
                    difference = abs(value1-value2)
            
        for j in range(24 - task.estimatedTime.seconds // 3600):
            if schedule1.is_free(minDate.weekday(), datetime.time(j, 0), datetime.time(j + task.estimatedTime.seconds // 3600, 0), minDate) and schedule2.is_free(minDate.weekday(), datetime.time(j, 0), datetime.time(j + task.estimatedTime.seconds // 3600, 0), minDate):
                #need to change for edgecase of midnight for end date
                schedule1.getSchedule().append(Block(task, datetime.datetime(minDate.year, minDate.month, minDate.day, j), datetime.datetime(minDate.year, minDate.month, minDate.day, j + task.estimatedTime.seconds//3600)))
                schedule2.getSchedule().append(Block(task, datetime.datetime(minDate.year, minDate.month, minDate.day, j), datetime.datetime(minDate.year, minDate.month, minDate.day, j + task.estimatedTime.seconds//3600)))
                break

#test cases:
task1 = Task("task1", 3, datetime.datetime(2026, 1, 25), datetime.timedelta(hours=3), False)
task2 = Task("task2", 4, datetime.datetime(2026, 1, 27), datetime.timedelta(hours=5), False)
task3 = Task("task3", 1, datetime.datetime(2026, 1, 25), datetime.timedelta(hours=2), False)

schedule1 = Schedule()
schedule2 = Schedule()
schedule1.addBlock(task1)
schedule1.addBlock(task2)
addTwinBlocks(schedule1, schedule2, task3)
print(schedule1.schedule[0].start, schedule1.schedule[0].end)
print(schedule1.schedule[1].start, schedule1.schedule[1].end)
print(schedule1.schedule[2].start, schedule1.schedule[2].end)
print(schedule1.schedule[3].start, schedule1.schedule[3].end)
print(schedule2.schedule[0].start, schedule2.schedule[0].end)

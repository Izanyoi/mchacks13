import datetime

class NoZone:
    def __init__(self, start: datetime.time, end: datetime.time):
        self.start = start
        self.end = end       

class Task:
    def __init__(self, name: str, priority: int, dueDate: datetime.datetime, estimatedTime:datetime.time, withFriend: bool):
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

    def advancedOptions(self, start: datetime.datetime, end: datetime.datetime, instances: int, minTime: datetime.time, maxTime: datetime.time):
        self.start = start
        self.end = end
        self.instances = instances
        #for minTime and maxTime, options (slider) needs to change depending of estimatedTime and instances
        self.minTime = minTime
        self.maxTime = maxTime

class Block:
    def __init__(self, task: Task, start: datetime.datetime, end: datetime.datetime):
        self.task = task
        self.start = start
        self.end = end

class Schedule:
    def __init__(self):
        self.schedule: list[Block] = []
        self.noZones = [[NoZone(datetime.time(0, 0), datetime(9, 0)), NoZone(datetime.time(21, 0), datetime(24, 0))],
                        [NoZone(datetime.time(0, 0), datetime(9, 0)), NoZone(datetime.time(21, 0), datetime(24, 0))],
                        [NoZone(datetime.time(0, 0), datetime(9, 0)), NoZone(datetime.time(21, 0), datetime(24, 0))],
                        [NoZone(datetime.time(0, 0), datetime(9, 0)), NoZone(datetime.time(21, 0), datetime(24, 0))],
                        [NoZone(datetime.time(0, 0), datetime(9, 0)), NoZone(datetime.time(21, 0), datetime(24, 0))],
                        [NoZone(datetime.time(0, 0), datetime(9, 0)), NoZone(datetime.time(21, 0), datetime(24, 0))],
                        [NoZone(datetime.time(0, 0), datetime(9, 0)), NoZone(datetime.time(21, 0), datetime(24, 0))]]
    
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

        
import datetime
from typing import Annotated, List
from math import ceil
import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, create_engine, select, or_
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from pydantic import BaseModel, EmailStr
import secrets

SECRET_KEY = "2e10a6460d9445a93593598e8b5c20fca5a5e28207060dc97ab5ffb8d333db9a"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(unique=True)
    hashed_password: str
    full_name: str | None = None

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str | None = None

class UserPublic(BaseModel):
    id: int
    username: str
    email: str
    full_name: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class TaskDB(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    priority: int
    due_date: datetime.datetime
    estimatedTime: datetime.timedelta
    with_friend: bool
    instances: int = 1

class BlockDB(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    task_id: int = Field(foreign_key="taskdb.id")
    start: datetime.datetime
    end: datetime.datetime

DEFAULT_MAX_BLOCK_DURATION = datetime.timedelta(hours=3)

class NoZone:
    def __init__(self, start: datetime.time, end: datetime.time):
        self.start = start
        self.end = end      

class Task:
    """Logical representation of a task for the algorithm"""
    def __init__(self, name: str, priority: int, dueDate: datetime.datetime, estimatedTime: datetime.timedelta, withFriend: bool, MAX_BLOCK_DURATION: datetime.timedelta = datetime.timedelta(hours=3)):
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
    
    def advancedOptions(self, start: datetime.datetime, end: datetime.datetime, minTime: datetime.time, maxTime: datetime.time, instances: int = 1):
        self.start = start
        self.end = end
        if instances:
            self.instances = instances
        self.instances = instances
        self.minTime = minTime
        self.maxTime = maxTime

class Schedule:
    def __init__(self, session: Session, user_id: int, WORK_START: int = 9, WORK_END: int = 21):
        self.session = session
        self.user_id = user_id
        self.WORK_START = WORK_START
        self.WORK_END = WORK_END
        
        self.schedule = self.session.exec(select(BlockDB).where(BlockDB.user_id == user_id)).all()
        
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
    
    def overlaps(self, a_start, a_end, b_start, b_end):
        return a_start < b_end and b_start < a_end

    def is_free(self, day_index, start, end):
        start_time = start.time()
        end_time = end.time()
        
        # NoZones
        for zone in self.noZones[day_index]:
            if self.overlaps(start_time, end_time, zone.start, zone.end):
                return False

        # Existing blocks
        for block in self.getSchedule():
            if block.start.date() == start.date():
                if self.overlaps(start, end, block.start, block.end):
                    return False

        return True
    
    def totalTime(self, day: datetime.date):
        total = 0 
        for noZone in self.noZones[day.weekday()]:
            total += noZone.end.hour + ceil(noZone.end.minute/60) - noZone.start.hour
        return 24 - total
    
    def getValue(self, check_date: datetime.date, optimal_date: datetime.date, index: int):
        value = self.howBusy(check_date)
        if index <= 5:
            value += (0.2 * index + 1) * value
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

    def addBlock(self, task: Task, task_db_id: int):
        #adding manually
        if task.start is not None and task.end is not None:
            newBlock = BlockDB(
                user_id=self.user_id,
                task_id=task_db_id,
                start=task.start-datetime.timedelta(hours=5),
                end=task.end-datetime.timedelta(hours=5)
            )
            self.session.add(newBlock)
            self.session.commit()
            self.session.refresh(newBlock)
            self.schedule.append(newBlock)
            return True

        #Automatic Algorithm
        else:
            if (task.estimatedTime.seconds//3600) >= 5:
                new_task = Task(task.name, task.priority, task.dueDate, datetime.timedelta(hours=3), 
                                task.withFriend, task.MAX_BLOCK_DURATION)
                task.changeEstimatedTime(task.estimatedTime - datetime.timedelta(hours=3))
                self.addBlock(new_task)
            
            minValue, minDate = self.findMinDate(task)

        duration = task.estimatedTime.seconds // 3600

        for j in range(24 - duration):
            start_dt = datetime.datetime.combine(minDate, datetime.time(j, 0)) 
            end_dt = datetime.datetime.combine(minDate, datetime.time(j + duration, 0))

            if self.is_free(minDate.weekday(), start_dt, end_dt):
                newBlock = BlockDB(
                    user_id=self.user_id,
                    task_id=task_db_id,
                    start=start_dt,
                    end=end_dt
                )
                self.session.add(newBlock)
                self.session.commit()
                self.session.refresh(newBlock)
                self.schedule.append(newBlock)
                return True
        
        return False

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)

def get_password_hash(password):
    return password_hash.hash(password)

def create_access_token(data: dict, expires_delta: datetime.timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (expires_delta or datetime.timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

def get_user_by_username(session: Session, username: str):
    statement = select(User).where(User.username == username)
    return session.exec(statement).first()

def authenticate_user(session: Session, username: str, password: str):
    user = get_user_by_username(session, username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(session: SessionDep, token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    
    user = get_user_by_username(session, token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.post("/register", response_model=UserPublic)
def register_user(user_in: UserCreate, session: SessionDep):
    if get_user_by_username(session, user_in.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password)
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep
):
    user = authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/users/me/", response_model=UserPublic)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return current_user

@app.get("/health")
def health_check():
    return {"status": "ok"}

class TaskInput(BaseModel):
    name: str
    priority: int
    dueDate: datetime.datetime
    estimatedTime: datetime.timedelta
    withFriend: bool
    start: datetime.datetime | None = None
    end: datetime.datetime | None = None
    instances: int | None = 1
    minTime: datetime.time | None = None 
    maxTime: datetime.time | None = None

@app.patch("/users/me/name", response_model=UserPublic)
async def update_user_name(
    new_name: str, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    current_user.full_name = new_name
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

@app.patch("/users/me/email", response_model=UserPublic)
async def update_user_email(
    new_email: EmailStr,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    current_user.email = new_email
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

@app.post("/tasks/")
def add_task(
    task_in: TaskInput,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    db_task = TaskDB(
        user_id=current_user.id,
        name=task_in.name,
        priority=task_in.priority,
        due_date=task_in.dueDate,
        estimatedTime=task_in.estimatedTime,
        with_friend=task_in.withFriend,
        instances=task_in.instances or 1
    )
    session.add(db_task)
    session.commit()
    session.refresh(db_task)

    task_logic = Task(
        name=task_in.name,
        priority=task_in.priority,
        dueDate=task_in.dueDate,
        estimatedTime=task_in.estimatedTime,
        withFriend=task_in.withFriend
    )

    task_logic.advancedOptions(
        start=task_in.start,
        end=task_in.end,
        instances=task_in.instances,
        minTime=task_in.minTime,
        maxTime=task_in.maxTime
    )

    schedule_engine = Schedule(session=session, user_id=current_user.id)

    success = schedule_engine.addBlock(task_logic, task_db_id=db_task.id)

    if not success:
        session.delete(db_task)
        session.commit()
        raise HTTPException(
            status_code=400,
            detail="Error scheduling. Could not find a valid time slot."
        )

    return {"message": f"Task '{task_in.name}' scheduled successfully", "task_id": db_task.id}

@app.delete("/tasks/block/{block_id}")
async def remove_block(block_id: int, current_user: Annotated[User, Depends(get_current_active_user)], session: SessionDep):
    statement = select(BlockDB).where(
        BlockDB.user_id == current_user.id,
        BlockDB.id == block_id
    )
    block = session.exec(statement).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    session.delete(block)
    session.commit()
    return {"status": "deleted"}

@app.get("/schedule/")
def get_schedule(
    current_user: Annotated[User, Depends(get_current_active_user)], 
    session: SessionDep
):
    statement = select(BlockDB, TaskDB).join(TaskDB).where(BlockDB.user_id == current_user.id)
    results = session.exec(statement).all()

    output = []
    for block, task in results:
        output.append({
            "block_id": block.id,
            "task_id": block.task_id,
            "start": block.start.isoformat(),
            "end": block.end.isoformat(),
            "title": task.name,
            "priority": task.priority
        })

    return output

class BlockUpdate(BaseModel):
    start: datetime.datetime | None = None
    end: datetime.datetime | None = None

@app.patch("/tasks/block/{block_id}")
async def update_block(
    block_id: int, 
    block_update: BlockUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)], 
    session: SessionDep
):
    statement = select(BlockDB).where(
        BlockDB.user_id == current_user.id,
        BlockDB.id == block_id
    )
    block = session.exec(statement).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    if block_update.start:
        block.start = block_update.start
    if block_update.end:
        block.end = block_update.end
        
    session.add(block)
    session.commit()
    session.refresh(block)
    return block

class ShareLink(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    token: str = Field(index=True, unique=True)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)

#function to generate a link that you can share to let a friend see your availability so that we can find the free time in common
@app.post("/share/generate-link")
def generate_share_link(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    existing_link = session.exec(select(ShareLink).where(ShareLink.user_id == current_user.id)).first()
    
    if existing_link:
        expiration_time = existing_link.created_at + datetime.timedelta(days=2)
        if datetime.datetime.now() > expiration_time:
            session.delete(existing_link)
            session.commit()
        else:
            return {"share_url": f"http://localhost:5173/calendar/view/{existing_link.token}", "expires_at": expiration_time}

    token = secrets.token_urlsafe(16)
    
    new_link = ShareLink(user_id=current_user.id, token=token)
    session.add(new_link)
    session.commit()
    
    expires_at = new_link.created_at + datetime.timedelta(days=2)
    
    return {"share_url": f"http://localhost:5173/calendar/view/{token}", "expires_at": expires_at}

# We get a black and white schedule so that we can use it to find time in common
@app.get("/share/view/{token}")
def view_shared_calendar(
    token: str,
    date_start: datetime.date, 
    date_end: datetime.date,
    session: SessionDep
):
    link = session.exec(select(ShareLink).where(ShareLink.token == token)).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invalid link")

    if datetime.datetime.now() > (link.created_at + datetime.timedelta(days=2)):
        session.delete(link)
        session.commit()
        raise HTTPException(status_code=410, detail="This link has expired.")

    user = session.get(User, link.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    statement = select(BlockDB).where(
        BlockDB.user_id == user.id,
        BlockDB.start >= datetime.datetime.combine(date_start, datetime.time(0,0)),
        BlockDB.end <= datetime.datetime.combine(date_end, datetime.time(23,59))
    )
    blocks = session.exec(statement).all()

    public_schedule = []
    for block in blocks:
        public_schedule.append({
            "start": block.start.isoformat(),
            "end": block.end.isoformat(),
            "status": "busy"
        })

    return {
        "username": user.username,
        "schedule": public_schedule
    }

@app.post("/share/view/{token}")
def addTwinBlocks(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: str,
    session: SessionDep,
    task_in: TaskInput
):
    link = session.exec(select(ShareLink).where(ShareLink.token == token)).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invalid link")

    if datetime.datetime.now() > (link.created_at + datetime.timedelta(days=2)):
        session.delete(link)
        session.commit()
        raise HTTPException(status_code=410, detail="This link has expired.")

    friend = session.get(User, link.user_id)
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    
    if friend.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot share a task with yourself.")
    
    #Me
    task_db_me = TaskDB(
        user_id=current_user.id,
        name=task_in.name,
        priority=task_in.priority,
        due_date=task_in.dueDate,
        estimatedTime=task_in.estimatedTime,
        with_friend=True,
        instances=task_in.instances or 1
    )
    session.add(task_db_me)

    #Friend
    task_db_friend = TaskDB(
        user_id=friend.id,
        name=f"{task_in.name} (Shared)",
        priority=task_in.priority,
        due_date=task_in.dueDate,
        estimatedTime=task_in.estimatedTime,
        with_friend=True,
        instances=task_in.instances or 1
    )
    session.add(task_db_friend)
    session.commit()
    session.refresh(task_db_me)
    session.refresh(task_db_friend)

    my_schedule = Schedule(session=session, user_id=current_user.id)
    friend_schedule = Schedule(session=session, user_id=friend.id)

    if task_in.start != None and task_in.end != None:
        block_me = BlockDB(user_id=current_user.id, task_id=task_db_me.id, start=task_in.start, end=task_in.end)
        block_friend = BlockDB(user_id=friend.id, task_id=task_db_friend.id, start=task_in.start, end=task_in.end)
        session.add(block_me)
        session.add(block_friend)
        session.commit()
        return {"status": "Scheduled manually"}

    fraction: float = (task_in.priority - 1) / 4
    current: datetime.date = datetime.date.today() + (task_in.dueDate.date() - datetime.date.today()) * fraction
        
    n = (task_in.dueDate.date() - datetime.date.today()).days

    minDate = datetime.date(3000,12,31)
    minValue = float("inf")
    difference = float("inf")
    for i in range(n+1):
        day = datetime.date.today() + i*datetime.timedelta(days=1)
        value1 = my_schedule.getValue(day, current, i)
        value2 = friend_schedule.getValue(day, current, i)
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
    
    for j in range(24 - task_in.estimatedTime.seconds // 3600):
            start_dt = datetime.datetime.combine(minDate, datetime.time(j, 0))
            end_dt = datetime.datetime.combine(minDate, datetime.time(j + task_in.estimatedTime.seconds // 3600, 0))
            if my_schedule.is_free(minDate.weekday(), start_dt, end_dt) and friend_schedule.is_free(minDate.weekday(), start_dt, end_dt):
                #need to change for edgecase of midnight for end date
                start_dt = datetime.datetime(minDate.year, minDate.month, minDate.day, j)
                end_dt = datetime.datetime(minDate.year, minDate.month, minDate.day, j + task_in.estimatedTime.seconds//3600)

                block_me = BlockDB(
                    user_id=current_user.id, 
                    task_id=task_db_me.id, 
                    start=start_dt, 
                    end=end_dt
                )
                block_friend = BlockDB(
                    user_id=friend.id, 
                    task_id=task_db_friend.id, 
                    start=start_dt, 
                    end=end_dt
                )

                session.add(block_me)
                session.add(block_friend)
                session.commit()

                return {"status": "Scheduled automatically", "start": start_dt, "end": end_dt}
from datetime import time, datetime, timedelta, timezone, date
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
    due_date: datetime
    estimated_minutes: int
    with_friend: bool
    instances: int = 1

class BlockDB(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    task_id: int = Field(foreign_key="taskdb.id")
    start: datetime
    end: datetime

DEFAULT_MAX_BLOCK_DURATION = timedelta(hours=3)

class NoZone:
    def __init__(self, start: time, end: time):
        self.start = start
        self.end = end      

class Task:
    """Logical representation of a task for the algorithm"""
    def __init__(self, name: str, priority: int, dueDate: datetime, estimatedTime: timedelta, withFriend: bool, MAX_BLOCK_DURATION: timedelta = timedelta(hours=3)):
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
    
    
    def getSchedule(self):
        return self.schedule
    
    def howBusy(self, day: date):
        total = 0
        for block in self.getSchedule():
            if block.start.date() == day:
                total += (block.end - block.start).seconds // 3600
        return total
    
    def overlaps(self, a_start, a_end, b_start, b_end):
        return a_start < b_end and b_start < a_end

    def is_free(self, day_index, start, end):
        # NoZones
        for zone in self.noZones[day_index]:
            if self.overlaps(start, end, zone.start, zone.end):
                return False

        # Existing blocks
        for block in self.getSchedule():
            if block.start.date() == start.date():
                if self.overlaps(start, end, block.start, block.end):
                    return False

        return True

    def addBlock(self, task: Task, task_db_id: int):
        #adding manually
        if task.start is not None and task.end is not None:
            newBlock = BlockDB(
                user_id=self.user_id,
                task_id=task_db_id,
                start=task.start,
                end=task.end
            )
            self.session.add(newBlock)
            self.session.commit()
            self.session.refresh(newBlock)
            self.schedule.append(newBlock)
            return True

        #Automatic Algorithm
        half: datetime.timedelta = (task.dueDate.date() - datetime.date.today())/2
        current: datetime.date = datetime.date.today() + half

        minDate = current
        minValue = self.howBusy(current)

        for i in range(1,16):
            value = self.howBusy(current + i*datetime.timedelta(days=1))
            if i <= 5:
                value += (0.2*i + 1)*value
            else:
                value *= 2
            if value < minValue:
                minValue = value
                minDate = current + i*datetime.timedelta(days=1)

        for i in range(1,16):
            value = self.howBusy(current - i*datetime.timedelta(days=1))
            if i <= 5:
                value += (0.2*i + 1)*value
            else:
                value *= 2
            if value < minValue:
                minValue = value
                minDate = current - i*datetime.timedelta(days=1)

        duration = task.estimatedTime.seconds // 3600

        for j in range(24 - duration):
            start_dt = datetime.combine(minDate, time(j, 0)) 
            end_dt = datetime.combine(minDate, time(j + duration, 0))

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

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
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
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
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
    dueDate: datetime
    estimatedTimeMinutes: int
    withFriend: bool
    start: datetime | None = None
    end: datetime | None = None
    instances: int | None = 1
    minTime: str | None = None 
    maxTime: str | None = None

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
        estimated_minutes=task_in.estimatedTimeMinutes,
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
        estimatedTime=timedelta(minutes=task_in.estimatedTimeMinutes),
        withFriend=task_in.withFriend
    )
    if task_in.start: task_logic.start = task_in.start
    if task_in.end: task_logic.end = task_in.end

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
            "title": task.name
        })

    return output
from fastapi.testclient import TestClient
from app.main import app, create_db_and_tables

create_db_and_tables()

client = TestClient(app)

def register_and_login():
    response = client.post("/register", json={
        "full_name": "lol",
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code in (200, 400)

    response = client.post(
        "/token",
        data={
            "username": "testuser",
            "password": "password123"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_add_task_auto():
    headers = register_and_login()

    response = client.post(
        "/tasks/",
        headers=headers,
        json={
            "name": "Study Math",
            "priority": 3,
            "dueDate": "2026-02-01T23:59:00",
            "estimatedTimeMinutes": 120,
            "withFriend": False
        }
    )

    assert response.status_code == 200
    body = response.json()
    assert "task_id" in body


def test_add_task_manual():
    headers = register_and_login()

    response = client.post(
        "/tasks/",
        headers=headers,
        json={
            "name": "Gym",
            "priority": 1,
            "dueDate": "2026-02-01T23:59:00",
            "estimatedTimeMinutes": 60,
            "withFriend": False,
            "start": "2026-01-20T18:00:00",
            "end": "2026-01-20T19:00:00"
        }
    )

    assert response.status_code == 200


def test_get_schedule():
    headers = register_and_login()

    response = client.get("/schedule/", headers=headers)
    assert response.status_code == 200

    schedule = response.json()
    assert isinstance(schedule, list)

    if schedule:
        block = schedule[0]
        assert "block_id" in block
        assert "start" in block
        assert "end" in block


def test_delete_block():
    headers = register_and_login()

    response = client.get("/schedule/", headers=headers)
    blocks = response.json()

    if not blocks:
        return

    block_id = blocks[0]["block_id"]

    response = client.delete(f"/tasks/block/{block_id}", headers=headers)
    assert response.status_code == 200

def test_update_block():
    headers = register_and_login()
    response = client.post(
        "/tasks/",
        headers=headers,
        json={
            "name": "To be updated",
            "priority": 1,
            "dueDate": "2026-02-01T23:59:00",
            "estimatedTimeMinutes": 60,
            "withFriend": False,
            "start": "2026-01-25T10:00:00",
            "end": "2026-01-25T11:00:00"
        }
    )
    assert response.status_code == 200

    schedule_res = client.get("/schedule/", headers=headers)
    block_id = schedule_res.json()[0]["block_id"]

    new_start = "2026-01-25T12:00:00"
    new_end = "2026-01-25T13:00:00"

    update_res = client.patch(
        f"/tasks/block/{block_id}",
        headers=headers,
        json={"start": new_start, "end": new_end}
    )

    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["start"] == new_start
    assert updated_data["end"] == new_end


def test_share_calendar_flow():
    headers = register_and_login()

    client.post(
        "/tasks/",
        headers=headers,
        json={
            "name": "Secret Meeting",
            "priority": 1,
            "dueDate": "2026-02-01T23:59:00",
            "estimatedTimeMinutes": 60,
            "withFriend": False,
            "start": "2026-01-25T15:00:00",
            "end": "2026-01-25T16:00:00"
        }
    )

    gen_res = client.post("/share/generate-link", headers=headers)
    assert gen_res.status_code == 200
    data = gen_res.json()
    assert "share_url" in data
    
    token = data["share_url"].split("/")[-1]
    assert len(token) > 0

    params = {
        "date_start": "2026-01-01",
        "date_end": "2026-02-01"
    }
    view_res = client.get(f"/share/view/{token}", params=params)
    
    assert view_res.status_code == 200
    view_data = view_res.json()

    assert view_data["username"] == "testuser"
    assert len(view_data["schedule"]) > 0
    
    first_block = view_data["schedule"][0]
    assert first_block["status"] == "busy"
    assert "Secret Meeting" not in str(first_block)
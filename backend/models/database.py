import json
import os
from datetime import datetime

DB_FILE = "db.json"

def init_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f:
            json.dump({"interactions": []}, f)

def read_db():
    with open(DB_FILE, "r") as f:
        return json.load(f)

def write_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2, default=str)

def get_next_id():
    data = read_db()
    interactions = data["interactions"]
    if not interactions:
        return 1
    return max(i["id"] for i in interactions) + 1

def create_interaction(interaction_data: dict):
    data = read_db()
    interaction_data["id"] = get_next_id()
    interaction_data["created_at"] = str(datetime.utcnow())
    interaction_data["updated_at"] = str(datetime.utcnow())
    data["interactions"].append(interaction_data)
    write_db(data)
    return interaction_data

def get_interactions():
    return read_db()["interactions"]

def get_interaction(id: int):
    data = read_db()
    return next((i for i in data["interactions"] if i["id"] == id), None)

def update_interaction(id: int, updates: dict):
    data = read_db()
    for i, item in enumerate(data["interactions"]):
        if item["id"] == id:
            data["interactions"][i].update(updates)
            data["interactions"][i]["updated_at"] = str(datetime.utcnow())
            write_db(data)
            return data["interactions"][i]
    return None

def delete_interaction(id: int):
    data = read_db()
    data["interactions"] = [i for i in data["interactions"] if i["id"] != id]
    write_db(data)
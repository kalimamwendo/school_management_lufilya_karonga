from __future__ import annotations

import csv
import json
from datetime import date, datetime
from io import StringIO
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend import supabase_store


BASE_DIR = Path(__file__).resolve().parent
try:
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR.parent / ".env")
except ImportError:
    pass
DATA_FILE = BASE_DIR / "school_data.json"

SENIOR_SUBJECTS = [
    "English",
    "Chichewa",
    "Mathematics",
    "Biology",
    "Chemistry",
    "Physics",
    "Geography",
    "History",
    "Social & Life Studies",
    "Bible Knowledge",
    "Agriculture",
    "Computer Studies",
    "Business Studies",
    "Home Economics",
    "Technical Drawing",
]

JUNIOR_SUBJECTS = [
    "English Language",
    "Chichewa",
    "Mathematics",
    "Biology",
    "Chemistry",
    "Physics",
    "Geography",
    "History",
    "Social & Life Studies",
    "Bible Knowledge",
    "Agriculture",
    "Computer Studies",
    "Business Studies",
    "Home Economics",
    "Technical Studies",
]

SUBJECTS = list(dict.fromkeys(JUNIOR_SUBJECTS + SENIOR_SUBJECTS))

TERMS = ["Term 1", "Term 2", "Term 3"]
FORMS = ["Form 1", "Form 2", "Form 3", "Form 4"]


def current_academic_year() -> str:
    year = date.today().year
    return f"{year}-{year - 1}"


class TeacherIn(BaseModel):
    full_name: str = Field(min_length=2)
    phone: str = ""
    email: str | None = None
    subjects: list[str] = Field(default_factory=list)
    junior_subjects: list[str] = Field(default_factory=list)
    senior_subjects: list[str] = Field(default_factory=list)
    classes: list[str] = Field(default_factory=list)
    activity_roles: list[str] = Field(default_factory=list)
    password: str = Field(default="teacher123", min_length=4)


class StudentIn(BaseModel):
    full_name: str = Field(min_length=2)
    date_of_birth: str
    village: str
    form: str
    sex: str
    guardian_phone: str
    guardian_email: str | None = None
    health_status: str = "No special need"
    special_need: bool = False
    registration_year: int | None = None


class PaymentIn(BaseModel):
    amount: float = Field(gt=0)
    note: str = "Fees payment"


class ScoreIn(BaseModel):
    student_id: str
    subject: str
    term: str
    academic_year: str
    score: float = Field(ge=0, le=100)


class AnnouncementIn(BaseModel):
    title: str = Field(min_length=2)
    message: str = Field(min_length=2)
    audience: str = "School"


class LoginIn(BaseModel):
    email: str
    password: str


class PasswordResetIn(BaseModel):
    email: str
    new_password: str = Field(min_length=4)


class ChangePasswordIn(BaseModel):
    user_id: str
    current_password: str
    new_password: str = Field(min_length=4)


class RoleAssignmentIn(BaseModel):
    teacher_id: str
    role: str
    password: str = Field(default="role123", min_length=4)


def seed_data() -> dict[str, Any]:
    db = {
        "teachers": [
            {
                "id": "T001",
                "full_name": "Ambonishe Moreen",
                "phone": "0999 111 222",
                "email": "moreen@lufilya.edu.mw",
                "subjects": ["English", "English Language", "Chichewa"],
                "junior_subjects": ["English Language", "Chichewa"],
                "senior_subjects": ["English", "Chichewa"],
                "classes": ["Form 1", "Form 2"],
                "activity_roles": ["Debate patron", "Report reviewer"],
            },
            {
                "id": "T002",
                "full_name": "Mphatso Banda",
                "phone": "0888 222 333",
                "email": "mphatso@lufilya.edu.mw",
                "subjects": ["Mathematics", "Physics"],
                "junior_subjects": ["Mathematics", "Physics"],
                "senior_subjects": ["Mathematics", "Physics"],
                "classes": ["Form 1", "Form 3"],
                "activity_roles": ["Exams officer"],
            },
        ],
        "students": [
            {
                "id": "S001",
                "reg_number": "LIF2024001",
                "full_name": "Tadala Phiri",
                "date_of_birth": "2010-05-12",
                "village": "Kaporo",
                "form": "Form 1",
                "sex": "Female",
                "guardian_phone": "0995 123 456",
                "guardian_email": "guardian1@example.com",
                "health_status": "No special need",
                "special_need": False,
                "registration_year": 2024,
            },
            {
                "id": "S002",
                "reg_number": "LIF2024002",
                "full_name": "Blessings Mwale",
                "date_of_birth": "2009-09-04",
                "village": "Lupembe",
                "form": "Form 1",
                "sex": "Male",
                "guardian_phone": "0881 444 555",
                "guardian_email": "guardian2@example.com",
                "health_status": "Asthma medication kept by guardian",
                "special_need": True,
                "registration_year": 2024,
            },
            {
                "id": "S003",
                "reg_number": "LIF2025001",
                "full_name": "Memory Gondwe",
                "date_of_birth": "2011-01-22",
                "village": "Karonga",
                "form": "Form 1",
                "sex": "Female",
                "guardian_phone": "0998 777 333",
                "guardian_email": "guardian3@example.com",
                "health_status": "No special need",
                "special_need": False,
                "registration_year": 2025,
            },
        ],
        "fees": {
            "S001": {"required": 480000, "paid": 300000, "history": [{"date": "2026-01-10", "amount": 300000, "note": "Opening payment"}]},
            "S002": {"required": 480000, "paid": 480000, "history": [{"date": "2026-01-12", "amount": 480000, "note": "Full payment"}]},
            "S003": {"required": 480000, "paid": 120000, "history": [{"date": "2026-02-01", "amount": 120000, "note": "Part payment"}]},
        },
        "scores": [],
        "announcements": [
            {
                "id": "A001",
                "title": "Uniform",
                "message": "Make sure that every student is putting on required school uniform.",
                "audience": "Students and guardians",
                "created_at": "2026-05-18T08:00:00",
            }
        ],
        "users": [
            {"id": "U001", "role": "admin", "name": "System Admin", "email": "lumbani@gmail.com", "password": "lum2004", "entity_id": None},
            {"id": "U002", "role": "bursar", "name": "School Bursar", "email": "bursar@lufilya.edu.mw", "password": "bursar123", "entity_id": None},
            {"id": "U003", "role": "headteacher", "name": "Headteacher", "email": "head@lufilya.edu.mw", "password": "head123", "entity_id": None},
            {"id": "U004", "role": "teacher", "name": "Ambonishe Moreen", "email": "moreen@lufilya.edu.mw", "password": "teacher123", "entity_id": "T001"},
            {"id": "U005", "role": "teacher", "name": "Mphatso Banda", "email": "mphatso@lufilya.edu.mw", "password": "teacher123", "entity_id": "T002"},
        ],
        "activities": [],
        "settings": {
            "school_name": "LUFILYA COMMUNITY DAY SECONDARY SCHOOL",
            "box": "BOX 3, KAPORO, KARONGA",
            "phone": "0889625523/0995871887",
            "email": "lufilyacdsshed@gmail.com",
            "academic_year": current_academic_year(),
            "next_term_begins": "2026-01-05",
            "fees_required": 480000,
            "boarding_fees": 240000,
            "account_name": "LUFILYA OPEN SECONDARY SCHOOL",
            "bank": "FDH",
            "account_number": "0",
            "account_type": "CURRENT",
            "branch": "KARONGA",
        },
    }
    log_activity(db, "system", "System", "Seeded initial school data")
    return db


def load_db() -> dict[str, Any]:
    if supabase_store.enabled():
        db = supabase_store.load_state()
        if db is None:
            db = seed_data()
            seed_scores(db)
            save_db(db)
            return db
        if migrate_db(db):
            save_db(db)
        return db
    if not DATA_FILE.exists():
        db = seed_data()
        save_db(db)
        seed_scores(db)
        save_db(db)
        return db
    db = json.loads(DATA_FILE.read_text(encoding="utf-8-sig"))
    if migrate_db(db):
        save_db(db)
    return db


def save_db(db: dict[str, Any]) -> None:
    if supabase_store.enabled():
        supabase_store.save_state(db)
        return
    DATA_FILE.write_text(json.dumps(db, indent=2), encoding="utf-8")


def log_activity(db: dict[str, Any], role: str, actor: str, action: str) -> None:
    activities = db.setdefault("activities", [])
    activities.insert(
        0,
        {
            "id": next_id(activities, "ACT"),
            "role": role,
            "actor": actor,
            "action": action,
            "created_at": datetime.now().isoformat(timespec="seconds"),
        },
    )
    del activities[100:]


def migrate_db(db: dict[str, Any]) -> bool:
    changed = False
    db.setdefault("activities", [])
    users = db.setdefault("users", [])
    default_users = [
        {"role": "admin", "name": "System Admin", "email": "lumbani@gmail.com", "password": "lum2004", "entity_id": None},
        {"role": "bursar", "name": "School Bursar", "email": "bursar@lufilya.edu.mw", "password": "bursar123", "entity_id": None},
        {"role": "headteacher", "name": "Headteacher", "email": "head@lufilya.edu.mw", "password": "head123", "entity_id": None},
    ]
    for default_user in default_users:
        if not any(user.get("role") == default_user["role"] for user in users):
            users.append({"id": next_id(users, "U"), **default_user})
            changed = True
    admin_user = next((user for user in users if user.get("role") == "admin"), None)
    if admin_user and (admin_user.get("email") != "lumbani@gmail.com" or admin_user.get("password") == "admin123"):
        admin_user["email"] = "lumbani@gmail.com"
        admin_user["password"] = "lum2004"
        admin_user["name"] = admin_user.get("name") or "System Admin"
        changed = True
    settings = db.setdefault("settings", {})
    old_academic_year = settings.get("academic_year")
    new_academic_year = current_academic_year()
    if old_academic_year != new_academic_year:
        settings["academic_year"] = new_academic_year
        for score in db.get("scores", []):
            if score.get("academic_year") == old_academic_year:
                score["academic_year"] = new_academic_year
        changed = True
    subject_renames = {
        "Bible Knowledge (Religious Studies)": "Bible Knowledge",
        "Social and Life Skills": "Social & Life Studies",
        "Social and Development Studies (SDS)": "Social & Life Studies",
        "Life Skills": "Social & Life Studies",
        "Computer Studies (ICT)": "Computer Studies",
        "Fashion and Fabrics": "Home Economics",
        "Woodwork": "Technical Studies",
        "Metalwork": "Technical Studies",
    }
    for teacher in db.get("teachers", []):
        updated = [subject_renames.get(subject, subject) for subject in teacher.get("subjects", [])]
        if "English" in updated and "English Language" not in updated:
            updated.append("English Language")
        if updated != teacher.get("subjects", []):
            teacher["subjects"] = updated
            changed = True
        if "junior_subjects" not in teacher:
            teacher["junior_subjects"] = [subject for subject in updated if subject in JUNIOR_SUBJECTS]
            changed = True
        if "senior_subjects" not in teacher:
            teacher["senior_subjects"] = [subject for subject in updated if subject in SENIOR_SUBJECTS]
            changed = True
        combined = list(dict.fromkeys(teacher.get("junior_subjects", []) + teacher.get("senior_subjects", [])))
        if teacher.get("subjects") != combined:
            teacher["subjects"] = combined
            changed = True
        email = teacher.get("email")
        if email and not any(user.get("role") == "teacher" and user.get("entity_id") == teacher["id"] for user in users):
            users.append({"id": next_id(users, "U"), "role": "teacher", "name": teacher["full_name"], "email": email, "password": "teacher123", "entity_id": teacher["id"]})
            changed = True
    for score in db.get("scores", []):
        subject = score.get("subject")
        if subject in subject_renames:
            score["subject"] = subject_renames[subject]
            changed = True
        student = next((item for item in db.get("students", []) if item["id"] == score.get("student_id")), None)
        if student and exam_level_for(student.get("form", "")) == "JCE" and score.get("subject") == "English":
            score["subject"] = "English Language"
            changed = True
    return changed


def seed_scores(db: dict[str, Any]) -> None:
    if db["scores"]:
        return
    values = {
        "S001": [82, 61, 79, 70, 61, 66, 76, 72, 84, 68, 64, 74, 77, 69, 63],
        "S002": [67, 51, 71, 49, 51, 46, 53, 60, 62, 54, 58, 59, 55, 52, 48],
        "S003": [75, 38, 52, 42, 38, 37, 39, 48, 57, 43, 45, 50, 47, 41, 35],
    }
    for student_id, scores in values.items():
        for subject, score in zip(JUNIOR_SUBJECTS, scores, strict=True):
            db["scores"].append(
                {
                    "student_id": student_id,
                    "subject": subject,
                    "term": "Term 2",
                    "academic_year": db["settings"]["academic_year"],
                    "score": score,
                }
            )


def next_id(items: list[dict[str, Any]], prefix: str) -> str:
    return f"{prefix}{len(items) + 1:03d}"


def next_reg_number(db: dict[str, Any], year: int) -> str:
    count = sum(1 for student in db["students"] if student.get("registration_year") == year)
    return f"LIF{year}{count + 1:03d}"


def exam_level_for(form: str) -> str:
    return "MSCE" if form in {"Form 3", "Form 4"} else "JCE"


def subjects_for_form(form: str) -> list[str]:
    return SENIOR_SUBJECTS if exam_level_for(form) == "MSCE" else JUNIOR_SUBJECTS


def grade_for(score: float, level: str = "JCE") -> dict[str, str]:
    if level == "MSCE":
        if score >= 80:
            return {"grade": "1", "remark": "Distinction"}
        if score >= 70:
            return {"grade": "2", "remark": "Distinction"}
        if score >= 65:
            return {"grade": "3", "remark": "Credit"}
        if score >= 60:
            return {"grade": "4", "remark": "Credit"}
        if score >= 55:
            return {"grade": "5", "remark": "Credit"}
        if score >= 50:
            return {"grade": "6", "remark": "Credit"}
        if score >= 45:
            return {"grade": "7", "remark": "Pass"}
        if score >= 40:
            return {"grade": "8", "remark": "Pass"}
        return {"grade": "9", "remark": "Fail"}
    if score >= 80:
        return {"grade": "A", "remark": "Excellent"}
    if score >= 70:
        return {"grade": "B", "remark": "Very Good"}
    if score >= 55:
        return {"grade": "C", "remark": "Good"}
    if score >= 40:
        return {"grade": "D", "remark": "Average / Pass"}
    return {"grade": "F", "remark": "Fail"}


def english_subject_for_level(level: str) -> str:
    return "English" if level == "MSCE" else "English Language"


def overall_result(rows: list[dict[str, Any]], level: str) -> dict[str, Any]:
    if level == "MSCE":
        passed_rows = [row for row in rows if row["grade"].isdigit() and int(row["grade"]) <= 8]
        english_passed = any(row["subject"] == "English" and row["grade"].isdigit() and int(row["grade"]) <= 8 for row in rows)
        best_six = sorted((int(row["grade"]) for row in passed_rows))[:6]
        points = sum(best_six) if len(best_six) == 6 else None
        return {
            "result": "Pass" if len(best_six) == 6 and english_passed else "Fail",
            "points": points,
            "passed_subjects": len(passed_rows),
            "english_passed": english_passed,
        }
    passed_subjects = [row for row in rows if row["grade"] in {"A", "B", "C", "D"}]
    english_passed = any(row["subject"] == "English Language" and row["grade"] in {"A", "B", "C", "D"} for row in rows)
    return {
        "result": "Pass" if len(passed_subjects) >= 6 and english_passed else "Fail",
        "points": None,
        "passed_subjects": len(passed_subjects),
        "english_passed": english_passed,
    }


def student_fee(db: dict[str, Any], student_id: str) -> dict[str, Any]:
    fee = db["fees"].setdefault(student_id, {"required": db["settings"]["fees_required"], "paid": 0, "history": []})
    balance = max(fee["required"] - fee["paid"], 0)
    status = "Paid" if balance == 0 else "Not paid" if fee["paid"] == 0 else "Balance"
    return {**fee, "balance": balance, "status": status}


def build_state(db: dict[str, Any]) -> dict[str, Any]:
    students = [{**student, "fees": student_fee(db, student["id"])} for student in db["students"]]
    safe_users = [{key: value for key, value in user.items() if key != "password"} for user in db.get("users", [])]
    return {
        **db,
        "students": students,
        "users": safe_users,
        "subjects": SUBJECTS,
        "junior_subjects": JUNIOR_SUBJECTS,
        "senior_subjects": SENIOR_SUBJECTS,
        "terms": TERMS,
        "forms": FORMS,
        "analytics": analytics(db),
    }


def analytics(db: dict[str, Any]) -> dict[str, Any]:
    form_totals: dict[str, list[float]] = {}
    for student in db["students"]:
        scores = [s["score"] for s in db["scores"] if s["student_id"] == student["id"]]
        if scores:
            form_totals.setdefault(student["form"], []).append(sum(scores) / len(scores))
    performance = {
        form: round(sum(values) / len(values), 1)
        for form, values in form_totals.items()
        if values
    }
    total_required = sum(student_fee(db, s["id"])["required"] for s in db["students"])
    total_paid = sum(student_fee(db, s["id"])["paid"] for s in db["students"])
    return {
        "student_count": len(db["students"]),
        "teacher_count": len(db["teachers"]),
        "fee_collection_rate": round((total_paid / total_required) * 100, 1) if total_required else 0,
        "performance_by_form": performance,
    }


def report_for(db: dict[str, Any], student_id: str, term: str, academic_year: str) -> dict[str, Any]:
    student = next((item for item in db["students"] if item["id"] == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    level = exam_level_for(student["form"])
    classmates = [item for item in db["students"] if item["form"] == student["form"]]
    rows = []
    form_subjects = subjects_for_form(student["form"])
    student_scores = [s for s in db["scores"] if s["student_id"] == student_id and s["term"] == term and s["academic_year"] == academic_year]
    for score in student_scores:
        if score["subject"] not in form_subjects:
            continue
        subject_scores = [
            s["score"]
            for s in db["scores"]
            if s["subject"] == score["subject"]
            and s["term"] == term
            and s["academic_year"] == academic_year
            and any(c["id"] == s["student_id"] for c in classmates)
        ]
        sorted_subject = sorted(subject_scores, reverse=True)
        rank = sorted_subject.index(score["score"]) + 1
        grading = grade_for(score["score"], level)
        rows.append(
            {
                "subject": score["subject"],
                "score": score["score"],
                "average": round(sum(subject_scores) / len(subject_scores), 1) if subject_scores else score["score"],
                "rank": rank,
                "out_of": len(subject_scores),
                **grading,
            }
        )
    summary = overall_result(rows, level)
    positions = []
    for classmate in classmates:
        classmate_report_rows = []
        for score in [s for s in db["scores"] if s["student_id"] == classmate["id"] and s["term"] == term and s["academic_year"] == academic_year and s["subject"] in form_subjects]:
            classmate_report_rows.append({"subject": score["subject"], "score": score["score"], **grade_for(score["score"], level)})
        if classmate_report_rows:
            classmate_summary = overall_result(classmate_report_rows, level)
            total_score = sum(row["score"] for row in classmate_report_rows)
            if level == "MSCE":
                rank_value = -(classmate_summary["points"] or 999)
            else:
                rank_value = total_score
            positions.append((classmate["id"], rank_value, total_score / len(classmate_report_rows)))
    positions.sort(key=lambda item: item[1], reverse=True)
    position = next((index + 1 for index, item in enumerate(positions) if item[0] == student_id), None)
    total = sum(row["score"] for row in rows)
    average = round(total / len(rows), 1) if rows else 0
    return {
        "student": student,
        "settings": db["settings"],
        "term": term,
        "academic_year": academic_year,
        "exam_level": level,
        "rows": sorted(rows, key=lambda row: form_subjects.index(row["subject"]) if row["subject"] in form_subjects else 999),
        "total": total,
        "average": average,
        "result": summary["result"],
        "points": summary["points"],
        "passed_subjects": summary["passed_subjects"],
        "english_passed": summary["english_passed"],
        "position": position,
        "out_of": len(positions),
        "teacher_name": "Ambonishe Moreen",
        "announcements": db["announcements"],
        "fees": student_fee(db, student_id),
    }


app = FastAPI(title="Lufilya Secondary School API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/state")
def get_state() -> dict[str, Any]:
    return build_state(load_db())


@app.post("/api/login")
def login(credentials: LoginIn) -> dict[str, Any]:
    db = load_db()
    user = next(
        (
            item
            for item in db.get("users", [])
            if item.get("email", "").lower() == credentials.email.lower()
            and item.get("password") == credentials.password
        ),
        None,
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    log_activity(db, user["role"], user["name"], "Logged in")
    save_db(db)
    return {key: value for key, value in user.items() if key != "password"}


@app.post("/api/reset-password")
def reset_password(reset: PasswordResetIn) -> dict[str, str]:
    db = load_db()
    user = next((item for item in db.get("users", []) if item.get("email", "").lower() == reset.email.lower()), None)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")
    user["password"] = reset.new_password
    log_activity(db, user["role"], user["name"], "Reset password")
    save_db(db)
    return {"message": "Password updated"}


@app.post("/api/change-password")
def change_password(change: ChangePasswordIn) -> dict[str, str]:
    db = load_db()
    user = next((item for item in db.get("users", []) if item.get("id") == change.user_id), None)
    if not user or user.get("password") != change.current_password:
        raise HTTPException(status_code=401, detail="Current password is not correct")
    user["password"] = change.new_password
    log_activity(db, user["role"], user["name"], "Changed password")
    save_db(db)
    return {"message": "Password changed"}


@app.post("/api/teachers")
def create_teacher(teacher: TeacherIn) -> dict[str, Any]:
    db = load_db()
    teacher_data = teacher.model_dump(exclude={"password"})
    teacher_data["subjects"] = list(dict.fromkeys(teacher.junior_subjects + teacher.senior_subjects + teacher.subjects))
    item = {"id": next_id(db["teachers"], "T"), **teacher_data}
    db["teachers"].append(item)
    if teacher.email:
        db.setdefault("users", []).append(
            {
                "id": next_id(db["users"], "U"),
                "role": "teacher",
                "name": teacher.full_name,
                "email": teacher.email,
                "password": teacher.password,
                "entity_id": item["id"],
            }
        )
    log_activity(db, "admin", "System Admin", f"Registered teacher {teacher.full_name}")
    save_db(db)
    return item


@app.post("/api/users/assign-role")
def assign_role(assignment: RoleAssignmentIn) -> dict[str, Any]:
    if assignment.role not in {"headteacher", "bursar"}:
        raise HTTPException(status_code=400, detail="Only headteacher and bursar roles can be assigned here")
    db = load_db()
    teacher = next((item for item in db["teachers"] if item["id"] == assignment.teacher_id), None)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if not teacher.get("email"):
        raise HTTPException(status_code=400, detail="Teacher must have an email address")
    users = db.setdefault("users", [])
    existing = next((user for user in users if user.get("role") == assignment.role and user.get("entity_id") == teacher["id"]), None)
    if existing:
        existing["name"] = teacher["full_name"]
        existing["email"] = teacher["email"]
        existing["password"] = assignment.password
        user = existing
    else:
        user = {
            "id": next_id(users, "U"),
            "role": assignment.role,
            "name": teacher["full_name"],
            "email": teacher["email"],
            "password": assignment.password,
            "entity_id": teacher["id"],
        }
        users.append(user)
    log_activity(db, "admin", "System Admin", f"Assigned {assignment.role} role to {teacher['full_name']}")
    save_db(db)
    return {key: value for key, value in user.items() if key != "password"}


@app.post("/api/students")
def create_student(student: StudentIn) -> dict[str, Any]:
    db = load_db()
    year = student.registration_year or date.today().year
    item = {
        "id": next_id(db["students"], "S"),
        "reg_number": next_reg_number(db, year),
        **student.model_dump(exclude={"registration_year"}),
        "registration_year": year,
    }
    db["students"].append(item)
    db["fees"][item["id"]] = {"required": db["settings"]["fees_required"], "paid": 0, "history": []}
    log_activity(db, "bursar", "School Bursar", f"Registered student {item['full_name']} ({item['reg_number']})")
    save_db(db)
    return {**item, "fees": student_fee(db, item["id"])}


@app.post("/api/fees/{student_id}/payment")
def record_payment(student_id: str, payment: PaymentIn) -> dict[str, Any]:
    db = load_db()
    if not any(student["id"] == student_id for student in db["students"]):
        raise HTTPException(status_code=404, detail="Student not found")
    fee = db["fees"].setdefault(student_id, {"required": db["settings"]["fees_required"], "paid": 0, "history": []})
    fee["paid"] += payment.amount
    fee["history"].append({"date": date.today().isoformat(), "amount": payment.amount, "note": payment.note})
    student = next(item for item in db["students"] if item["id"] == student_id)
    log_activity(db, "bursar", "School Bursar", f"Recorded {payment.amount} fees payment for {student['full_name']}")
    save_db(db)
    return student_fee(db, student_id)


@app.post("/api/scores")
def upsert_score(score: ScoreIn) -> dict[str, Any]:
    db = load_db()
    existing = next(
        (
            row
            for row in db["scores"]
            if row["student_id"] == score.student_id
            and row["subject"] == score.subject
            and row["term"] == score.term
            and row["academic_year"] == score.academic_year
        ),
        None,
    )
    if existing:
        existing["score"] = score.score
    else:
        db["scores"].append(score.model_dump())
    student = next((item for item in db["students"] if item["id"] == score.student_id), None)
    log_activity(db, "teacher", "Teacher", f"Saved {score.subject} score for {student['full_name'] if student else score.student_id}")
    save_db(db)
    return score.model_dump()


@app.post("/api/scores/upload")
async def upload_scores(file: UploadFile = File(...)) -> dict[str, Any]:
    db = load_db()
    content = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(StringIO(content))
    required = {"reg_number", "subject", "term", "academic_year", "score"}
    if not required.issubset(set(reader.fieldnames or [])):
        raise HTTPException(status_code=400, detail="CSV must include reg_number, subject, term, academic_year, score")
    imported = 0
    for row in reader:
        student = next((item for item in db["students"] if item["reg_number"] == row["reg_number"]), None)
        if not student:
            continue
        score = ScoreIn(
            student_id=student["id"],
            subject=row["subject"],
            term=row["term"],
            academic_year=row["academic_year"],
            score=float(row["score"]),
        )
        upsert = next(
            (
                s
                for s in db["scores"]
                if s["student_id"] == score.student_id and s["subject"] == score.subject and s["term"] == score.term and s["academic_year"] == score.academic_year
            ),
            None,
        )
        if upsert:
            upsert["score"] = score.score
        else:
            db["scores"].append(score.model_dump())
        imported += 1
    log_activity(db, "teacher", "Teacher", f"Uploaded {imported} score rows")
    save_db(db)
    return {"imported": imported}


@app.post("/api/announcements")
def create_announcement(announcement: AnnouncementIn) -> dict[str, Any]:
    db = load_db()
    item = {
        "id": next_id(db["announcements"], "A"),
        **announcement.model_dump(),
        "created_at": datetime.now().isoformat(timespec="seconds"),
    }
    db["announcements"].insert(0, item)
    log_activity(db, "headteacher", "Headteacher", f"Published announcement {announcement.title}")
    save_db(db)
    return item


@app.get("/api/reports/{student_id}")
def get_report(student_id: str, term: str = "Term 2", academic_year: str | None = None) -> dict[str, Any]:
    db = load_db()
    return report_for(db, student_id, term, academic_year or db["settings"]["academic_year"])


FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
PROJECT_IMAGES = BASE_DIR.parent / "images"
if PROJECT_IMAGES.exists():
    app.mount("/school-images", StaticFiles(directory=PROJECT_IMAGES), name="school-images")
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

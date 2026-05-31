import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Banknote,
  Bell,
  BookOpenCheck,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  Home,
  LogOut,
  Printer,
  School,
  Search,
  ShieldCheck,
  Trophy,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import "./styles.css";

const API = "/api";

const roleConfig = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    welcome: "Manage teachers, subjects, classes, and system records.",
    tabs: [
      { id: "overview", label: "Overview", icon: Home },
      { id: "register-teacher", label: "Register Teacher", icon: UserPlus },
      { id: "teachers", label: "Teachers", icon: Users },
      { id: "assign-roles", label: "Assign Roles", icon: ShieldCheck },
      { id: "activity", label: "System Activity", icon: ClipboardList },
      { id: "profile", label: "Credentials", icon: ShieldCheck },
    ],
  },
  bursar: {
    label: "Bursar",
    icon: Banknote,
    welcome: "Register students and control school fee records.",
    tabs: [
      { id: "overview", label: "Overview", icon: Home },
      { id: "register-student", label: "Register Student", icon: UserPlus },
      { id: "fees", label: "Fees Status", icon: Search },
      { id: "payments", label: "Update Payments", icon: Banknote },
      { id: "profile", label: "Credentials", icon: ShieldCheck },
    ],
  },
  teacher: {
    label: "Teacher",
    icon: BookOpenCheck,
    welcome: "Enter marks, upload Excel CSV results, and view rankings.",
    tabs: [
      { id: "overview", label: "Overview", icon: Home },
      { id: "scores", label: "Enter Scores", icon: ClipboardList },
      { id: "upload", label: "Upload Scores", icon: FileSpreadsheet },
      { id: "performance", label: "Performance", icon: Trophy },
      { id: "rankings", label: "Rankings", icon: Trophy },
      { id: "profile", label: "Credentials", icon: ShieldCheck },
    ],
  },
  headteacher: {
    label: "Headteacher",
    icon: GraduationCap,
    welcome: "View statements, performance, announcements, and reports.",
    tabs: [
      { id: "overview", label: "Overview", icon: Home },
      { id: "fees", label: "Fees Statements", icon: Banknote },
      { id: "performance", label: "Reports", icon: GraduationCap },
      { id: "announcements", label: "Announcements", icon: Bell },
      { id: "profile", label: "Credentials", icon: ShieldCheck },
    ],
  },
};

const emptyTeacher = { full_name: "", phone: "", email: "", password: "", subjects: [], junior_subjects: [], senior_subjects: [], classes: [], activity_roles: [] };
const emptyStudent = {
  full_name: "",
  date_of_birth: "",
  village: "",
  form: "Form 1",
  sex: "Female",
  guardian_phone: "",
  guardian_email: "",
  health_status: "No special need",
  special_need: false,
};

function money(value) {
  return `MK ${Number(value || 0).toLocaleString()}`;
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function App() {
  const [state, setState] = useState(null);
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("lufilyaSession");
    if (saved) return JSON.parse(saved);
    const oldRole = localStorage.getItem("lufilyaRole");
    return oldRole ? { role: oldRole } : null;
  });
  const [notice, setNotice] = useState("");

  const refresh = async () => setState(await api("/state"));

  useEffect(() => {
    refresh().catch((error) => setNotice(`Could not load school data from /api/state. ${error.message}`));
  }, []);

  const login = (nextSession) => {
    localStorage.setItem("lufilyaSession", JSON.stringify(nextSession));
    localStorage.removeItem("lufilyaRole");
    setSession(nextSession);
    setNotice("");
  };

  const logout = () => {
    localStorage.removeItem("lufilyaSession");
    localStorage.removeItem("lufilyaRole");
    setSession(null);
  };

  if (!state) {
    return (
      <div className="loading">
        <School size={42} />
        <strong>Lufilya Secondary School</strong>
        <span>{notice || "Loading school system..."}</span>
      </div>
    );
  }

  if (!session?.role || !roleConfig[session.role]) {
    return <LoginPage state={state} onLogin={login} />;
  }

  return (
    <EntityShell session={session} state={state} notice={notice} setNotice={setNotice} refresh={refresh} onLogout={logout} />
  );
}

function LoginPage({ state, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loginNotice, setLoginNotice] = useState("");

  const submitLogin = async () => {
    try {
      const user = await api("/login", { method: "POST", body: JSON.stringify({ email, password }) });
      onLogin({ role: user.role, name: user.name, email: user.email, entity_id: user.entity_id, user_id: user.id });
    } catch {
      setLoginNotice("Invalid email or password.");
    }
  };

  const resetPassword = async () => {
    try {
      await api("/reset-password", { method: "POST", body: JSON.stringify({ email, new_password: newPassword }) });
      setPassword(newPassword);
      setNewPassword("");
      setResetMode(false);
      setLoginNotice("Password updated. You can login now.");
    } catch {
      setLoginNotice("Account not found for that entity and email.");
    }
  };

  return (
    <div className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <School size={38} />
          <div>
            <h1>{state.settings.school_name}</h1>
            <p>School Management System</p>
          </div>
        </div>

        <div className="login-form">
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter email address" />
          </label>
          <label>
            Password
            <div className="password-field">
              <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="Enter password" />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={(event) => {
                event.preventDefault();
                setShowPassword(!showPassword);
              }}>{showPassword ? "Hide" : "Show"}</button>
            </div>
          </label>
          {resetMode && (
            <label>
              New password
              <div className="password-field">
                <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type={showNewPassword ? "text" : "password"} placeholder="Enter new password" />
                <button type="button" aria-label={showNewPassword ? "Hide new password" : "Show new password"} onClick={(event) => {
                  event.preventDefault();
                  setShowNewPassword(!showNewPassword);
                }}>{showNewPassword ? "Hide" : "Show"}</button>
              </div>
            </label>
          )}
          {loginNotice && <div className="inline-notice">{loginNotice}</div>}
          <button className="primary login-button" onClick={resetMode ? resetPassword : submitLogin}>
            <ShieldCheck size={18} />
            {resetMode ? "Reset Password" : "Login"}
          </button>
          <button className="link-button" onClick={() => setResetMode(!resetMode)}>
            {resetMode ? "Back to login" : "Reset password"}
          </button>
        </div>
      </section>

      <section className="login-message">
        <h2>Welcome</h2>
        <p>Select your entity and continue to your private school interface.</p>
      </section>
    </div>
  );
}

function EntityShell({ session, state, notice, setNotice, refresh, onLogout }) {
  const role = session.role;
  const config = roleConfig[role];
  const [activeTab, setActiveTab] = useState(config.tabs[0].id);
  const ActiveIcon = config.icon;
  const currentTeacher = state.teachers.find((teacher) => teacher.id === session.entity_id);
  const displayName = currentTeacher?.full_name || session.name || config.label;

  return (
    <div className={`app-shell ${role}-shell`}>
      <aside className="sidebar">
        <div className="brand">
          <School />
          <div>
            <strong>Lufilya</strong>
            <span>{displayName}</span>
          </div>
        </div>
        <nav>
          {config.tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button className={activeTab === tab.id ? "active" : ""} key={tab.id} onClick={() => setActiveTab(tab.id)}>
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span>Academic year</span>
          <strong>{state.settings.academic_year}</strong>
        </div>
        <button className="logout" onClick={onLogout}>
          <LogOut size={18} />
          Log out
        </button>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p>{state.settings.school_name}</p>
            <h1>
              <ActiveIcon size={30} />
              {config.label} Interface
            </h1>
            <strong className="welcome-line">Welcome {displayName}</strong>
          </div>
          <div className="top-actions">
            <button onClick={() => window.print()}>
              <Printer size={17} />
              Print
            </button>
          </div>
        </header>

        {notice && <div className="toast">{notice}</div>}
        {activeTab === "profile" && <Credentials session={session} setNotice={setNotice} />}
        {activeTab !== "profile" && role === "admin" && <Admin state={state} activeTab={activeTab} setActiveTab={setActiveTab} refresh={refresh} setNotice={setNotice} />}
        {activeTab !== "profile" && role === "bursar" && <Bursar state={state} activeTab={activeTab} setActiveTab={setActiveTab} refresh={refresh} setNotice={setNotice} />}
        {activeTab !== "profile" && role === "teacher" && <Teacher state={state} activeTab={activeTab} setActiveTab={setActiveTab} refresh={refresh} setNotice={setNotice} teacher={currentTeacher} />}
        {activeTab !== "profile" && role === "headteacher" && <Headteacher state={state} activeTab={activeTab} setActiveTab={setActiveTab} refresh={refresh} setNotice={setNotice} />}
      </main>
    </div>
  );
}

function Credentials({ session, setNotice }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    await api("/change-password", {
      method: "POST",
      body: JSON.stringify({ user_id: session.user_id, current_password: currentPassword, new_password: newPassword }),
    });
    setCurrentPassword("");
    setNewPassword("");
    setNotice("Password changed successfully.");
  };

  return (
    <section className="panel narrow">
      <div className="section-title"><ShieldCheck /><h2>Credentials</h2></div>
      <div className="scope-grid">
        <div><span>Name</span><strong>{session.name}</strong></div>
        <div><span>Email</span><strong>{session.email}</strong></div>
      </div>
      <form className="stack profile-form" onSubmit={submit}>
        <input required type="password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        <input required type="password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        <button className="primary"><ShieldCheck size={17} /> Update Password</button>
      </form>
    </section>
  );
}

function StatGrid({ state, onCardClick }) {
  const cards = [
    ["students", "Registered Students", state.analytics.student_count, Users],
    ["teachers", "Teachers", state.analytics.teacher_count, GraduationCap],
    ["fees", "Fees Collected", `${state.analytics.fee_collection_rate}%`, Banknote],
    ["subjects", "Subjects", state.subjects.length, ClipboardList],
  ];
  return (
    <section className="stat-grid">
      {cards.map(([id, label, value, Icon]) => (
        <button className="stat" key={id} onClick={() => onCardClick?.(id)} type="button">
          <Icon size={22} />
          <span>{label}</span>
          <strong>{value}</strong>
        </button>
      ))}
    </section>
  );
}

function Admin({ state, activeTab, setActiveTab, refresh, setNotice }) {
  const [teacher, setTeacher] = useState(emptyTeacher);
  const [activity, setActivity] = useState("");
  const [roleAssignment, setRoleAssignment] = useState({ teacher_id: state.teachers[0]?.id || "", role: "headteacher", password: "" });

  const submit = async (event) => {
    event.preventDefault();
    await api("/teachers", { method: "POST", body: JSON.stringify({ ...teacher, password: teacher.password || "teacher123", subjects: [...teacher.junior_subjects, ...teacher.senior_subjects], activity_roles: activity.split(",").map((x) => x.trim()).filter(Boolean) }) });
    setTeacher(emptyTeacher);
    setActivity("");
    setNotice("Teacher registered with subjects, classes, and activity duties.");
    refresh();
  };

  const assignRole = async (event) => {
    event.preventDefault();
    await api("/users/assign-role", { method: "POST", body: JSON.stringify({ ...roleAssignment, password: roleAssignment.password || "role123" }) });
    setRoleAssignment({ ...roleAssignment, password: "" });
    setNotice("Role assigned to registered teacher.");
    refresh();
  };

  if (activeTab === "overview") {
    return <div className="content-grid"><StatGrid state={state} onCardClick={(id) => id === "teachers" ? setActiveTab("teachers") : setActiveTab("activity")} /><AdminActivity activities={state.activities || []} /></div>;
  }

  if (activeTab === "register-teacher") {
    return (
      <section className="panel">
        <div className="section-title"><UserPlus /><h2>Register Teacher</h2></div>
        <form className="form-grid" onSubmit={submit}>
          <input required placeholder="Full name" value={teacher.full_name} onChange={(e) => setTeacher({ ...teacher, full_name: e.target.value })} />
          <input placeholder="Phone number" value={teacher.phone} onChange={(e) => setTeacher({ ...teacher, phone: e.target.value })} />
          <input required type="email" placeholder="Login email" value={teacher.email || ""} onChange={(e) => setTeacher({ ...teacher, email: e.target.value })} />
          <input type="password" placeholder="Login password" value={teacher.password || ""} onChange={(e) => setTeacher({ ...teacher, password: e.target.value })} />
          <MultiSelect label="Junior Subjects (JCE)" values={state.junior_subjects} selected={teacher.junior_subjects} onChange={(junior_subjects) => setTeacher({ ...teacher, junior_subjects })} />
          <MultiSelect label="Senior Subjects (MSCE)" values={state.senior_subjects} selected={teacher.senior_subjects} onChange={(senior_subjects) => setTeacher({ ...teacher, senior_subjects })} />
          <MultiSelect label="Classes" values={state.forms} selected={teacher.classes} onChange={(classes) => setTeacher({ ...teacher, classes })} />
          <input placeholder="Activity roles, separated by commas" value={activity} onChange={(e) => setActivity(e.target.value)} />
          <button className="primary"><UserPlus size={17} /> Save Teacher</button>
        </form>
      </section>
    );
  }

  if (activeTab === "teachers") {
    return <TeacherRegister teachers={state.teachers} />;
  }

  if (activeTab === "assign-roles") {
    return (
      <section className="panel narrow">
        <div className="section-title"><ShieldCheck /><h2>Assign Role to Teacher</h2></div>
        <form className="stack" onSubmit={assignRole}>
          <select value={roleAssignment.teacher_id} onChange={(event) => setRoleAssignment({ ...roleAssignment, teacher_id: event.target.value })}>
            {state.teachers.map((teacherItem) => <option key={teacherItem.id} value={teacherItem.id}>{teacherItem.full_name} - {teacherItem.email}</option>)}
          </select>
          <select value={roleAssignment.role} onChange={(event) => setRoleAssignment({ ...roleAssignment, role: event.target.value })}>
            <option value="headteacher">Headteacher</option>
            <option value="bursar">Bursar</option>
          </select>
          <input type="password" placeholder="Role login password" value={roleAssignment.password} onChange={(event) => setRoleAssignment({ ...roleAssignment, password: event.target.value })} />
          <button className="primary"><ShieldCheck size={17} /> Assign Role</button>
        </form>
        <div className="hint-panel">
          The selected teacher will login with the teacher email and this role password.
        </div>
      </section>
    );
  }

  return <AdminActivity activities={state.activities || []} />;
}

function AdminActivity({ activities = [] }) {
  return (
    <section className="panel wide">
      <div className="section-title"><ClipboardList /><h2>System Activity</h2></div>
      <DataTable
        columns={["Time", "Role", "User", "Activity"]}
        rows={(activities.length ? activities : [{ created_at: "", role: "system", actor: "System", action: "No activity recorded yet" }]).map((item) => [item.created_at, item.role, item.actor, item.action])}
      />
    </section>
  );
}

function TeacherRegister({ teachers }) {
  return (
    <section className="panel">
      <div className="section-title"><Users /><h2>Teacher Register</h2></div>
      <div className="list">
        {teachers.map((item) => (
          <article key={item.id}>
            <strong>{item.full_name}</strong>
            <span>Junior: {(item.junior_subjects || []).join(", ") || "None"}</span>
            <span>Senior: {(item.senior_subjects || []).join(", ") || "None"}</span>
            <small>{item.classes.join(", ")} - {item.activity_roles.join(", ")}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function Bursar({ state, activeTab, setActiveTab, refresh, setNotice }) {
  const [student, setStudent] = useState(emptyStudent);
  const [payment, setPayment] = useState({ student_id: "", amount: "", note: "" });
  const [query, setQuery] = useState("");
  const filtered = state.students.filter((item) => `${item.full_name} ${item.reg_number}`.toLowerCase().includes(query.toLowerCase()));

  const register = async (event) => {
    event.preventDefault();
    const created = await api("/students", { method: "POST", body: JSON.stringify(student) });
    setStudent(emptyStudent);
    setNotice(`Student registered. Registration number: ${created.reg_number}`);
    refresh();
  };

  const pay = async (event) => {
    event.preventDefault();
    await api(`/fees/${payment.student_id}/payment`, { method: "POST", body: JSON.stringify({ amount: Number(payment.amount), note: payment.note || "Fees payment" }) });
    setPayment({ student_id: "", amount: "", note: "" });
    setNotice("Fees payment updated.");
    refresh();
  };

  if (activeTab === "overview") {
    return <div className="content-grid"><StatGrid state={state} onCardClick={() => setActiveTab("fees")} /><FeesTable students={filtered} query={query} setQuery={setQuery} /></div>;
  }

  if (activeTab === "register-student") {
    return (
      <section className="panel">
        <div className="section-title"><UserPlus /><h2>Register Student</h2></div>
        <form className="form-grid" onSubmit={register}>
          <input required placeholder="Full name" value={student.full_name} onChange={(e) => setStudent({ ...student, full_name: e.target.value })} />
          <input required type="date" value={student.date_of_birth} onChange={(e) => setStudent({ ...student, date_of_birth: e.target.value })} />
          <input required placeholder="Village" value={student.village} onChange={(e) => setStudent({ ...student, village: e.target.value })} />
          <select value={student.form} onChange={(e) => setStudent({ ...student, form: e.target.value })}>{state.forms.map((form) => <option key={form}>{form}</option>)}</select>
          <select value={student.sex} onChange={(e) => setStudent({ ...student, sex: e.target.value })}><option>Female</option><option>Male</option></select>
          <input required placeholder="Guardian phone number" value={student.guardian_phone} onChange={(e) => setStudent({ ...student, guardian_phone: e.target.value })} />
          <input type="email" placeholder="Guardian email" value={student.guardian_email || ""} onChange={(e) => setStudent({ ...student, guardian_email: e.target.value })} />
          <input placeholder="Health status / special need details" value={student.health_status} onChange={(e) => setStudent({ ...student, health_status: e.target.value })} />
          <label className="check"><input type="checkbox" checked={student.special_need} onChange={(e) => setStudent({ ...student, special_need: e.target.checked })} /> Special need</label>
          <button className="primary"><UserPlus size={17} /> Register Student</button>
        </form>
      </section>
    );
  }

  if (activeTab === "payments") {
    return (
      <section className="panel narrow">
        <div className="section-title"><Banknote /><h2>Update Fees</h2></div>
        <form className="stack" onSubmit={pay}>
          <select required value={payment.student_id} onChange={(e) => setPayment({ ...payment, student_id: e.target.value })}>
            <option value="">Choose student</option>
            {state.students.map((item) => <option value={item.id} key={item.id}>{item.reg_number} - {item.full_name}</option>)}
          </select>
          <input required type="number" min="1" placeholder="Amount paid" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />
          <input placeholder="Payment note" value={payment.note} onChange={(e) => setPayment({ ...payment, note: e.target.value })} />
          <button className="primary"><Banknote size={17} /> Save Payment</button>
        </form>
      </section>
    );
  }

  return <FeesTable students={filtered} query={query} setQuery={setQuery} />;
}

function FeesTable({ students, query, setQuery }) {
  return (
    <section className="panel wide">
      <div className="section-title"><Search /><h2>Fees Status</h2></div>
      <input className="search" placeholder="Search by student or reg number" value={query} onChange={(e) => setQuery(e.target.value)} />
      <DataTable
        columns={["Reg No", "Student", "Form", "Required", "Paid", "Balance", "Status"]}
        rows={students.map((item) => [item.reg_number, item.full_name, item.form, money(item.fees.required), money(item.fees.paid), money(item.fees.balance), item.fees.status])}
      />
    </section>
  );
}

function Teacher({ state, activeTab, setActiveTab, refresh, setNotice, teacher }) {
  const teacherJuniorSubjects = teacher?.junior_subjects?.length ? teacher.junior_subjects : state.junior_subjects;
  const teacherSeniorSubjects = teacher?.senior_subjects?.length ? teacher.senior_subjects : state.senior_subjects;
  const teacherSubjects = [...teacherJuniorSubjects, ...teacherSeniorSubjects];
  const teacherClasses = teacher?.classes?.length ? teacher.classes : state.forms;
  const subjectsForForm = (form) => {
    return ["Form 3", "Form 4"].includes(form) ? teacherSeniorSubjects : teacherJuniorSubjects;
  };
  const [filters, setFilters] = useState({
    form: teacherClasses[0] || "Form 1",
    term: "Term 2",
    subject: subjectsForForm(teacherClasses[0] || "Form 1")[0] || state.subjects[0],
    academic_year: state.settings.academic_year,
  });
  const currentSubjects = subjectsForForm(filters.form);
  const [scoreSetupReady, setScoreSetupReady] = useState(false);
  const [score, setScore] = useState({ student_id: "", score: "" });
  const classStudents = state.students.filter((student) => student.form === filters.form);
  const ranked = useRankedStudents(state, filters);
  const performance = useSubjectPerformance(state, filters, classStudents);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      form: teacherClasses.includes(current.form) ? current.form : teacherClasses[0] || "Form 1",
      subject: subjectsForForm(current.form).includes(current.subject) ? current.subject : subjectsForForm(current.form)[0] || state.subjects[0],
      academic_year: state.settings.academic_year,
    }));
    setScoreSetupReady(false);
  }, [teacher?.id, state.settings.academic_year]);

  const submit = async (event) => {
    event.preventDefault();
    await api("/scores", {
      method: "POST",
      body: JSON.stringify({
        student_id: score.student_id,
        subject: filters.subject,
        term: filters.term,
        academic_year: filters.academic_year,
        score: Number(score.score),
      }),
    });
    setScore({ ...score, score: "" });
    setNotice("Score saved and rankings recalculated.");
    refresh();
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API}/scores/upload`, { method: "POST", body: form });
    const result = await response.json();
    setNotice(`${result.imported || 0} score rows imported from spreadsheet CSV.`);
    refresh();
  };

  if (activeTab === "overview") {
    return (
      <div className="content-grid">
        <TeacherScope teacher={teacher} juniorSubjects={teacherJuniorSubjects} seniorSubjects={teacherSeniorSubjects} classes={teacherClasses} />
        <StatGrid state={state} onCardClick={(id) => id === "subjects" ? setActiveTab("scores") : setActiveTab("rankings")} />
        <RankingTable ranked={ranked} title={`${filters.subject} Ranking`} />
      </div>
    );
  }

  if (activeTab === "scores") {
    if (!scoreSetupReady) {
      return (
        <section className="panel narrow">
          <div className="section-title"><ClipboardList /><h2>Select Class and Subject</h2></div>
          <div className="stack">
            <select value={filters.form} onChange={(e) => {
              const form = e.target.value;
              setFilters({ ...filters, form, subject: subjectsForForm(form)[0] || filters.subject });
            }}>
              {teacherClasses.map((form) => <option key={form}>{form}</option>)}
            </select>
            <select value={filters.term} onChange={(e) => setFilters({ ...filters, term: e.target.value })}>
              {state.terms.map((term) => <option key={term}>{term}</option>)}
            </select>
            <select value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })}>
              {currentSubjects.map((subject) => <option key={subject}>{subject}</option>)}
            </select>
            <input value={filters.academic_year} onChange={(e) => setFilters({ ...filters, academic_year: e.target.value })} />
            <button className="primary" onClick={() => setScoreSetupReady(true)}>
              <BookOpenCheck size={17} />
              Proceed to Students
            </button>
          </div>
        </section>
      );
    }

    return (
      <div className="content-grid">
        <section className="panel narrow">
          <div className="section-title"><ClipboardList /><h2>Enter Scores</h2></div>
          <div className="work-context">
            <div><span>Class</span><strong>{filters.form}</strong></div>
            <div><span>Subject</span><strong>{filters.subject}</strong></div>
            <div><span>Term</span><strong>{filters.term}</strong></div>
            <button type="button" onClick={() => setScoreSetupReady(false)}>Change</button>
          </div>
          <form className="stack" onSubmit={submit}>
            <select required value={score.student_id} onChange={(e) => setScore({ ...score, student_id: e.target.value })}>
              <option value="">Choose student in {filters.form}</option>
              {classStudents.map((item) => <option value={item.id} key={item.id}>{item.reg_number} - {item.full_name}</option>)}
            </select>
            <input required type="number" min="0" max="100" placeholder="Score %" value={score.score} onChange={(e) => setScore({ ...score, score: e.target.value })} />
            <button className="primary"><BookOpenCheck size={17} /> Save Score</button>
          </form>
        </section>
        <section className="panel">
          <div className="section-title"><Users /><h2>{filters.form} Students</h2></div>
          <DataTable
            columns={["Reg No", "Student", "Current Score"]}
            rows={classStudents.map((student) => {
              const current = state.scores.find((item) => item.student_id === student.id && item.subject === filters.subject && item.term === filters.term && item.academic_year === filters.academic_year);
              return [student.reg_number, student.full_name, current ? `${current.score}%` : "Not entered"];
            })}
          />
        </section>
      </div>
    );
  }

  if (activeTab === "upload") {
    return (
      <section className="panel narrow">
        <div className="section-title"><FileSpreadsheet /><h2>Upload Excel CSV</h2></div>
        <label className="upload">
          <Upload />
          <span>Upload CSV exported from Excel</span>
          <input type="file" accept=".csv" onChange={upload} />
        </label>
        <p className="hint">Columns: reg_number, subject, term, academic_year, score</p>
      </section>
    );
  }

  if (activeTab === "performance") {
    return (
      <div className="content-grid">
        <TeacherFilters state={state} filters={filters} setFilters={setFilters} subjectsForForm={subjectsForForm} classes={teacherClasses} />
        <PerformancePie performance={performance} />
      </div>
    );
  }

  return (
    <div className="content-grid">
      <TeacherFilters state={state} filters={filters} setFilters={setFilters} subjectsForForm={subjectsForForm} classes={teacherClasses} />
      <RankingTable ranked={ranked} title={`${filters.subject} Ranking`} />
    </div>
  );
}

function TeacherScope({ teacher, juniorSubjects, seniorSubjects, classes }) {
  return (
    <section className="panel wide">
      <div className="section-title"><BookOpenCheck /><h2>{teacher?.full_name || "Teacher"} Scope</h2></div>
      <div className="scope-grid">
        <div><span>Junior Subjects</span><strong>{juniorSubjects.join(", ")}</strong></div>
        <div><span>Senior Subjects</span><strong>{seniorSubjects.join(", ")}</strong></div>
        <div><span>Registered Classes</span><strong>{classes.join(", ")}</strong></div>
      </div>
    </section>
  );
}

function TeacherFilters({ state, filters, setFilters, subjectsForForm, classes }) {
  const subjects = subjectsForForm(filters.form);
  return (
    <section className="panel wide">
      <div className="section-title"><Search /><h2>Filter Performance</h2></div>
      <div className="filter-grid">
        <select value={filters.form} onChange={(e) => {
          const form = e.target.value;
          setFilters({ ...filters, form, subject: subjectsForForm(form)[0] || filters.subject });
        }}>{classes.map((form) => <option key={form}>{form}</option>)}</select>
        <select value={filters.term} onChange={(e) => setFilters({ ...filters, term: e.target.value })}>{state.terms.map((term) => <option key={term}>{term}</option>)}</select>
        <select value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })}>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select>
        <input value={filters.academic_year} onChange={(e) => setFilters({ ...filters, academic_year: e.target.value })} />
      </div>
    </section>
  );
}

function useRankedStudents(state, filters) {
  return useMemo(() => {
    return state.students
      .filter((student) => !filters || student.form === filters.form)
      .map((student) => {
        const scores = state.scores.filter((item) => {
          if (item.student_id !== student.id) return false;
          if (!filters) return true;
          return item.subject === filters.subject && item.term === filters.term && item.academic_year === filters.academic_year;
        });
        const total = scores.reduce((sum, item) => sum + item.score, 0);
        return { student, total, average: scores.length ? total / scores.length : 0 };
      })
      .sort((a, b) => b.total - a.total);
  }, [state, filters]);
}

function useSubjectPerformance(state, filters, classStudents) {
  return useMemo(() => {
    const classIds = new Set(classStudents.map((student) => student.id));
    const scores = state.scores.filter((item) => (
      classIds.has(item.student_id)
      && item.subject === filters.subject
      && item.term === filters.term
      && item.academic_year === filters.academic_year
    ));
    const most = scores.filter((item) => item.score >= 70).length;
    const moderate = scores.filter((item) => item.score >= 50 && item.score < 70).length;
    const least = scores.filter((item) => item.score < 50).length;
    return { most, moderate, least, total: scores.length, subject: filters.subject, form: filters.form, term: filters.term };
  }, [state, filters, classStudents]);
}

function PerformancePie({ performance }) {
  const mostDeg = performance.total ? (performance.most / performance.total) * 360 : 0;
  const moderateDeg = performance.total ? (performance.moderate / performance.total) * 360 : 0;
  const pieStyle = {
    background: performance.total
      ? `conic-gradient(#0284c7 0deg ${mostDeg}deg, #38bdf8 ${mostDeg}deg ${mostDeg + moderateDeg}deg, #93c5fd ${mostDeg + moderateDeg}deg 360deg)`
      : "#e0f2fe",
  };

  return (
    <section className="panel">
      <div className="section-title"><Trophy /><h2>Subject Performance</h2></div>
      <div className="pie-layout">
        <div className="pie-chart" style={pieStyle}><span>{performance.total}</span></div>
        <div className="pie-legend">
          <strong>{performance.subject}</strong>
          <span>{performance.form} - {performance.term}</span>
          <p><i className="legend most" /> Most performing: {performance.most}</p>
          <p><i className="legend moderate" /> Moderate: {performance.moderate}</p>
          <p><i className="legend least" /> Least performing: {performance.least}</p>
        </div>
      </div>
    </section>
  );
}

function RankingTable({ ranked, title = "Class Ranking" }) {
  return (
    <section className="panel wide">
      <div className="section-title"><Trophy /><h2>{title}</h2></div>
      <DataTable
        columns={["Position", "Reg No", "Student", "Form", "Total", "Average"]}
        rows={ranked.map((item, index) => [index + 1, item.student.reg_number, item.student.full_name, item.student.form, item.total, item.average.toFixed(1)])}
      />
    </section>
  );
}

function Headteacher({ state, activeTab, setActiveTab, refresh, setNotice }) {
  const [reportForm, setReportForm] = useState(state.forms[0] || "Form 1");
  const [reportTerm, setReportTerm] = useState("Term 2");
  const reportStudents = state.students.filter((student) => student.form === reportForm);
  const [studentId, setStudentId] = useState(reportStudents[0]?.id || "");
  const [report, setReport] = useState(null);
  const [announcement, setAnnouncement] = useState({ title: "", message: "", audience: "School" });

  useEffect(() => {
    const firstStudent = state.students.find((student) => student.form === reportForm);
    if (!reportStudents.some((student) => student.id === studentId)) {
      setStudentId(firstStudent?.id || "");
    }
  }, [reportForm, state.students]);

  useEffect(() => {
    if (studentId) api(`/reports/${studentId}?term=${encodeURIComponent(reportTerm)}`).then(setReport);
  }, [studentId, reportTerm]);

  const announce = async (event) => {
    event.preventDefault();
    await api("/announcements", { method: "POST", body: JSON.stringify(announcement) });
    setAnnouncement({ title: "", message: "", audience: "School" });
    setNotice("Announcement published.");
    refresh();
  };

  if (activeTab === "overview") {
    return <div className="content-grid"><StatGrid state={state} onCardClick={(id) => id === "fees" ? setActiveTab("fees") : setActiveTab("performance")} /><PerformanceSummary state={state} /></div>;
  }

  if (activeTab === "fees") {
    return (
      <section className="panel wide">
        <div className="section-title"><Banknote /><h2>Fees Statements</h2></div>
        <DataTable columns={["Student", "Paid", "Balance"]} rows={state.students.map((item) => [item.full_name, money(item.fees.paid), money(item.fees.balance)])} />
      </section>
    );
  }

  if (activeTab === "announcements") {
    return (
      <section className="panel narrow">
        <div className="section-title"><Bell /><h2>Announcements</h2></div>
        <form className="stack" onSubmit={announce}>
          <input required placeholder="Title" value={announcement.title} onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })} />
          <textarea required placeholder="Announcement" value={announcement.message} onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })} />
          <input value={announcement.audience} onChange={(e) => setAnnouncement({ ...announcement, audience: e.target.value })} />
          <button className="primary"><Bell size={17} /> Publish</button>
        </form>
      </section>
    );
  }

  return (
    <section className="panel wide">
      <div className="section-title"><GraduationCap /><h2>Performance Reports</h2></div>
      <div className="filter-grid">
        <select value={reportForm} onChange={(e) => setReportForm(e.target.value)}>
          {state.forms.map((form) => <option key={form}>{form}</option>)}
        </select>
        <select value={reportTerm} onChange={(e) => setReportTerm(e.target.value)}>
          {state.terms.map((term) => <option key={term}>{term}</option>)}
        </select>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          {reportStudents.map((item) => <option key={item.id} value={item.id}>{item.reg_number} - {item.full_name}</option>)}
        </select>
      </div>
      <DataTable columns={["Reg No", "Student", "Sex", "Village"]} rows={reportStudents.map((student) => [student.reg_number, student.full_name, student.sex, student.village])} />
      {report && <ReportCard report={report} />}
    </section>
  );
}

function PerformanceSummary({ state }) {
  return (
    <section className="panel wide">
      <div className="section-title"><GraduationCap /><h2>Class Performance</h2></div>
      <DataTable
        columns={["Class", "Average Score"]}
        rows={Object.entries(state.analytics.performance_by_form).map(([form, average]) => [form, `${average}%`])}
      />
    </section>
  );
}

function ReportCard({ report }) {
  return (
    <div className="report-card">
      <div className="report-school">
        <h2>{report.settings.school_name}</h2>
        <p>{report.settings.box} | {report.settings.phone} | {report.settings.email}</p>
      </div>
      <h3>LEARNER'S PERFORMANCE REPORT</h3>
      <div className="report-meta">
        <span><b>Learner's Name:</b> {report.student.full_name}</span>
        <span><b>Academic Year:</b> {report.academic_year}</span>
        <span><b>Term:</b> {report.term}</span>
        <span><b>Class:</b> {report.student.form}</span>
        <span><b>Exam Level:</b> {report.exam_level}</span>
        <span><b>Shift:</b> Open</span>
        <span><b>SK Number:</b> {report.student.reg_number}</span>
      </div>
      <table className="report-table">
        <thead>
          <tr><th>Subject</th><th>Score (%)</th><th>Average (%)</th><th>Grade</th><th>Rank</th><th>Out Of</th><th>Remarks</th></tr>
        </thead>
        <tbody>
          {report.rows.map((row) => <tr key={row.subject}><td>{row.subject}</td><td>{row.score}/100.0</td><td>{row.average}</td><td>{row.grade}</td><td>{row.rank}</td><td>{row.out_of}</td><td>{row.remark}</td></tr>)}
        </tbody>
      </table>
      <div className="report-lines">
        <p><b>Result:</b> {report.result}</p>
        {report.points && <p><b>MSCE Points:</b> {report.points} (best six subjects)</p>}
        <p><b>Subjects Passed:</b> {report.passed_subjects} <b>English Passed:</b> {report.english_passed ? "Yes" : "No"}</p>
        <p><b>Position in Class:</b> {report.position} OUT OF: {report.out_of}</p>
        <p><b>General Comment:</b> Please work hard.</p>
        {report.announcements.slice(0, 1).map((item) => <p key={item.id}><b>Announcement:</b> {item.title}: {item.message}</p>)}
        <p><b>Next Term Begins on:</b> {report.settings.next_term_begins}</p>
        <p><b>Fees required:</b> {money(report.settings.fees_required)} <b>Boarding Fees:</b> {money(report.settings.boarding_fees)}</p>
        <p><b>Account Details:</b> {report.settings.account_name}, {report.settings.bank}, Account {report.settings.account_number}, {report.settings.account_type}, {report.settings.branch}</p>
      </div>
    </div>
  );
}

function MultiSelect({ label, values, selected, onChange }) {
  return (
    <div className="multi">
      <span>{label}</span>
      <div>
        {values.map((value) => (
          <label key={value}>
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={(event) => onChange(event.target.checked ? [...selected, value] : selected.filter((item) => item !== value))}
            />
            {value}
          </label>
        ))}
      </div>
    </div>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

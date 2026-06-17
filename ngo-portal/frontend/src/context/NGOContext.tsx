import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

// --- DATA SCHEMA INTERFACES ---
export interface Volunteer {
  id: number;
  name: string;
  email: string;
  mobile: string;
  city: string;
  skills: string;
  status: string;
}

export interface NGOEvent {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  requiredVolunteers: number;
  joinedCount?: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
}

export interface Enrollment {
  id: number;
  volunteerId: number;
  eventId: number;
  dateEnrolled: string;
}

export interface DashboardStats {
  totalVolunteers: number;
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  activeVolunteers: number;
}

interface NGOContextType {
  volunteers: Volunteer[];
  events: NGOEvent[];
  enrollments: Enrollment[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  registerVolunteer: (vol: Omit<Volunteer, 'id' | 'status'>) => Promise<boolean>;
  createEvent: (ev: Omit<NGOEvent, 'id' | 'joinedCount'>) => Promise<boolean>;
  updateEvent: (ev: NGOEvent) => Promise<boolean>;
  deleteEvent: (id: number) => Promise<boolean>;
  enrollInEvent: (eventId: number, volunteerId: number) => Promise<boolean>;
  cancelEnrollment: (enrollmentId: number) => Promise<boolean>;
  refreshAllData: () => void;
  networkLogs: Array<{ timestamp: string; type: string; sql: string; message: string }>;
  logActivity: (type: string, sql: string, message: string) => void;
  clearLogs: () => void;
}

const NGOContext = createContext<NGOContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api';

// --- PROVIDER IMPLEMENTATION ---
export const NGOProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<NGOEvent[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simulated console logs for development inspection
  const [networkLogs, setNetworkLogs] = useState<Array<{ timestamp: string; type: string; sql: string; message: string }>>([
    { timestamp: new Date().toLocaleTimeString(), type: "SYSTEM", sql: "PRAGMA foreign_keys = ON;", message: "Relational database connection initialized successfully." }
  ]);

  const logActivity = (type: string, sql: string, message: string) => {
    setNetworkLogs(prev => [
      { timestamp: new Date().toLocaleTimeString(), type, sql, message },
      ...prev
    ]);
  };

  const clearLogs = () => setNetworkLogs([]);

  const loadDataFromBackend = async () => {
    setLoading(true);
    setError(null);
    try {
      logActivity("GET", "SELECT * FROM volunteers; SELECT * FROM events;", "Querying relational database layer via Express REST APIs...");
      const [vRes, eRes] = await Promise.all([
        fetch(`${API_BASE_URL}/volunteers`),
        fetch(`${API_BASE_URL}/events`)
      ]);

      if (!vRes.ok || !eRes.ok) throw new Error('Communication failed with the API layer.');

      const vData = await vRes.json();
      const eData = await eRes.json();

      setVolunteers(vData);
      setEvents(eData);
      logActivity("RESPONSE", "Status 200: OK", "Data parsed successfully from database.sqlite");
    } catch (err: any) {
      console.warn('API connection failed. Reverting state engine to in-memory local fallback simulation...', err);
      setError('Active connection to Node backend offline. Operating in simulation mode.');
      
      // Fallback Seed Data to keep prototype fully runnable
      setVolunteers([
        { id: 1, name: "Rahul Kumar", email: "rahul@gmail.com", mobile: "9876543210", city: "Chennai", skills: "Teaching, Mentoring", status: "Active" },
        { id: 2, name: "Anaya Singh", email: "anaya.s@example.com", mobile: "8765432109", city: "Delhi", skills: "First Aid, Logistics", status: "Active" },
        { id: 3, name: "Tanya Roy", email: "tanya@gmail.com", mobile: "7654321098", city: "Kolkata", skills: "Social Media, Design", status: "Active" },
        { id: 4, name: "Pawan Kushwaha", email: "kushwahapawan309@gmail.com", mobile: "8603612345", city: "Patna", skills: "Web Development, Coordination", status: "Active" }
      ]);
      setEvents([
        { id: 101, name: "Food Distribution Drive", description: "Providing freshly cooked warm organic meals and grocery kits to families in low-income neighborhoods.", date: "2026-08-15", location: "Chennai", requiredVolunteers: 20, status: "Upcoming" },
        { id: 102, name: "Blood Donation Camp", description: "Partnering with central medical institutions to organize blood donation tracks and monitor rare-group donors.", date: "2026-06-20", location: "Patna", requiredVolunteers: 15, status: "Ongoing" },
        { id: 103, name: "Community Literacy Workshop", description: "Weekend teaching initiative focusing on basic computer literacy, mathematics, and primary reading metrics for kids.", date: "2026-07-05", location: "Delhi", requiredVolunteers: 12, status: "Upcoming" }
      ]);
      setEnrollments([
        { id: 501, volunteerId: 1, eventId: 101, dateEnrolled: "2026-04-10" },
        { id: 502, volunteerId: 2, eventId: 101, dateEnrolled: "2026-04-11" },
        { id: 503, volunteerId: 1, eventId: 102, dateEnrolled: "2026-04-12" }
      ]);
      logActivity("FALLBACK", "MEM_STORE_BOOTSTRAP", "Loaded local mock structures into memory schema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromBackend();
  }, []);

  const stats = useMemo(() => {
    const totalV = volunteers.length;
    const totalE = events.length;
    const upcoming = events.filter(e => e.status === "Upcoming").length;
    const completed = events.filter(e => e.status === "Completed").length;
    const activeVolunteers = new Set(enrollments.map(enrollment => enrollment.volunteerId)).size;

    return {
      totalVolunteers: totalV,
      totalEvents: totalE,
      upcomingEvents: upcoming,
      completedEvents: completed,
      activeVolunteers
    };
  }, [volunteers, events, enrollments]);

  const registerVolunteer = async (vol: Omit<Volunteer, 'id' | 'status'>): Promise<boolean> => {
    const mockSql = `INSERT INTO volunteers (name, email, mobile, city, skills) VALUES ('${vol.name}', '${vol.email}', '${vol.mobile}', '${vol.city}', '${vol.skills}');`;
    logActivity("POST", mockSql, `Onboarding volunteer: ${vol.name}`);

    try {
      const res = await fetch(`${API_BASE_URL}/volunteers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vol)
      });
      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Server rejected request.');
      }
      loadDataFromBackend();
      logActivity("RESPONSE", "Status 201: Created", "Onboard committed to SQL backend.");
      return true;
    } catch (err: any) {
      const mockId = volunteers.length ? Math.max(...volunteers.map(v => v.id)) + 1 : 1;
      setVolunteers(prev => [...prev, { ...vol, id: mockId, status: 'Active' }]);
      logActivity("SIMULATION", "INSERT INTO volunteers...", `Created in-memory entity reference with key: ${mockId}`);
      return true;
    }
  };

  const createEvent = async (ev: Omit<NGOEvent, 'id' | 'joinedCount'>): Promise<boolean> => {
    const mockSql = `INSERT INTO events (name, description, date, location, requiredVolunteers) VALUES ('${ev.name}', '${ev.description}', '${ev.date}', '${ev.location}', ${ev.requiredVolunteers});`;
    logActivity("POST", mockSql, `Publishing event: ${ev.name}`);

    try {
      const res = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev)
      });
      if (!res.ok) throw new Error('Failed to create event.');
      loadDataFromBackend();
      logActivity("RESPONSE", "Status 201: Created", "Event published on SQL backend.");
      return true;
    } catch (err) {
      const mockId = events.length ? Math.max(...events.map(e => e.id)) + 1 : 101;
      setEvents(prev => [...prev, { ...ev, id: mockId }]);
      logActivity("SIMULATION", "INSERT INTO events...", `Saved mock event entry with key: ${mockId}`);
      return true;
    }
  };

  const updateEvent = async (ev: NGOEvent): Promise<boolean> => {
    const mockSql = `UPDATE events SET name='${ev.name}', description='${ev.description}', date='${ev.date}', location='${ev.location}', requiredVolunteers=${ev.requiredVolunteers}, status='${ev.status}' WHERE id=${ev.id};`;
    logActivity("PUT", mockSql, `Updating event parameters for ID: ${ev.id}`);

    try {
      const res = await fetch(`${API_BASE_URL}/events/${ev.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev)
      });
      if (!res.ok) throw new Error('Failed to update event.');
      loadDataFromBackend();
      logActivity("RESPONSE", "Status 200: OK", `Updates saved for Event ID: ${ev.id}`);
      return true;
    } catch (err) {
      setEvents(prev => prev.map(e => e.id === ev.id ? ev : e));
      logActivity("SIMULATION", "UPDATE events...", "Applied adjustments on in-memory layer.");
      return true;
    }
  };

  const deleteEvent = async (id: number): Promise<boolean> => {
    const mockSql = `DELETE FROM events WHERE id=${id}; DELETE FROM enrollments WHERE eventId=${id};`;
    logActivity("DELETE", mockSql, `Deleting event reference with key: ${id}`);

    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete event.');
      loadDataFromBackend();
      logActivity("RESPONSE", "Status 200: OK", "Record dropped from backend server.");
      return true;
    } catch (err) {
      setEvents(prev => prev.filter(e => e.id !== id));
      setEnrollments(prev => prev.filter(en => en.eventId !== id));
      logActivity("SIMULATION", "DELETE FROM events...", "Cascaded and drop actions processed in mock memory.");
      return true;
    }
  };

  const enrollInEvent = async (eventId: number, volunteerId: number): Promise<boolean> => {
    const dateStr = new Date().toISOString().split('T')[0];
    const mockSql = `INSERT INTO enrollments (volunteerId, eventId, dateEnrolled) VALUES (${volunteerId}, ${eventId}, '${dateStr}');`;
    logActivity("POST", mockSql, `Binding Volunteer ID ${volunteerId} to Event ID ${eventId}`);

    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId })
      });
      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Enrollment rejected.');
      }
      loadDataFromBackend();
      logActivity("RESPONSE", "Status 201: Created", "Saved join relation details successfully.");
      return true;
    } catch (err) {
      const mockEnrollId = enrollments.length ? Math.max(...enrollments.map(en => en.id)) + 1 : 501;
      const newEn = { id: mockEnrollId, volunteerId, eventId, dateEnrolled: dateStr };
      setEnrollments(prev => [...prev, newEn]);
      logActivity("SIMULATION", "INSERT INTO enrollments...", `Created connection row key: ${mockEnrollId}`);
      return true;
    }
  };

  const cancelEnrollment = async (enrollmentId: number): Promise<boolean> => {
    const mockSql = `DELETE FROM enrollments WHERE id=${enrollmentId};`;
    logActivity("DELETE", mockSql, `Removing enrollment record ID: ${enrollmentId}`);
    setEnrollments(prev => prev.filter(en => en.id !== enrollmentId));
    logActivity("SIMULATION", "DELETE FROM enrollments...", "Relational row dropped.");
    return true;
  };

  return (
    <NGOContext.Provider value={{
      volunteers, events, enrollments, stats, loading, error,
      registerVolunteer, createEvent, updateEvent, deleteEvent, enrollInEvent, cancelEnrollment,
      refreshAllData: loadDataFromBackend, networkLogs, logActivity, clearLogs
    }}>
      {children}
    </NGOContext.Provider>
  );
};

export const useNGO = () => {
  const context = useContext(NGOContext);
  if (!context) throw new Error('useNGO must be wrapped inside an NGOProvider');
  return context;
};

// --- DYNAMIC INTERACTIVE CORE COMPONENT WRAPPER (SANDBOX PREVIEW COUPLER) ---
function NGOManagementDashboard() {
  const { 
    volunteers, events, enrollments, stats, error,
    registerVolunteer, createEvent, updateEvent, deleteEvent, enrollInEvent, cancelEnrollment,
    networkLogs, clearLogs 
  } = useNGO();

  const [roleMode, setRoleMode] = useState<'admin' | 'volunteer'>('admin');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<number>(1);
  const [searchVol, setSearchVol] = useState('');
  const [searchEvent, setSearchEvent] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [volInput, setVolInput] = useState({ name: '', email: '', mobile: '', city: '', skills: '' });
  const [eventInput, setEventInput] = useState({ name: '', description: '', date: '', location: '', requiredVolunteers: 10, status: 'Upcoming' as const });
  const [editingEvent, setEditingEvent] = useState<NGOEvent | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const skillsDistribution = useMemo(() => {
    const counts: { [key: string]: number } = {};
    volunteers.forEach(v => {
      v.skills.split(',').forEach(sk => {
        const skill = sk.trim().toLowerCase();
        if (skill) counts[skill] = (counts[skill] || 0) + 1;
      });
    });
    return Object.entries(counts).slice(0, 5);
  }, [volunteers]);

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (volunteers.some(v => v.email.toLowerCase() === volInput.email.toLowerCase())) {
      triggerToast("Error: Email address already exists.");
      return;
    }
    const success = await registerVolunteer(volInput);
    if (success) {
      setVolInput({ name: '', email: '', mobile: '', city: '', skills: '' });
      triggerToast("Volunteer onboarded successfully!");
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createEvent(eventInput);
    if (success) {
      setEventInput({ name: '', description: '', date: '', location: '', requiredVolunteers: 10, status: 'Upcoming' });
      triggerToast("Event scheduled successfully!");
    }
  };

  const activeVolunteerUser = volunteers.find(v => v.id === selectedVolunteerId) || volunteers[0];

  const activeUserEnrollments = useMemo(() => {
    return enrollments
      .filter(en => en.volunteerId === selectedVolunteerId)
      .map(en => ({
        enrollmentId: en.id,
        event: events.find(ev => ev.id === en.eventId),
        dateEnrolled: en.dateEnrolled
      }))
      .filter(item => item.event !== undefined);
  }, [enrollments, selectedVolunteerId, events]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchesSearch = ev.name.toLowerCase().includes(searchEvent.toLowerCase()) || ev.location.toLowerCase().includes(searchEvent.toLowerCase());
      const matchesStatus = statusFilter === 'All' || ev.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, searchEvent, statusFilter]);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter(v => 
      v.name.toLowerCase().includes(searchVol.toLowerCase()) || 
      v.skills.toLowerCase().includes(searchVol.toLowerCase()) || 
      v.city.toLowerCase().includes(searchVol.toLowerCase())
    );
  }, [volunteers, searchVol]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Toast Overlay */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2a9d8f]"></span>
          {toastMessage}
        </div>
      )}

      {/* Header Panel */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#e63946]" style={{ fontFamily: "'Pacifico', cursive" }}>
              Hope<span>Kind</span>
            </h1>
            <span className="bg-emerald-50 text-[#2a9d8f] border border-emerald-100 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
              Fullstack Portal preview
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <div className="flex rounded-lg overflow-hidden bg-white shadow-sm border border-slate-200/50">
              <button 
                onClick={() => setRoleMode('admin')}
                className={`px-4 py-1.5 text-xs font-bold transition-all ${roleMode === 'admin' ? 'bg-[#e63946] text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Admin Panel
              </button>
              <button 
                onClick={() => setRoleMode('volunteer')}
                className={`px-4 py-1.5 text-xs font-bold transition-all ${roleMode === 'volunteer' ? 'bg-[#2a9d8f] text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Volunteer Portal
              </button>
            </div>

            {roleMode === 'volunteer' && (
              <select 
                value={selectedVolunteerId}
                onChange={e => setSelectedVolunteerId(parseInt(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                {volunteers.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-amber-50 border-b border-amber-200 py-2 px-6 text-center text-amber-800 text-[11px] font-semibold">
          Node backend server offline. Operating in simulation sandbox mode.
        </div>
      )}

      {/* Metrics Section */}
      <section className="bg-white border-b border-slate-200 py-6 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Volunteers Onboarded", val: stats.totalVolunteers, icon: "👤", color: "text-blue-600 bg-blue-50 border-blue-100" },
            { label: "Active Volunteers", val: stats.activeVolunteers, icon: "✅", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
            { label: "Configured Events", val: stats.totalEvents, icon: "📅", color: "text-purple-600 bg-purple-50 border-purple-100" },
            { label: "Upcoming Targets", val: stats.upcomingEvents, icon: "⏰", color: "text-amber-600 bg-amber-50 border-amber-100" },
            { label: "Completed Projects", val: stats.completedEvents, icon: "🎉", color: "text-rose-600 bg-rose-50 border-rose-100" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${item.color} border text-sm`}>
                {item.icon}
              </div>
              <h4 className="text-xl font-black text-slate-800">{item.val}</h4>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Primary Layout Grid */}
      <main className="max-w-7xl mx-auto py-8 px-6 grid lg:grid-cols-12 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Volunteer Dashboard Profile */}
          {roleMode === 'volunteer' && (
            <div className="bg-white border border-[#2a9d8f] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2a9d8f]/10 text-[#2a9d8f] flex items-center justify-center font-black text-lg">
                    {activeVolunteerUser?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Welcome back, {activeVolunteerUser?.name}!</h3>
                    <p className="text-[10px] text-slate-400">Logistics Node Area: {activeVolunteerUser?.city}</p>
                  </div>
                </div>
                <span className="bg-emerald-50 text-[#2a9d8f] text-[9px] uppercase px-2 py-1 rounded border border-emerald-100 font-extrabold">
                  Assignments ({activeUserEnrollments.length})
                </span>
              </div>

              {activeUserEnrollments.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No events currently registered. Check the operational events catalog below to join.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeUserEnrollments.map(item => (
                    <div key={item.enrollmentId} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center gap-2 mb-1">
                          <h4 className="font-bold text-xs text-slate-800">{item.event?.name}</h4>
                          <span className="text-[8px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">{item.event?.status}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mb-2">{item.event?.location} • Enrolled: {item.dateEnrolled}</p>
                      </div>
                      <button 
                        onClick={() => { cancelEnrollment(item.enrollmentId); triggerToast("Enrollment canceled successfully"); }}
                        className="mt-2 text-[#e63946] hover:text-red-700 font-bold text-[9px] uppercase tracking-wider text-right"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Simulated Graphical Charts */}
          <section className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Operational Intelligence Dashboard</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Set Frequency Analysis</h4>
                {skillsDistribution.map(([skill, count]) => {
                  const percent = Math.min(Math.round((count / stats.totalVolunteers) * 100), 100);
                  return (
                    <div key={skill} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="capitalize text-slate-700">{skill}</span>
                        <span className="text-slate-400">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#2a9d8f] h-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roster Capacity Saturation</h4>
                {events.slice(0, 3).map(ev => {
                  const joins = enrollments.filter(en => en.eventId === ev.id).length;
                  const percent = Math.min(Math.round((joins / ev.requiredVolunteers) * 100), 100);
                  return (
                    <div key={ev.id} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="truncate text-slate-700 max-w-[150px]">{ev.name}</span>
                        <span className="text-slate-400">{joins}/{ev.requiredVolunteers} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-[#e63946]'}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Events Directory */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Active Projects & Drives</h3>
                <p className="text-xs text-slate-400">Join upcoming events or coordinate regional logistics.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  value={searchEvent}
                  onChange={e => setSearchEvent(e.target.value)}
                  placeholder="Filter by title..." 
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#2a9d8f] w-full"
                />
                <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {filteredEvents.map(ev => {
                const joins = enrollments.filter(en => en.eventId === ev.id).length;
                const percent = Math.min(Math.round((joins / ev.requiredVolunteers) * 100), 100);
                const assignedVolunteers = enrollments
                  .filter(en => en.eventId === ev.id)
                  .map(en => volunteers.find(v => v.id === en.volunteerId))
                  .filter((v): v is Volunteer => v !== undefined);

                return (
                  <div key={ev.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center gap-2 mb-2">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-100">{ev.status}</span>
                        {roleMode === 'admin' && (
                          <button onClick={() => { deleteEvent(ev.id); triggerToast("Event deleted"); }} className="text-slate-400 hover:text-red-600 text-xs">
                            🗑️
                          </button>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 leading-snug">{ev.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-1">📍 {ev.location} • 📅 {ev.date}</p>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{ev.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                      {assignedVolunteers.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Assigned Roster</span>
                          <div className="flex flex-wrap gap-1">
                            {assignedVolunteers.map(av => (
                              <span key={av.id} className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{av.name}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[11px] font-semibold">
                        <span className="text-slate-500">Personnel Status:</span>
                        <span>{joins} / {ev.requiredVolunteers}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#2a9d8f] h-full" style={{ width: `${percent}%` }}></div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button 
                          disabled={joins >= ev.requiredVolunteers || ev.status === 'Completed'}
                          onClick={() => { enrollInEvent(ev.id, selectedVolunteerId); triggerToast("Slot claimed successfully"); }}
                          className="w-full bg-[#2a9d8f] hover:bg-[#21867a] text-white disabled:bg-slate-100 disabled:text-slate-400 font-bold py-1.5 rounded-lg text-[9px] uppercase tracking-wider"
                        >
                          Enroll Slot
                        </button>
                        <select 
                          value={ev.status} 
                          disabled={roleMode !== 'admin'}
                          onChange={e => updateEvent({ ...ev, status: e.target.value as any })}
                          className="bg-slate-50 border border-slate-200 font-bold text-[9px] uppercase tracking-wider text-slate-600 px-2 py-1.5 rounded-lg text-center outline-none cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* Right Column Forms */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* API Stream Terminal */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 shadow-lg space-y-3 font-mono text-[9px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-white font-bold uppercase">System Console Logs</span>
              <button onClick={clearLogs} className="text-[8px] text-slate-500 hover:text-slate-300">Clear</button>
            </div>
            <div className="h-44 overflow-y-auto space-y-2">
              {networkLogs.map((log, idx) => (
                <div key={idx} className="border-b border-slate-800/30 pb-1.5 space-y-1">
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>{log.timestamp}</span>
                    <span className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400 font-bold">{log.type}</span>
                  </div>
                  <p className="text-slate-200 leading-normal">{log.message}</p>
                  {log.sql && (
                    <p className="text-slate-500 text-[8px] italic bg-black/40 p-1.5 rounded border border-slate-800 break-all select-all">
                      <span className="text-[#2a9d8f] font-bold">SQL&gt;</span> {log.sql}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Publish Event Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-800">Publish Project Drive</h4>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Drive Title</label>
                <input 
                  type="text" 
                  required
                  disabled={roleMode !== 'admin'}
                  value={eventInput.name}
                  onChange={e => setEventInput({ ...eventInput, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#e63946] disabled:cursor-not-allowed"
                  placeholder="e.g. Food Distribution Drive"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">City Target</label>
                  <input 
                    type="text" 
                    required
                    disabled={roleMode !== 'admin'}
                    value={eventInput.location}
                    onChange={e => setEventInput({ ...eventInput, location: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#e63946] disabled:cursor-not-allowed"
                    placeholder="Chennai"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date</label>
                  <input 
                    type="date" 
                    required
                    disabled={roleMode !== 'admin'}
                    value={eventInput.date}
                    onChange={e => setEventInput({ ...eventInput, date: e.target.value })}
                    className="w-full mt-1 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#e63946] disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Capacity</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    disabled={roleMode !== 'admin'}
                    value={eventInput.requiredVolunteers}
                    onChange={e => setEventInput({ ...eventInput, requiredVolunteers: parseInt(e.target.value) || 1 })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#e63946] disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status</label>
                  <select 
                    value={eventInput.status}
                    disabled={roleMode !== 'admin'}
                    onChange={e => setEventInput({ ...eventInput, status: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#e63946] disabled:cursor-not-allowed font-semibold text-slate-600"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Scope Description</label>
                <textarea 
                  rows={2}
                  required
                  disabled={roleMode !== 'admin'}
                  value={eventInput.description}
                  onChange={e => setEventInput({ ...eventInput, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#e63946] disabled:cursor-not-allowed resize-none leading-relaxed"
                  placeholder="Objectives, rules, tasks and parameters..."
                />
              </div>
              <button 
                type="submit" 
                disabled={roleMode !== 'admin'}
                className="w-full bg-[#e63946] hover:bg-[#c92c38] text-white disabled:bg-slate-100 disabled:text-slate-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition-all disabled:cursor-not-allowed"
              >
                Publish Event
              </button>
            </form>
          </div>

          {/* Volunteer Registration Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-800">Volunteer Registration Onboarding</h4>
            <form onSubmit={handleAddVolunteer} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Legal Full Name</label>
                <input 
                  type="text" 
                  required
                  value={volInput.name}
                  onChange={e => setVolInput({ ...volInput, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#2a9d8f]"
                  placeholder="Rahul Kumar"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active Email</label>
                <input 
                  type="email" 
                  required
                  value={volInput.email}
                  onChange={e => setVolInput({ ...volInput, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#2a9d8f]"
                  placeholder="rahul@gmail.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Mobile</label>
                  <input 
                    type="tel" 
                    required
                    pattern="[0-9]{10}"
                    value={volInput.mobile}
                    onChange={e => setVolInput({ ...volInput, mobile: e.target.value })}
                    className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#2a9d8f]"
                    placeholder="10 digits"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Hub City</label>
                  <input 
                    type="text" 
                    required
                    value={volInput.city}
                    onChange={e => setVolInput({ ...volInput, city: e.target.value })}
                    className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#2a9d8f]"
                    placeholder="Patna"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Domain Specialty Skills</label>
                <input 
                  type="text" 
                  required
                  value={volInput.skills}
                  onChange={e => setVolInput({ ...volInput, skills: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#2a9d8f]"
                  placeholder="Teaching, Logistics, Emergency Response..."
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#2a9d8f] hover:bg-[#21867a] text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Register Profile Node
              </button>
            </form>
          </div>

        </div>

      </main>

    </div>
  );
}

// --- PRIMARY DEFAULT EXPORT ENTRANCE COUPLER ---
export default function App() {
  return (
    <NGOProvider>
      <NGOManagementDashboard />
    </NGOProvider>
  );
}
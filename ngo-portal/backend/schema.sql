-- Relational Database Schema Definitions (SQLite / MySQL)
-- This schema represents volunteers, events, and their associative enrollment relation.

-- Ensure foreign keys are enabled (SQLite specific constraint check)
PRAGMA foreign_keys = ON;

-- 1. Create table structure for Volunteer profiles
CREATE TABLE IF NOT EXISTS volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    city VARCHAR(100) NOT NULL,
    skills TEXT,
    status VARCHAR(50) DEFAULT 'Active'
);

-- 2. Create table structure for Regional Event Projects
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    location VARCHAR(150) NOT NULL,
    requiredVolunteers INT NOT NULL DEFAULT 10,
    status VARCHAR(50) CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')) DEFAULT 'Upcoming'
);

-- 3. Create relational associative junction table (Junction Entity mapping many-to-many relationship)
CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteerId INTEGER NOT NULL,
    eventId INTEGER NOT NULL,
    dateEnrolled DATE NOT NULL,
    FOREIGN KEY (volunteerId) REFERENCES volunteers (id) ON DELETE CASCADE,
    FOREIGN KEY (eventId) REFERENCES events (id) ON DELETE CASCADE,
    UNIQUE(volunteerId, eventId) -- Guarantees that a volunteer cannot register for the same event twice
);

-- 4. Seed data sequences for development and analysis testing
INSERT OR IGNORE INTO volunteers (id, name, email, mobile, city, skills, status) VALUES
(1, 'Rahul Kumar', 'rahul@gmail.com', '9876543210', 'Chennai', 'Teaching, Mentoring', 'Active'),
(2, 'Anaya Singh', 'anaya.s@example.com', '8765432109', 'Delhi', 'First Aid, Logistics', 'Active'),
(3, 'Tanya Roy', 'tanya@gmail.com', '7654321098', 'Kolkata', 'Social Media, Design', 'Active'),
(4, 'Pawan Kushwaha', 'kushwahapawan309@gmail.com', '8603612345', 'Patna', 'Web Development, Coordination', 'Active');

INSERT OR IGNORE INTO events (id, name, description, date, location, requiredVolunteers, status) VALUES
(101, 'Food Distribution Drive', 'Providing freshly cooked warm organic meals and essential grocery kits to families in low-income micro-neighborhoods.', '2026-08-15', 'Chennai', 20, 'Upcoming'),
(102, 'Blood Donation Camp', 'Partnering with central medical institutions to organize blood donation tracks and monitor rare-group donors.', '2026-06-20', 'Patna', 15, 'Ongoing'),
(103, 'Community Literacy Workshop', 'Weekend teaching initiative focusing on foundational digital computing, mathematics, and primary reading metrics for kids.', '2026-07-05', 'Delhi', 12, 'Upcoming'),
(104, 'Ecological Tree Plantation', 'Urban tree planting drive targeting municipal buffer zones, public schools, and barren park margins.', '2026-05-12', 'Kolkata', 30, 'Completed');

INSERT OR IGNORE INTO enrollments (id, volunteerId, eventId, dateEnrolled) VALUES
(501, 1, 101, '2026-04-10'),
(502, 2, 101, '2026-04-11'),
(503, 1, 102, '2026-04-12'),
(504, 3, 102, '2026-04-14'),
(505, 4, 102, '2026-04-15');
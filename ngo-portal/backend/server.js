/**
 * server.js - NGO Portal Express.js Backend API Implementation
 * Connects with database.sqlite using relational join queries.
 */
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const dbPath = path.resolve(__dirname, 'database.sqlite');
const schemaPath = path.resolve(__dirname, 'schema.sql');

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('SQLite connection failed:', err.message);
        return;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql, (schemaErr) => {
        if (schemaErr) {
            console.error('Database bootstrap failed:', schemaErr.message);
            return;
        }

        console.log('SQLite schema loaded and seeded successfully.');
    });
});

const selectVolunteersSql = `
    SELECT v.*, COUNT(e.id) AS joinedCount
    FROM volunteers v
    LEFT JOIN enrollments e ON e.volunteerId = v.id
    GROUP BY v.id
    ORDER BY v.id DESC
`;

const selectEventsSql = `
    SELECT ev.*, COUNT(en.id) AS joinedCount
    FROM events ev
    LEFT JOIN enrollments en ON en.eventId = ev.id
    GROUP BY ev.id
    ORDER BY ev.date ASC, ev.id DESC
`;

function getVolunteerById(id, callback) {
    const sql = `
        SELECT v.*, COUNT(e.id) AS joinedCount
        FROM volunteers v
        LEFT JOIN enrollments e ON e.volunteerId = v.id
        WHERE v.id = ?
        GROUP BY v.id
    `;

    db.get(sql, [id], callback);
}

function getEventById(id, callback) {
    const sql = `
        SELECT ev.*, COUNT(en.id) AS joinedCount
        FROM events ev
        LEFT JOIN enrollments en ON en.eventId = ev.id
        WHERE ev.id = ?
        GROUP BY ev.id
    `;

    db.get(sql, [id], callback);
}

function updateRow(table, id, body, columns, callback) {
    const setClause = columns.map((column) => `${column} = ?`).join(', ');
    const values = columns.map((column) => body[column]);
    values.push(id);

    db.run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values, callback);
}

app.get('/', (_req, res) => {
    res.json({
        message: 'NGO Volunteer & Event Management API is running.',
        endpoints: ['/api/volunteers', '/api/events', '/api/dashboard/stats']
    });
});

app.get('/api/volunteers', (_req, res) => {
    db.all(selectVolunteersSql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/volunteers/:id', (req, res) => {
    getVolunteerById(req.params.id, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Volunteer not found.' });
        res.json(row);
    });
});

app.post('/api/volunteers', (req, res) => {
    const { name, email, mobile, city, skills } = req.body;

    if (!name || !email || !mobile || !city) {
        return res.status(400).json({ error: 'Name, email, mobile, and city are required.' });
    }

    const sql = 'INSERT INTO volunteers (name, email, mobile, city, skills) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [name, email, mobile, city, skills || ''], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'This email is already registered.' });
            }

            return res.status(500).json({ error: err.message });
        }

        getVolunteerById(this.lastID, (lookupErr, row) => {
            if (lookupErr) return res.status(500).json({ error: lookupErr.message });
            res.status(201).json(row);
        });
    });
});

app.put('/api/volunteers/:id', (req, res) => {
    const { id } = req.params;

    getVolunteerById(id, (lookupErr, current) => {
        if (lookupErr) return res.status(500).json({ error: lookupErr.message });
        if (!current) return res.status(404).json({ error: 'Volunteer not found.' });

        const next = {
            name: req.body.name ?? current.name,
            email: req.body.email ?? current.email,
            mobile: req.body.mobile ?? current.mobile,
            city: req.body.city ?? current.city,
            skills: req.body.skills ?? current.skills,
            status: req.body.status ?? current.status
        };

        updateRow('volunteers', id, next, ['name', 'email', 'mobile', 'city', 'skills', 'status'], (err) => {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'This email is already registered.' });
                }

                return res.status(500).json({ error: err.message });
            }

            getVolunteerById(id, (freshErr, row) => {
                if (freshErr) return res.status(500).json({ error: freshErr.message });
                res.json(row);
            });
        });
    });
});

app.delete('/api/volunteers/:id', (req, res) => {
    db.run('DELETE FROM volunteers WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (!this.changes) return res.status(404).json({ error: 'Volunteer not found.' });
        res.json({ message: 'Volunteer deleted successfully.' });
    });
});

app.get('/api/events', (_req, res) => {
    db.all(selectEventsSql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/events/:id', (req, res) => {
    getEventById(req.params.id, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Event not found.' });
        res.json(row);
    });
});

app.post('/api/events', (req, res) => {
    const { name, description, date, location, requiredVolunteers, status } = req.body;

    if (!name || !date || !location || !requiredVolunteers) {
        return res.status(400).json({ error: 'Event name, date, location, and required volunteers are required.' });
    }

    const sql = 'INSERT INTO events (name, description, date, location, requiredVolunteers, status) VALUES (?, ?, ?, ?, ?, ?)';
    const eventStatus = status || 'Upcoming';

    db.run(sql, [name, description || '', date, location, requiredVolunteers, eventStatus], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        getEventById(this.lastID, (lookupErr, row) => {
            if (lookupErr) return res.status(500).json({ error: lookupErr.message });
            res.status(201).json(row);
        });
    });
});

app.put('/api/events/:id', (req, res) => {
    const { id } = req.params;

    getEventById(id, (lookupErr, current) => {
        if (lookupErr) return res.status(500).json({ error: lookupErr.message });
        if (!current) return res.status(404).json({ error: 'Event not found.' });

        const next = {
            name: req.body.name ?? current.name,
            description: req.body.description ?? current.description,
            date: req.body.date ?? current.date,
            location: req.body.location ?? current.location,
            requiredVolunteers: req.body.requiredVolunteers ?? current.requiredVolunteers,
            status: req.body.status ?? current.status
        };

        updateRow('events', id, next, ['name', 'description', 'date', 'location', 'requiredVolunteers', 'status'], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            getEventById(id, (freshErr, row) => {
                if (freshErr) return res.status(500).json({ error: freshErr.message });
                res.json(row);
            });
        });
    });
});

app.delete('/api/events/:id', (req, res) => {
    db.run('DELETE FROM events WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (!this.changes) return res.status(404).json({ error: 'Event not found.' });
        res.json({ message: 'Event deleted successfully.' });
    });
});

app.post('/api/events/:id/register', (req, res) => {
    const eventId = Number(req.params.id);
    const volunteerId = Number(req.body.volunteerId);

    if (!volunteerId) {
        return res.status(400).json({ error: 'volunteerId is required.' });
    }

    getEventById(eventId, (eventErr, eventRow) => {
        if (eventErr) return res.status(500).json({ error: eventErr.message });
        if (!eventRow) return res.status(404).json({ error: 'Event not found.' });

        getVolunteerById(volunteerId, (volErr, volunteerRow) => {
            if (volErr) return res.status(500).json({ error: volErr.message });
            if (!volunteerRow) return res.status(404).json({ error: 'Volunteer not found.' });

            db.get('SELECT COUNT(*) AS currentCount FROM enrollments WHERE eventId = ?', [eventId], (countErr, countRow) => {
                if (countErr) return res.status(500).json({ error: countErr.message });

                if (countRow.currentCount >= eventRow.requiredVolunteers) {
                    return res.status(400).json({ error: 'This event has reached its volunteer limit.' });
                }

                db.get(
                    'SELECT id FROM enrollments WHERE volunteerId = ? AND eventId = ?',
                    [volunteerId, eventId],
                    (duplicateErr, duplicateRow) => {
                        if (duplicateErr) return res.status(500).json({ error: duplicateErr.message });
                        if (duplicateRow) {
                            return res.status(400).json({ error: 'Volunteer is already registered for this event.' });
                        }

                        const dateEnrolled = new Date().toISOString().split('T')[0];
                        db.run(
                            'INSERT INTO enrollments (volunteerId, eventId, dateEnrolled) VALUES (?, ?, ?)',
                            [volunteerId, eventId, dateEnrolled],
                            function (insertErr) {
                                if (insertErr) return res.status(500).json({ error: insertErr.message });
                                res.status(201).json({ id: this.lastID, volunteerId, eventId, dateEnrolled });
                            }
                        );
                    }
                );
            });
        });
    });
});

app.get('/api/dashboard/stats', (_req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM volunteers) AS totalVolunteers,
            (SELECT COUNT(*) FROM events) AS totalEvents,
            (SELECT COUNT(*) FROM events WHERE status = 'Upcoming') AS upcomingEvents,
            (SELECT COUNT(*) FROM events WHERE status = 'Completed') AS completedEvents,
            (SELECT COUNT(DISTINCT volunteerId) FROM enrollments) AS activeVolunteers
    `;

    db.get(sql, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.listen(PORT, () => {
    console.log(`Express REST API running at http://localhost:${PORT}`);
});

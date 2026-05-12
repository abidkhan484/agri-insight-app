CREATE TABLE IF NOT EXISTS farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE NOT NULL,
  name TEXT,
  district TEXT,
  upazila TEXT,
  has_desi_cow BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  area_decimal REAL NOT NULL,
  soil_type TEXT,
  latitude REAL,
  longitude REAL,
  crop TEXT,
  start_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id)
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plot_id INTEGER NOT NULL,
  type TEXT NOT NULL,          -- 'jeevamrutha' | 'mulch' | 'neemastra' | 'irrigation' | 'custom'
  interval_days INTEGER,       -- NULL for one-time
  next_due DATE NOT NULL,
  description TEXT,            -- for custom reminders
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plot_id) REFERENCES plots(id)
);

CREATE TABLE IF NOT EXISTS reminder_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reminder_id INTEGER NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'sent',
  message TEXT,
  FOREIGN KEY (reminder_id) REFERENCES reminders(id)
);

CREATE TABLE IF NOT EXISTS weather_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plot_id INTEGER NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  forecast_data TEXT,        -- JSON blob of the raw forecast
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plot_id) REFERENCES plots(id)
);

CREATE TABLE IF NOT EXISTS soil_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plot_id INTEGER NOT NULL,
  moisture REAL NOT NULL,
  temp REAL,
  humidity REAL,
  alert_level TEXT DEFAULT 'OK', -- 'OK', 'WARN', 'CRITICAL'
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plot_id) REFERENCES plots(id)
);

CREATE TABLE IF NOT EXISTS map_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE NOT NULL,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

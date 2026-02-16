'use client';

import { useEffect, useMemo, useState } from 'react';

type Zone = {
  city: string;
  zone: string;
  primary?: boolean;
};

type ZoneTime = {
  city: string;
  zone: string;
  primary: boolean;
  hour: number;
  minute: number;
  second: number;
  label: string;
};

const ZONES: Zone[] = [
  { city: 'Paris', zone: 'Europe/Paris', primary: true },
  { city: 'New York', zone: 'America/New_York' },
  { city: 'San Francisco', zone: 'America/Los_Angeles' },
  { city: 'London', zone: 'Europe/London' },
  { city: 'Tokyo', zone: 'Asia/Tokyo' },
  { city: 'Kyiv', zone: 'Europe/Kyiv' },
];

const STORAGE_KEY = 'abvx-world-time-open';

function formatZoneTime(date: Date, zone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || '0');
  const second = Number(parts.find((p) => p.type === 'second')?.value || '0');
  const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return { hour, minute, second, label };
}

function AnalogClock({
  hour,
  minute,
  second,
  day,
  primary,
}: {
  hour: number;
  minute: number;
  second: number;
  day: boolean;
  primary: boolean;
}) {
  const hourAngle = hour * 30 + minute * 0.5;
  const minuteAngle = minute * 6;
  const secondAngle = second * 6;

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      className={`time-dial ${day ? 'is-day' : 'is-night'} ${primary ? 'is-primary' : ''}`}
    >
      <circle cx="50" cy="50" r="47" className="dial-ring" />
      <circle cx="50" cy="50" r="41" className="dial-face" />
      {Array.from({ length: 12 }).map((_, idx) => {
        const angle = idx * 30;
        const major = idx % 3 === 0;
        const x1 = 50 + (major ? 30 : 33) * Math.sin((Math.PI / 180) * angle);
        const y1 = 50 - (major ? 30 : 33) * Math.cos((Math.PI / 180) * angle);
        const x2 = 50 + 37 * Math.sin((Math.PI / 180) * angle);
        const y2 = 50 - 37 * Math.cos((Math.PI / 180) * angle);
        return (
          <line
            key={idx}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={`dial-tick ${major ? 'major' : ''}`}
          />
        );
      })}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="30"
        className="dial-hand hour"
        style={{ transform: `rotate(${hourAngle}deg)` }}
      />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="22"
        className="dial-hand minute"
        style={{ transform: `rotate(${minuteAngle}deg)` }}
      />
      <line
        x1="50"
        y1="54"
        x2="50"
        y2="18"
        className="dial-hand second"
        style={{ transform: `rotate(${secondAngle}deg)` }}
      />
      <circle cx="50" cy="50" r="2.6" className="dial-center" />
    </svg>
  );
}

export default function WorldTimeDock() {
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    try {
      const probe = new Date();
      ZONES.forEach((z) => {
        formatZoneTime(probe, z.zone);
      });
      setAvailable(true);
    } catch {
      setAvailable(false);
      return;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    setOpen(saved === '1');
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (!available) return;

    const cadence = open ? 1000 : 30000;
    const id = window.setInterval(() => {
      setNow(new Date());
    }, cadence);
    return () => window.clearInterval(id);
  }, [open, available]);

  useEffect(() => {
    if (!available) return;
    window.localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
  }, [open, available]);

  const entries = useMemo<ZoneTime[]>(() => {
    const date = now || new Date();
    return ZONES.map((z) => {
      const t = formatZoneTime(date, z.zone);
      return {
        city: z.city,
        zone: z.zone,
        primary: Boolean(z.primary),
        hour: t.hour,
        minute: t.minute,
        second: t.second,
        label: t.label,
      };
    });
  }, [now]);

  if (!available) return null;

  return (
    <>
      <aside
        className={`time-dock ${open ? 'is-open' : 'is-closed'}`}
        aria-label="World time panel"
      >
        <button
          type="button"
          className="time-dock-edge-toggle"
          aria-expanded={open}
          aria-controls="world-time-panel"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="time-edge-icon" aria-hidden="true">
            ◷
          </span>
          <span className="time-edge-label">TIME</span>
        </button>

        <div className="time-dock-panel" id="world-time-panel">
          <div className="time-dock-title">World Time</div>
          <div className="time-dock-list">
            {entries.map((entry) => {
              const day = entry.hour >= 7 && entry.hour < 19;
              return (
                <div
                  key={entry.zone}
                  className={`time-card ${entry.primary ? 'is-primary' : ''}`}
                >
                  <div className="time-card-meta">
                    <div className="time-city-wrap">
                      <div className="time-city">{entry.city}</div>
                      {entry.primary ? <span className="time-pill">My time</span> : null}
                    </div>
                    <div className="time-digital" aria-label={`${entry.city} ${entry.label}`}>
                      {entry.city} {entry.label}
                    </div>
                  </div>
                  <AnalogClock
                    hour={entry.hour}
                    minute={entry.minute}
                    second={entry.second}
                    day={day}
                    primary={entry.primary}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <button
        type="button"
        className="time-mobile-toggle"
        aria-expanded={open}
        aria-controls="world-time-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">◷</span>
        <span>Time</span>
      </button>
    </>
  );
}

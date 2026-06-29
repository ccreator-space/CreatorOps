import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AvatarStack } from "../../components/AvatarStack";
import { calendarAssignments } from "../../lib/mock-data";
import { useAuth } from "../auth/AuthProvider";
import { ContentSheet } from "./ContentSheet";

const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function CalendarPage() {
  const { visibleUsers } = useAuth();
  const [selectedDate, setSelectedDate] = useState("2026-07-01");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const days = useMemo(() => {
    return Array.from({ length: 35 }, (_, index) => {
      const day = index + 1;
      const date = `2026-07-${String(day).padStart(2, "0")}`;

      return {
        day,
        date,
        assignments: calendarAssignments.filter((item) => item.date === date)
      };
    });
  }, []);

  return (
    <section className="calendar-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Social media management</p>
          <h1>Takvim</h1>
        </div>

        <div className="header-actions">
          <AvatarStack users={visibleUsers} />
          <button
            className="primary-button"
            type="button"
            onClick={() => setIsSheetOpen(true)}
          >
            <Plus size={18} />
            Yeni ekle
          </button>
        </div>
      </header>

      <div className="calendar-grid" role="grid" aria-label="İçerik takvimi">
        {weekDays.map((day) => (
          <div className="weekday" key={day}>
            {day}
          </div>
        ))}

        {days.map((day) => (
          <button
            className={`calendar-cell ${selectedDate === day.date ? "is-selected" : ""}`}
            key={day.date}
            type="button"
            onClick={() => setSelectedDate(day.date)}
          >
            <span className="day-number">{day.day}</span>
            <div className="cell-avatars">
              {day.assignments.map((assignment) => (
                <img
                  alt={assignment.user.name}
                  key={assignment.id}
                  src={assignment.user.avatarUrl}
                  title={assignment.user.name}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      <ContentSheet
        isOpen={isSheetOpen}
        selectedDate={selectedDate}
        onClose={() => setIsSheetOpen(false)}
      />
    </section>
  );
}

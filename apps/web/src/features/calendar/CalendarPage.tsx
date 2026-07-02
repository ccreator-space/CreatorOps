import { Plus } from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { AvatarStack } from "../../components/AvatarStack";
import { type UserSummary } from "../../lib/mock-data";
import { useAuth } from "../auth/AuthProvider";
import { ContentSheet } from "./ContentSheet";

const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type CalendarAssignment = {
  id: string;
  date: string;
  user: UserSummary;
};

type AssignmentsResponse = {
  data: CalendarAssignment[];
};

type AssignmentResponse = {
  data: CalendarAssignment;
};

type SheetDefaults = {
  date?: string;
  userId?: string;
};

export function CalendarPage() {
  const { viewer, visibleUsers } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<CalendarAssignment[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetDefaults, setSheetDefaults] = useState<SheetDefaults>({});
  const [statusMessage, setStatusMessage] = useState("Takvim atamaları yükleniyor.");
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  useEffect(() => {
    if (!viewer) {
      return;
    }

    const viewerId = viewer.id;
    let isCurrent = true;

    async function loadAssignments() {
      setStatusMessage("Takvim atamaları yükleniyor.");

      try {
        const response = await fetch(`${apiUrl}/assignments?month=2026-07`, {
          headers: {
            "x-user-id": viewerId
          }
        });

        if (!response.ok) {
          throw new Error("Takvim atamaları alınamadı.");
        }

        const payload = (await response.json()) as AssignmentsResponse;

        if (isCurrent) {
          setAssignments(payload.data);
          setStatusMessage("");
        }
      } catch {
        if (isCurrent) {
          setAssignments([]);
          setStatusMessage("Takvim atamaları API'den alınamadı.");
        }
      }
    }

    void loadAssignments();

    return () => {
      isCurrent = false;
    };
  }, [viewer]);

  const days = useMemo(() => {
    return Array.from({ length: 35 }, (_, index) => {
      const day = index + 1;
      const date = `2026-07-${String(day).padStart(2, "0")}`;

      return {
        day,
        date,
        assignments: assignments.filter((item) => item.date === date)
      };
    });
  }, [assignments]);

  const handleDrop = async (event: DragEvent<HTMLButtonElement>, date: string) => {
    event.preventDefault();

    if (!viewer) {
      return;
    }

    const userId =
      event.dataTransfer.getData("application/x-shipin-user-id") ||
      event.dataTransfer.getData("text/plain");

    if (!userId || isSavingAssignment) {
      return;
    }

    setSelectedDate(date);
    setIsSavingAssignment(true);
    setStatusMessage("Atama kaydediliyor.");

    try {
      const response = await fetch(`${apiUrl}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": viewer.id
        },
        body: JSON.stringify({
          date,
          userId
        })
      });

      if (!response.ok) {
        throw new Error("Atama kaydedilemedi.");
      }

      const payload = (await response.json()) as AssignmentResponse;

      setAssignments((currentAssignments) => {
        const withoutDuplicate = currentAssignments.filter(
          (assignment) =>
            !(assignment.date === payload.data.date && assignment.user.id === payload.data.user.id)
        );

        return [...withoutDuplicate, payload.data];
      });
      setStatusMessage("Atama kaydedildi.");
      setSheetDefaults({
        date,
        userId
      });
      setIsSheetOpen(true);
    } catch {
      setStatusMessage("Atama kaydedilemedi.");
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const openNewContentSheet = () => {
    setSheetDefaults({
      date: selectedDate ?? undefined
    });
    setIsSheetOpen(true);
  };

  if (!viewer) {
    return null;
  }

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
            onClick={openNewContentSheet}
          >
            <Plus size={18} />
            Yeni ekle
          </button>
        </div>
      </header>

      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

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
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, day.date)}
            onClick={() => setSelectedDate(day.date)}
          >
            <span className="day-number">{day.day}</span>
            <div className="cell-avatars">
              {day.assignments.map((assignment) => (
                <img
                  alt={assignment.user.name}
                  key={assignment.id}
                  src={assignment.user.avatarUrl ?? ""}
                  title={assignment.user.name}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      <ContentSheet
        isOpen={isSheetOpen}
        viewerId={viewer.id}
        users={visibleUsers}
        initialDate={sheetDefaults.date}
        initialUserId={sheetDefaults.userId}
        onClose={() => setIsSheetOpen(false)}
        onSaved={() => undefined}
        onStatusChange={setStatusMessage}
      />
    </section>
  );
}

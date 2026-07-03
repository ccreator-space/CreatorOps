import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { AvatarStack } from "../../components/AvatarStack";
import { type UserSummary } from "../../lib/mock-data";
import { useAuth } from "../auth/AuthProvider";
import { ContentSheet } from "./ContentSheet";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type CalendarAssignment = {
  id: string;
  date: string;
  user: UserSummary;
};

type CalendarPost = {
  id: string;
  assigneeId: string;
  scheduledDate: string;
  platform: "linkedin" | "instagram";
  title: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "revision_requested";
  author: UserSummary;
};

type AssignmentsResponse = {
  data: CalendarAssignment[];
};

type PostsResponse = {
  data: CalendarPost[];
};

type AssignmentResponse = {
  data: CalendarAssignment;
};

type SheetDefaults = {
  date?: string;
  userId?: string;
};

function LinkedInLogo() {
  return (
    <svg className="platform-logo" viewBox="0 0 24 24" aria-label="LinkedIn" role="img">
      <rect width="24" height="24" rx="5" fill="#0A66C2" />
      <path
        fill="#ffffff"
        d="M7.15 9.62h3.02v8.23H7.15V9.62Zm1.51-3.98c.97 0 1.72.68 1.72 1.56 0 .9-.75 1.58-1.72 1.58-.96 0-1.71-.68-1.71-1.58 0-.88.75-1.56 1.71-1.56Zm3.16 3.98h2.9v1.13h.04c.4-.75 1.38-1.32 2.54-1.32 2.45 0 3.22 1.47 3.22 3.67v4.75h-3.02v-4.19c0-1-.02-2.07-1.33-2.07-1.33 0-1.53 1.01-1.53 2.01v4.25h-2.82V9.62Z"
      />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg className="platform-logo" viewBox="0 0 24 24" aria-label="Instagram" role="img">
      <defs>
        <linearGradient id="instagram-logo-gradient" x1="2.5" x2="21.5" y1="21.5" y2="2.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEDA75" />
          <stop offset="0.28" stopColor="#FA7E1E" />
          <stop offset="0.5" stopColor="#D62976" />
          <stop offset="0.75" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#instagram-logo-gradient)" />
      <rect x="6.5" y="6.5" width="11" height="11" rx="3.2" fill="none" stroke="#ffffff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="#ffffff" strokeWidth="1.8" />
      <circle cx="16.1" cy="7.9" r="1.05" fill="#ffffff" />
    </svg>
  );
}

export function CalendarPage() {
  const { authHeaders, viewer, visibleUsers } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<CalendarAssignment[]>([]);
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetDefaults, setSheetDefaults] = useState<SheetDefaults>({});
  const [statusMessage, setStatusMessage] = useState("Loading calendar assignments.");
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  const loadCalendarData = useCallback(async () => {
    if (!viewer) {
      return;
    }

    setStatusMessage("Loading calendar.");

    try {
      const [assignmentsResponse, postsResponse] = await Promise.all([
        fetch(`${apiUrl}/assignments?month=2026-07`, {
          headers: authHeaders()
        }),
        fetch(`${apiUrl}/posts?month=2026-07`, {
          headers: authHeaders()
        })
      ]);

      if (!assignmentsResponse.ok || !postsResponse.ok) {
        throw new Error("Calendar data could not be loaded.");
      }

      const assignmentsPayload = (await assignmentsResponse.json()) as AssignmentsResponse;
      const postsPayload = (await postsResponse.json()) as PostsResponse;

      setAssignments(assignmentsPayload.data);
      setPosts(postsPayload.data);
      setStatusMessage("");
    } catch {
      setAssignments([]);
      setPosts([]);
      setStatusMessage("Calendar data could not be loaded from the API.");
    }
  }, [viewer?.id]);

  useEffect(() => {
    void loadCalendarData();
  }, [loadCalendarData]);

  const days = useMemo(() => {
    return Array.from({ length: 35 }, (_, index) => {
      const day = index + 1;
      const date = `2026-07-${String(day).padStart(2, "0")}`;

      return {
        day,
        date,
        assignments: assignments.filter((item) => item.date === date),
        posts: posts.filter((item) => item.scheduledDate === date)
      };
    });
  }, [assignments, posts]);

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
    setStatusMessage("Saving assignment.");

    try {
      const response = await fetch(`${apiUrl}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          date,
          userId
        })
      });

      if (!response.ok) {
        throw new Error("Assignment could not be saved.");
      }

      const payload = (await response.json()) as AssignmentResponse;

      setAssignments((currentAssignments) => {
        const withoutDuplicate = currentAssignments.filter(
          (assignment) =>
            !(assignment.date === payload.data.date && assignment.user.id === payload.data.user.id)
        );

        return [...withoutDuplicate, payload.data];
      });
      toast.success("Assignment saved.");
      setStatusMessage("Assignment saved.");
      setSheetDefaults({
        date,
        userId
      });
      setIsSheetOpen(true);
    } catch {
      toast.error("Assignment could not be saved.");
      setStatusMessage("Assignment could not be saved.");
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
        <h1>Calendar</h1>

        <div className="header-actions">
          <AvatarStack users={visibleUsers} />
          <button
            className="primary-button"
            type="button"
            onClick={openNewContentSheet}
          >
            <Plus size={18} />
            Add content
          </button>
        </div>
      </header>

      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

      <div className="calendar-grid" role="grid" aria-label="Content calendar">
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
            {day.posts.length ? (
              <div className="cell-posts">
                {day.posts.map((post) => (
                  <span className={`cell-post is-${post.status}`} key={post.id}>
                    <img
                      alt={post.author.name}
                      src={post.author.avatarUrl ?? ""}
                      title={post.author.name}
                    />
                    {post.platform === "instagram" ? <InstagramLogo /> : <LinkedInLogo />}
                  </span>
                ))}
              </div>
            ) : null}
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
        authHeaders={authHeaders}
        users={visibleUsers}
        initialDate={sheetDefaults.date}
        initialUserId={sheetDefaults.userId}
        onClose={() => setIsSheetOpen(false)}
        onSaved={loadCalendarData}
        onStatusChange={setStatusMessage}
      />
    </section>
  );
}

import { ChevronLeft, ChevronRight, Lightbulb, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type KeyboardEvent
} from "react";
import { AvatarStack } from "../../components/AvatarStack";
import { type UserSummary } from "../../lib/mock-data";
import { useAuth } from "../auth/AuthProvider";
import { ContentIdeaSheet, type EditableContentIdea } from "./ContentIdeaSheet";
import { ContentSheet, type ContentAttachment, type EditableContentPost } from "./ContentSheet";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
  year: "numeric"
});

type CalendarAssignment = {
  id: string;
  date: string;
  user: UserSummary;
};

type CalendarPost = EditableContentPost & {
  status: "draft" | "pending_review" | "approved" | "rejected" | "revision_requested";
  author: UserSummary;
  attachments: ContentAttachment[];
};

type AssignmentsResponse = {
  data: CalendarAssignment[];
};

type PostsResponse = {
  data: CalendarPost[];
};

type ContentIdeasResponse = {
  data: EditableContentIdea[];
};

type AssignmentResponse = {
  data: CalendarAssignment;
};

type SheetDefaults = {
  date?: string;
  userId?: string;
};

type IdeaSheetState = {
  isOpen: boolean;
  idea: EditableContentIdea | null;
  initialDate?: string;
};

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toMonthOnly(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthParts(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    year,
    monthIndex: monthNumber - 1
  };
}

function addMonths(month: string, offset: number) {
  const { year, monthIndex } = getMonthParts(month);

  return toDateOnly(new Date(Date.UTC(year, monthIndex + offset, 1))).slice(0, 7);
}

function getMonthLabel(month: string) {
  const { year, monthIndex } = getMonthParts(month);

  return monthFormatter.format(new Date(Date.UTC(year, monthIndex, 1)));
}

function getCalendarDays(month: string) {
  const { year, monthIndex } = getMonthParts(month);
  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const firstWeekdayIndex = (monthStart.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const visibleDayCount = Math.ceil((firstWeekdayIndex + daysInMonth) / 7) * 7;

  return Array.from({ length: visibleDayCount }, (_, index) => {
    const date = new Date(Date.UTC(year, monthIndex, index - firstWeekdayIndex + 1));

    return {
      date: toDateOnly(date),
      day: date.getUTCDate(),
      isOutsideMonth: date.getUTCMonth() !== monthIndex
    };
  });
}

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
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthOnly(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(() => toDateOnly(new Date()));
  const [assignments, setAssignments] = useState<CalendarAssignment[]>([]);
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [ideas, setIdeas] = useState<EditableContentIdea[]>([]);
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetDefaults, setSheetDefaults] = useState<SheetDefaults>({});
  const [ideaSheet, setIdeaSheet] = useState<IdeaSheetState>({
    isOpen: false,
    idea: null
  });
  const [statusMessage, setStatusMessage] = useState("Loading calendar assignments.");
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  const loadCalendarData = useCallback(async () => {
    if (!viewer) {
      return;
    }

    setStatusMessage("Loading calendar.");

    try {
      const [assignmentsResponse, postsResponse, ideasResponse] = await Promise.all([
        fetch(`${apiUrl}/assignments?month=${selectedMonth}`, {
          headers: authHeaders()
        }),
        fetch(`${apiUrl}/posts?month=${selectedMonth}`, {
          headers: authHeaders()
        }),
        fetch(`${apiUrl}/content-ideas?month=${selectedMonth}`, {
          headers: authHeaders()
        })
      ]);

      if (!assignmentsResponse.ok || !postsResponse.ok || !ideasResponse.ok) {
        throw new Error("Calendar data could not be loaded.");
      }

      const assignmentsPayload = (await assignmentsResponse.json()) as AssignmentsResponse;
      const postsPayload = (await postsResponse.json()) as PostsResponse;
      const ideasPayload = (await ideasResponse.json()) as ContentIdeasResponse;

      setAssignments(assignmentsPayload.data);
      setPosts(postsPayload.data);
      setIdeas(ideasPayload.data);
      setStatusMessage("");
    } catch {
      setAssignments([]);
      setPosts([]);
      setIdeas([]);
      setStatusMessage("Calendar data could not be loaded from the API.");
    }
  }, [selectedMonth, viewer?.id]);

  useEffect(() => {
    void loadCalendarData();
  }, [loadCalendarData]);

  const days = useMemo(() => {
    return getCalendarDays(selectedMonth).map((calendarDay) => ({
      ...calendarDay,
      assignments: assignments.filter((item) => item.date === calendarDay.date),
      posts: posts.filter((item) => item.scheduledDate === calendarDay.date),
      ideas: ideas.filter((item) => item.date === calendarDay.date)
    }));
  }, [assignments, ideas, posts, selectedMonth]);

  const handleMonthChange = (offset: number) => {
    const nextMonth = addMonths(selectedMonth, offset);

    setSelectedMonth(nextMonth);
    setSelectedDate(`${nextMonth}-01`);
    setActiveIdeaId(null);
    setActivePostId(null);
    setEditingPost(null);
    setIsSheetOpen(false);
    setIdeaSheet({
      isOpen: false,
      idea: null
    });
  };

  const canMutatePost = (post: CalendarPost) => {
    if (!viewer) {
      return false;
    }

    return viewer.role === "admin" || (post.author.id === viewer.id && post.status !== "approved");
  };

  const handleIdeaDelete = async (idea: EditableContentIdea) => {
    if (!viewer || viewer.role !== "admin") {
      return;
    }

    const shouldDelete = window.confirm("Delete this content idea?");

    if (!shouldDelete) {
      return;
    }

    setActiveIdeaId(null);
    setStatusMessage("Deleting content idea.");

    try {
      const response = await fetch(`${apiUrl}/content-ideas/${idea.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Content idea could not be deleted.");
      }

      setIdeas((currentIdeas) => currentIdeas.filter((item) => item.id !== idea.id));
      toast.success("Content idea deleted.");
      setStatusMessage("Content idea deleted.");
    } catch {
      toast.error("Content idea could not be deleted.");
      setStatusMessage("Content idea could not be deleted.");
    }
  };

  const handleIdeaMove = async (ideaId: string, date: string) => {
    if (!viewer || viewer.role !== "admin") {
      return;
    }

    const idea = ideas.find((item) => item.id === ideaId);

    if (!idea || idea.date === date) {
      return;
    }

    setSelectedDate(date);
    setActiveIdeaId(null);
    setStatusMessage("Moving content idea.");

    try {
      const response = await fetch(`${apiUrl}/content-ideas/${idea.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          date,
          title: idea.title,
          description: idea.description ?? ""
        })
      });

      if (!response.ok) {
        throw new Error("Content idea could not be moved.");
      }

      const nextMonth = date.slice(0, 7);
      setIdeas((currentIdeas) =>
        currentIdeas.map((item) => (item.id === idea.id ? { ...item, date } : item))
      );
      setSelectedMonth(nextMonth);
      toast.success("Content idea moved.");
      setStatusMessage("Content idea moved.");

      if (nextMonth === selectedMonth) {
        void loadCalendarData();
      }
    } catch {
      toast.error("Content idea could not be moved.");
      setStatusMessage("Content idea could not be moved.");
    }
  };

  const handlePostDelete = async (post: CalendarPost) => {
    if (!canMutatePost(post)) {
      return;
    }

    const shouldDelete = window.confirm("Delete this content?");

    if (!shouldDelete) {
      return;
    }

    setActivePostId(null);
    setStatusMessage("Deleting content.");

    try {
      const response = await fetch(`${apiUrl}/posts/${post.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Content could not be deleted.");
      }

      setPosts((currentPosts) => currentPosts.filter((item) => item.id !== post.id));
      toast.success("Content deleted.");
      setStatusMessage("Content deleted.");
    } catch {
      toast.error("Content could not be deleted.");
      setStatusMessage("Content could not be deleted.");
    }
  };

  const handlePostMove = async (postId: string, date: string) => {
    const post = posts.find((item) => item.id === postId);

    if (!post || post.scheduledDate === date || !canMutatePost(post)) {
      return;
    }

    setSelectedDate(date);
    setActivePostId(null);
    setStatusMessage("Moving content.");

    try {
      const body = new FormData();
      body.set("scheduledDate", date);
      body.set("assigneeId", post.assigneeId);
      body.set("platform", post.platform);
      body.set("title", post.title);
      body.set("content", post.content);
      post.attachments.forEach((attachment) => {
        body.append("keepAttachmentIds", attachment.id);
      });

      const response = await fetch(`${apiUrl}/posts/${post.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body
      });

      if (!response.ok) {
        throw new Error("Content could not be moved.");
      }

      const nextMonth = date.slice(0, 7);
      setPosts((currentPosts) =>
        currentPosts.map((item) => (item.id === post.id ? { ...item, scheduledDate: date } : item))
      );
      setSelectedMonth(nextMonth);
      toast.success("Content moved.");
      setStatusMessage("Content moved.");

      if (nextMonth === selectedMonth) {
        void loadCalendarData();
      }
    } catch {
      toast.error("Content could not be moved.");
      setStatusMessage("Content could not be moved.");
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>, date: string) => {
    event.preventDefault();

    if (!viewer) {
      return;
    }

    const ideaId = event.dataTransfer.getData("application/x-creatorops-content-idea-id");

    if (ideaId) {
      await handleIdeaMove(ideaId, date);
      return;
    }

    const postId = event.dataTransfer.getData("application/x-creatorops-post-id");

    if (postId) {
      await handlePostMove(postId, date);
      return;
    }

    const userId =
      event.dataTransfer.getData("application/x-shipin-user-id") ||
      event.dataTransfer.getData("text/plain");

    if (!userId || isSavingAssignment) {
      return;
    }

    setSelectedDate(date);
    setSelectedMonth(date.slice(0, 7));
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
      setIdeaSheet({
        isOpen: false,
        idea: null
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
    setEditingPost(null);
    setActivePostId(null);
    setActiveIdeaId(null);
    setSheetDefaults({
      date: selectedDate ?? `${selectedMonth}-01`
    });
    setIdeaSheet({
      isOpen: false,
      idea: null
    });
    setIsSheetOpen(true);
  };

  const openExistingPostSheet = (post: CalendarPost) => {
    if (!canMutatePost(post)) {
      return;
    }

    setEditingPost(post);
    setSelectedDate(post.scheduledDate);
    setSelectedMonth(post.scheduledDate.slice(0, 7));
    setActivePostId(null);
    setActiveIdeaId(null);
    setIdeaSheet({
      isOpen: false,
      idea: null
    });
    setIsSheetOpen(true);
  };

  const openNewIdeaSheet = (date = selectedDate ?? `${selectedMonth}-01`) => {
    if (!viewer || viewer.role !== "admin") {
      return;
    }

    setSelectedDate(date);
    setSelectedMonth(date.slice(0, 7));
    setActiveIdeaId(null);
    setActivePostId(null);
    setIsSheetOpen(false);
    setIdeaSheet({
      isOpen: true,
      idea: null,
      initialDate: date
    });
  };

  const openExistingIdeaSheet = (idea: EditableContentIdea) => {
    setSelectedDate(idea.date);
    setSelectedMonth(idea.date.slice(0, 7));
    setActiveIdeaId(null);
    setActivePostId(null);
    setIsSheetOpen(false);
    setIdeaSheet({
      isOpen: true,
      idea,
      initialDate: idea.date
    });
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setSelectedMonth(date.slice(0, 7));
    setActiveIdeaId(null);
    setActivePostId(null);
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLDivElement>, date: string) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleDayClick(date);
  };

  const handleIdeaDragStart = (event: DragEvent<HTMLButtonElement>, idea: EditableContentIdea) => {
    if (!viewer || viewer.role !== "admin") {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-creatorops-content-idea-id", idea.id);
  };

  const handlePostDragStart = (event: DragEvent<HTMLButtonElement>, post: CalendarPost) => {
    if (!canMutatePost(post)) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-creatorops-post-id", post.id);
  };

  const closeContentSheet = () => {
    setIsSheetOpen(false);
    setEditingPost(null);
  };

  if (!viewer) {
    return null;
  }

  return (
    <section className="calendar-page">
      <header className="page-header">
        <div className="calendar-heading">
          <h1>Calendar</h1>
          <div className="calendar-month-control" aria-label="Calendar month">
            <button
              className="icon-button"
              type="button"
              onClick={() => handleMonthChange(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <span>{getMonthLabel(selectedMonth)}</span>
            <button
              className="icon-button"
              type="button"
              onClick={() => handleMonthChange(1)}
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="header-actions">
          <AvatarStack users={visibleUsers} />
          {viewer.role === "admin" ? (
            <button className="secondary-button" type="button" onClick={() => openNewIdeaSheet()}>
              <Lightbulb size={18} />
              Add idea
            </button>
          ) : null}
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
          <div
            className={`calendar-cell ${selectedDate === day.date ? "is-selected" : ""} ${
              day.isOutsideMonth ? "is-outside-month" : ""
            }`}
            key={day.date}
            role="gridcell"
            tabIndex={0}
            aria-label={`${day.date} calendar day`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, day.date)}
            onClick={() => handleDayClick(day.date)}
            onKeyDown={(event) => handleDayKeyDown(event, day.date)}
          >
            <span className="day-number">{day.day}</span>
            {day.ideas.length ? (
              <div className="cell-ideas">
                {day.ideas.map((idea) => (
                  <div className="cell-idea-wrap" key={idea.id}>
                    <button
                      className="cell-idea"
                      draggable={viewer.role === "admin"}
                      type="button"
                      title={idea.title}
                      onClick={(event) => {
                        event.stopPropagation();

                        if (viewer.role === "admin") {
                          setActivePostId(null);
                          setActiveIdeaId((currentIdeaId) =>
                            currentIdeaId === idea.id ? null : idea.id
                          );
                          return;
                        }

                        openExistingIdeaSheet(idea);
                      }}
                      onDragStart={(event) => handleIdeaDragStart(event, idea)}
                    >
                      <Lightbulb size={13} />
                      <img
                        alt={idea.createdBy.name}
                        src={idea.createdBy.avatarUrl ?? ""}
                        title={idea.createdBy.name}
                      />
                    </button>

                    {activeIdeaId === idea.id && viewer.role === "admin" ? (
                      <div
                        className="idea-toolbox"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => openExistingIdeaSheet(idea)}
                          aria-label="Edit content idea"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button is-danger"
                          type="button"
                          onClick={() => void handleIdeaDelete(idea)}
                          aria-label="Delete content idea"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            {day.posts.length ? (
              <div className="cell-posts">
                {day.posts.map((post) => (
                  <div className="cell-post-wrap" key={post.id}>
                    <button
                      className={`cell-post is-${post.status}`}
                      draggable={canMutatePost(post)}
                      type="button"
                      title={post.title}
                      onClick={(event) => {
                        event.stopPropagation();

                        if (canMutatePost(post)) {
                          setActiveIdeaId(null);
                          setActivePostId((currentPostId) =>
                            currentPostId === post.id ? null : post.id
                          );
                        }
                      }}
                      onDragStart={(event) => handlePostDragStart(event, post)}
                    >
                      <img
                        alt={post.author.name}
                        src={post.author.avatarUrl ?? ""}
                        title={post.author.name}
                      />
                      {post.platform === "instagram" ? <InstagramLogo /> : <LinkedInLogo />}
                    </button>

                    {activePostId === post.id && canMutatePost(post) ? (
                      <div
                        className="idea-toolbox"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => openExistingPostSheet(post)}
                          aria-label="Edit content"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button is-danger"
                          type="button"
                          onClick={() => void handlePostDelete(post)}
                          aria-label="Delete content"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : null}
                  </div>
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
          </div>
        ))}
      </div>

      <ContentSheet
        isOpen={isSheetOpen}
        authHeaders={authHeaders}
        users={visibleUsers}
        editingPost={editingPost}
        initialDate={sheetDefaults.date}
        initialUserId={sheetDefaults.userId}
        onClose={closeContentSheet}
        onSaved={loadCalendarData}
        onStatusChange={setStatusMessage}
      />
      <ContentIdeaSheet
        isOpen={ideaSheet.isOpen}
        authHeaders={authHeaders}
        idea={ideaSheet.idea}
        initialDate={ideaSheet.initialDate}
        canEdit={viewer.role === "admin"}
        onClose={() =>
          setIdeaSheet({
            isOpen: false,
            idea: null
          })
        }
        onSaved={loadCalendarData}
        onStatusChange={setStatusMessage}
      />
    </section>
  );
}

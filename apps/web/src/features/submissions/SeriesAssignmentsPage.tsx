import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ListPageTemplate } from "../../components/ListPageTemplate";
import { useAuth } from "../auth/AuthProvider";
import {
  submissionConfigs,
  submissionTypeLabels,
  submissionTypes,
  type SubmissionType
} from "./submission-config";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type SeriesAssignment = {
  id: string;
  seriesType: SubmissionType;
  user: {
    id: string;
    name: string;
  };
};

type SeriesAssignmentsResponse = {
  data: SeriesAssignment[];
};

type AssignmentRow = {
  type: SubmissionType;
};

function createEmptySelection() {
  return submissionTypes.reduce<Record<SubmissionType, string[]>>((selection, type) => {
    selection[type] = [];
    return selection;
  }, {} as Record<SubmissionType, string[]>);
}

export function SeriesAssignmentsPage() {
  const { authHeaders, users, viewer } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<Record<SubmissionType, string[]>>(createEmptySelection);
  const [statusMessage, setStatusMessage] = useState("Seri atamaları yükleniyor.");
  const [isSaving, setIsSaving] = useState(false);
  const assignableUsers = users.filter((user) => user.role === "user");

  async function loadAssignments() {
    if (!viewer || viewer.role !== "admin") {
      return;
    }

    setStatusMessage("Seri atamaları yükleniyor.");

    try {
      const response = await fetch(`${apiUrl}/submission-series-assignments`, {
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Atamalar alınamadı.");
      }

      const payload = (await response.json()) as SeriesAssignmentsResponse;
      const nextSelection = createEmptySelection();
      payload.data.forEach((assignment) => {
        nextSelection[assignment.seriesType].push(assignment.user.id);
      });
      setSelectedUsers(nextSelection);
      setStatusMessage("");
    } catch {
      setStatusMessage("Seri atamaları alınamadı.");
    }
  }

  useEffect(() => {
    void loadAssignments();
  }, [viewer?.id]);

  const toggleUser = (type: SubmissionType, userId: string) => {
    setSelectedUsers((currentSelection) => {
      const currentUsers = currentSelection[type];
      const nextUsers = currentUsers.includes(userId)
        ? currentUsers.filter((selectedUserId) => selectedUserId !== userId)
        : [...currentUsers, userId];

      return {
        ...currentSelection,
        [type]: nextUsers
      };
    });
  };

  const saveAssignments = async () => {
    setIsSaving(true);
    setStatusMessage("Seri atamaları kaydediliyor.");

    try {
      const response = await fetch(`${apiUrl}/submission-series-assignments`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          assignments: submissionTypes.map((type) => ({
            seriesType: type,
            userIds: selectedUsers[type]
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Atamalar kaydedilemedi.");
      }

      toast.success("Seri atamaları kaydedildi.");
      setStatusMessage("Seri atamaları kaydedildi.");
      await loadAssignments();
    } catch {
      toast.error("Seri atamaları kaydedilemedi.");
      setStatusMessage("Seri atamaları kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!viewer || viewer.role !== "admin") {
    return null;
  }

  return (
    <ListPageTemplate
      title="Seri Atamaları"
      actions={
        <button className="primary-button" type="button" disabled={isSaving} onClick={saveAssignments}>
          <Save size={18} />
          Kaydet
        </button>
      }
      columns={[
        {
          key: "series",
          header: "Seri",
          render: (row: AssignmentRow) => (
            <div className="table-primary">
              <strong>{submissionTypeLabels[row.type]}</strong>
              <span>{submissionConfigs[row.type].description}</span>
            </div>
          )
        },
        {
          key: "users",
          header: "Atanan Kullanıcılar",
          render: (row: AssignmentRow) => (
            <div className="assignment-picker">
              {assignableUsers.map((user) => (
                <label key={user.id}>
                  <input
                    type="checkbox"
                    checked={selectedUsers[row.type].includes(user.id)}
                    onChange={() => toggleUser(row.type, user.id)}
                  />
                  {user.name}
                </label>
              ))}
            </div>
          )
        }
      ]}
      rows={submissionTypes.map((type) => ({ type }))}
      getRowId={(row) => row.type}
      statusMessage={statusMessage}
      emptyMessage="Seri ataması yok."
    />
  );
}

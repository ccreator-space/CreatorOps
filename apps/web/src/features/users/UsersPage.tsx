import { KeyRound, Pencil, UserCheck, UserPlus, UserX } from "lucide-react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { ListPageTemplate, type ListColumn } from "../../components/ListPageTemplate";
import { Modal } from "../../components/Modal";
import type { UserRole, UserSummary } from "../../lib/mock-data";
import { useAuth } from "../auth/AuthProvider";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type UserDraft = {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl: string;
  password: string;
};

type UserResponse = {
  data: UserSummary;
};

const emptyDraft: UserDraft = {
  name: "",
  email: "",
  role: "user",
  isActive: true,
  avatarUrl: "",
  password: ""
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  user: "User"
};

function pickRandom(items: string) {
  const values = crypto.getRandomValues(new Uint32Array(1));
  return items[values[0] % items.length];
}

function shuffle(value: string) {
  return value
    .split("")
    .map((character) => ({
      character,
      sort: crypto.getRandomValues(new Uint32Array(1))[0]
    }))
    .sort((left, right) => left.sort - right.sort)
    .map((item) => item.character)
    .join("");
}

function generatePassword() {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%";
  const all = `${uppercase}${lowercase}${numbers}${symbols}`;
  const required = [
    pickRandom(uppercase),
    pickRandom(lowercase),
    pickRandom(numbers),
    pickRandom(symbols)
  ];
  const rest = Array.from({ length: 10 }, () => pickRandom(all));

  return shuffle([...required, ...rest].join(""));
}

function createCredentialsText(user: UserSummary, password: string) {
  return `Shipin login\nName: ${user.name}\nEmail: ${user.email}\nPassword: ${password}`;
}

export function UsersPage() {
  const { authHeaders, refreshUsers, users, viewer } = useAuth();
  const [draft, setDraft] = useState<UserDraft | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setDraft({
      ...emptyDraft,
      password: generatePassword()
    });
  };

  const openEditModal = (user: UserSummary) => {
    setDraft({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl ?? "",
      password: ""
    });
  };

  const updateDraft = (patch: Partial<UserDraft>) => {
    setDraft((currentDraft) => (currentDraft ? { ...currentDraft, ...patch } : currentDraft));
  };

  const copyCredentials = async (user: UserSummary, password: string) => {
    await navigator.clipboard.writeText(createCredentialsText(user, password));
  };

  const saveUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft) {
      return;
    }

    const name = draft.name.trim();
    const email = draft.email.trim().toLowerCase();
    const avatarUrl = draft.avatarUrl.trim();

    if (!name || !email || (!draft.id && !draft.password)) {
      toast.error("Name, email, and password are required.");
      return;
    }

    setIsSaving(true);
    setStatusMessage(draft.id ? "Updating user." : "Creating user.");

    try {
      const response = await fetch(draft.id ? `${apiUrl}/users/${draft.id}` : `${apiUrl}/users`, {
        method: draft.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          name,
          email,
          role: draft.role,
          avatarUrl: avatarUrl || null,
          isActive: draft.isActive,
          ...(draft.id ? {} : { password: draft.password })
        })
      });

      if (!response.ok) {
        throw new Error("User could not be saved.");
      }

      const payload = (await response.json()) as UserResponse;
      await refreshUsers();

      if (!draft.id) {
        try {
          await copyCredentials(payload.data, draft.password);
          toast.success("User created and credentials copied.");
        } catch {
          toast.success("User created. Credentials could not be copied automatically.");
        }
      } else {
        toast.success("User updated.");
      }

      setStatusMessage(draft.id ? "User updated." : "User created.");
      setDraft(null);
    } catch {
      toast.error("User could not be saved.");
      setStatusMessage("User could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserStatus = async (user: UserSummary) => {
    setActiveUserId(user.id);
    setStatusMessage(user.isActive ? "Deactivating user." : "Reactivating user.");

    try {
      const response = await fetch(`${apiUrl}/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isActive: !user.isActive
        })
      });

      if (!response.ok) {
        throw new Error("User status could not be updated.");
      }

      await refreshUsers();
      toast.success(user.isActive ? "User deactivated." : "User reactivated.");
      setStatusMessage(user.isActive ? "User deactivated." : "User reactivated.");
    } catch {
      toast.error("User status could not be updated.");
      setStatusMessage("User status could not be updated.");
    } finally {
      setActiveUserId(null);
    }
  };

  const columns: Array<ListColumn<UserSummary>> = [
    {
      key: "user",
      header: "User",
      render: (user) => (
        <div className="user-cell">
          <img alt={user.name} src={user.avatarUrl ?? ""} />
          <div className="table-primary">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>
      )
    },
    {
      key: "role",
      header: "Role",
      width: "120px",
      render: (user) => (
        <span className={`status-pill ${user.role === "admin" ? "is-assigned" : "is-draft"}`}>
          {roleLabels[user.role]}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (user) => (
        <span className={`status-pill ${user.isActive ? "is-approved" : "is-archived"}`}>
          {user.isActive ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "104px",
      render: (user) => (
        <div className="table-actions">
          <button className="icon-button" type="button" aria-label="Edit user" onClick={() => openEditModal(user)}>
            <Pencil size={18} />
          </button>
          <button
            className={`icon-button ${user.isActive ? "is-danger" : ""}`}
            type="button"
            aria-label={user.isActive ? "Deactivate user" : "Reactivate user"}
            disabled={activeUserId === user.id || viewer?.id === user.id}
            onClick={() => toggleUserStatus(user)}
          >
            {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
          </button>
        </div>
      )
    }
  ];

  if (!viewer || viewer.role !== "admin") {
    return null;
  }

  return (
    <>
      <ListPageTemplate
        title="Users"
        actions={
          <button className="primary-button" type="button" onClick={openCreateModal}>
            <UserPlus size={18} />
            Add user
          </button>
        }
        columns={columns}
        rows={users}
        getRowId={(user) => user.id}
        statusMessage={statusMessage}
        emptyMessage="No users yet."
      />

      {draft ? (
        <Modal
          title={draft.id ? "Edit user" : "Add user"}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button className="secondary-button" type="button" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button className="primary-button" type="submit" form="user-form" disabled={isSaving}>
                {draft.id ? "Save changes" : "Create user"}
              </button>
            </>
          }
        >
          <form className="modal-form" id="user-form" onSubmit={saveUser}>
            <label>
              Name
              <input value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
            </label>
            <label>
              Email
              <input type="email" value={draft.email} onChange={(event) => updateDraft({ email: event.target.value })} />
            </label>
            <label>
              Role
              <select value={draft.role} onChange={(event) => updateDraft({ role: event.target.value as UserRole })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Status
              <select value={draft.isActive ? "true" : "false"} onChange={(event) => updateDraft({ isActive: event.target.value === "true" })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            <label>
              Avatar URL
              <input value={draft.avatarUrl} onChange={(event) => updateDraft({ avatarUrl: event.target.value })} />
            </label>
            {!draft.id ? (
              <label>
                Password
                <span className="inline-input-action">
                  <input value={draft.password} onChange={(event) => updateDraft({ password: event.target.value })} />
                  <button className="icon-button" type="button" aria-label="Generate password" onClick={() => updateDraft({ password: generatePassword() })}>
                    <KeyRound size={18} />
                  </button>
                </span>
              </label>
            ) : null}
          </form>
        </Modal>
      ) : null}
    </>
  );
}

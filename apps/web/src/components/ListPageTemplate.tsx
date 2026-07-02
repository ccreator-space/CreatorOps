import type { ReactNode } from "react";

export type ListColumn<TItem> = {
  key: string;
  header: string;
  align?: "left" | "right";
  width?: string;
  render: (item: TItem) => ReactNode;
};

type ListPageTemplateProps<TItem> = {
  title: string;
  actions?: ReactNode;
  columns: Array<ListColumn<TItem>>;
  rows: TItem[];
  getRowId: (item: TItem) => string;
  statusMessage?: string;
  emptyMessage: string;
};

export function ListPageTemplate<TItem>({
  title,
  actions,
  columns,
  rows,
  getRowId,
  statusMessage,
  emptyMessage
}: ListPageTemplateProps<TItem>) {
  return (
    <section className="list-page">
      <header className="page-header">
        <h1>{title}</h1>
        {actions ? <div className="header-actions">{actions}</div> : null}
      </header>

      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

      <div className="list-table-wrap">
        <table className="list-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  className={column.align === "right" ? "is-right" : undefined}
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={getRowId(row)}>
                  {columns.map((column) => (
                    <td
                      className={column.align === "right" ? "is-right" : undefined}
                      key={column.key}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

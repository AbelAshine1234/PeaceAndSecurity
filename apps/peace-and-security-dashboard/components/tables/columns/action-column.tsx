import { Column, TableActions } from "../types";
import { ActionButtons } from "./action-button";

export const actionsColumn = <T,>(actions: TableActions<T>): Column<T> => ({
  key: "actions",
  header: "Actions",
  render: (row) => <ActionButtons row={row} actions={actions} />,
});

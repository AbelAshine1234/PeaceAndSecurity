import { Column } from "../types";

export const indexColumn = <T,>(): Column<T> => ({
  key: "index",
  header: "#",
  render: (_, index) => String(index + 1).padStart(2, "0"),
});

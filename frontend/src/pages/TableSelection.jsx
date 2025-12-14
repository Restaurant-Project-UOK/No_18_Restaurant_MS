import { useTable } from "../context/TableContext";

export default function TableSelection() {
  const { tableId } = useTable();

  return (
    <div>
      <h2>Table Selection</h2>
      <p>Current Table: {tableId || "No table selected"}</p>
      <p>Scan QR code to select a table.</p>
    </div>
  );
}

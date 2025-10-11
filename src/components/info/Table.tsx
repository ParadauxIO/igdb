import { flexRender, type Table as RTable } from "@tanstack/react-table";
import "./Table.scss";
import type { Key } from "react";

type TableProps = {
    loading: boolean;
    table: RTable<any>;
};

export default function Table({ loading, table }: TableProps) {
    return (
        <div className="table-container">
            {!loading && (
                <table>
                    <thead>
                    {table.getHeaderGroups().map((headerGroup: { id: Key; headers: any[] }) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const canSort = header.column.getCanSort?.();
                                const sorted = header.column.getIsSorted?.(); // 'asc' | 'desc' | false
                                const ariaSort =
                                    sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none";

                                return (
                                    <th key={header.id} aria-sort={ariaSort}>
                                        {header.isPlaceholder ? null : (
                                            <button
                                                type="button"
                                                className={`th-btn ${canSort ? "sortable" : ""}`}
                                                onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                                title={
                                                    canSort
                                                        ? "Click to sort. Shift-click for multi-sort."
                                                        : undefined
                                                }
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {canSort && (
                                                    <span className="sort-indicator">
                              {sorted === "asc" ? " ↑" : sorted === "desc" ? " ↓" : " ↕"}
                            </span>
                                                )}
                                            </button>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                    </thead>

                    <tbody>
                    {table.getRowModel().rows.map((row: { id: Key; getVisibleCells: () => any[] }) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
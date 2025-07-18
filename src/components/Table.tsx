import {flexRender, type Table} from "@tanstack/react-table";

import "./Table.scss"
import type { Key } from "react";

type TableProps = {
    loading: boolean;
    // can this table be made generic to support listing Users as well?
    table: Table<any>;
};

export default function Table({loading, table}: TableProps) {
    return (
        <div className="table-container">
            {!loading && (
                <table>
                    <thead>
                    {table.getHeaderGroups().map((headerGroup: { id: Key | null | undefined; headers: any[]; }) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                    </thead>
                    <tbody>
                    {table.getRowModel().rows.map((row: { id: Key | null | undefined; getVisibleCells: () => any[]; }) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
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


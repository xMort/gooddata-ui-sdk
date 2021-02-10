// (C) 2007-2021 GoodData Corporation
import { ColDef, ValueFormatterParams } from "@ag-grid-community/all-modules";
import { InternalTableState } from "./internalState";
import { ICorePivotTableProps } from "./types";
import { cellClassFactory, headerClassFactory } from "./tableStyling";
import { AVAILABLE_TOTALS } from "./impl/base/constants";
import { createCellRenderer, getMeasureCellFormattedValue, getMeasureCellStyle } from "./impl/data/tableCell";
import cx from "classnames";
import { invariant } from "ts-invariant";
import { isDataColLeaf } from "./impl/structure/tableDescriptorTypes";

export function rowAttributeTemplate(
    table: InternalTableState,
    props: Readonly<ICorePivotTableProps>,
): ColDef {
    const cellRenderer = createCellRenderer();

    return {
        cellClass: cellClassFactory(table, props, "gd-row-attribute-column"),
        headerClass: headerClassFactory(table, props, "gd-row-attribute-column-header"),
        colSpan: (params) => {
            if (
                // params.data is undefined when rows are in loading state
                params.data &&
                params.data.colSpan &&
                AVAILABLE_TOTALS.find((item: string) => item === params.data[params.data.colSpan.headerKey])
            ) {
                return params.data.colSpan.count;
            }
            return 1;
        },
        valueFormatter: (params) => {
            return params.value === undefined ? null : params.value;
        },
        cellRenderer,
    };
}

export function columnAttributeTemplate(
    table: InternalTableState,
    props: Readonly<ICorePivotTableProps>,
): ColDef {
    return {
        cellClass: cellClassFactory(table, props, "gd-column-attribute-column"),
        headerClass: headerClassFactory(table, props, "gd-column-attribute-column-header"),
    };
}

const AG_NUMERIC_CELL_CLASSNAME = "ag-numeric-cell";
const AG_NUMERIC_HEADER_CLASSNAME = "ag-numeric-header";

export function measureColumnTemplate(
    table: InternalTableState,
    props: Readonly<ICorePivotTableProps>,
): ColDef {
    const cellRenderer = createCellRenderer();
    const separators = props.config?.separators;

    return {
        cellClass: cellClassFactory(table, props, cx(AG_NUMERIC_CELL_CLASSNAME, "gd-measure-column")),
        headerClass: headerClassFactory(
            table,
            props,
            cx(AG_NUMERIC_HEADER_CLASSNAME, "gd-measure-column-header"),
        ),
        // wrong params type from ag-grid, we need any
        valueFormatter: (params: ValueFormatterParams) => {
            const colDesc = table.tableDescriptor.getCol(params.colDef);

            invariant(isDataColLeaf(colDesc));

            return params.value !== undefined
                ? getMeasureCellFormattedValue(
                      params.value,
                      colDesc.seriesDescriptor.measureFormat(),
                      separators,
                  )
                : (null as any);
        },
        cellStyle: (params) => {
            const colDesc = table.tableDescriptor.getCol(params.colDef);

            invariant(isDataColLeaf(colDesc));

            return params.value !== undefined
                ? getMeasureCellStyle(
                      params.value,
                      colDesc.seriesDescriptor.measureFormat(),
                      separators,
                      true,
                  )
                : null;
        },
        cellRenderer,
    };
}

// (C) 2007-2024 GoodData Corporation
import React from "react";
import { IDashboardLayoutSectionRenderer } from "./interfaces.js";
import { implicitLayoutItemSizeFromXlSize } from "./utils/sizing.js";
import { GRID_COLUMNS_COUNT } from "./constants.js";
// import cx from "classnames";

// const isHiddenStyle = { height: 0, width: 0, overflow: "hidden", flex: 0 };
// const defaultStyle = {};

export const DashboardLayoutSectionRenderer: IDashboardLayoutSectionRenderer<unknown> = (props) => {
    const { children, section, screen /*, className, debug, isHidden*/ } = props;

    // const style = isHidden ? isHiddenStyle : defaultStyle;
    console.log("XXXX DashboardLayoutSectionRenderer");

    const possibleLayoutSizes = implicitLayoutItemSizeFromXlSize(section.raw().size!);
    const layoutSize = possibleLayoutSizes[screen];

    // TODO move the functionality to widget itself, no wrapper here to fuck up the grid
    return (
        // <div
        //     className={cx(["gd-fluidlayout-row", "s-fluid-layout-row", className], {
        //         "gd-fluidlayout-row-debug": debug,
        //     })}
        //     style={style}
        // >
        <div
            className={`gd-grid-layout__item--section gd-grid-layout__item--span-${
                layoutSize?.gridWidth ?? GRID_COLUMNS_COUNT
            }`}
        >
            {children}
        </div>
        // </div>
    );
};

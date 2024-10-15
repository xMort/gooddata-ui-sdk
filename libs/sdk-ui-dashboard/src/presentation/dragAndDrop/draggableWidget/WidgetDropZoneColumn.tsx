// (C) 2007-2024 GoodData Corporation
import { ScreenSize } from "@gooddata/sdk-model";
import cx from "classnames";
import React, { useMemo } from "react";
// import { Col } from "react-grid-system";
import {
    selectDraggingWidgetTarget,
    useDashboardDispatch,
    useDashboardSelector,
} from "../../../model/index.js";
import { WidgetDropZone } from "./WidgetDropZone.js";
import { useDashboardDrop } from "../useDashboardDrop.js";
import { useInsightListItemDropHandler } from "./useInsightListItemDropHandler.js";
import { useInsightPlaceholderDropHandler } from "./useInsightPlaceholderDropHandler.js";
import { useKpiPlaceholderDropHandler } from "./useKpiPlaceholderDropHandler.js";
import { useMoveWidgetDropHandler } from "./useMoveWidgetHandler.js";
import { getDashboardLayoutItemHeightForGrid } from "../../../_staging/layout/sizing.js";
import {
    BaseDraggableLayoutItem,
    isInsightDraggableItem,
    isInsightDraggableListItem,
    isInsightPlaceholderDraggableItem,
    isKpiDraggableItem,
    isKpiPlaceholderDraggableItem,
    isRichTextDraggableItem,
    isRichTextDraggableListItem,
    isVisualizationSwitcherDraggableItem,
    isVisualizationSwitcherDraggableListItem,
} from "../types.js";
import { useRichTextPlaceholderDropHandler } from "./useRichTextPlaceholderDropHandler.js";
import { useVisualizationSwitcherPlaceholderDropHandler } from "./useVisualizationSwitcherPlaceholderDropHandler.js";

export type WidgetDropZoneColumnProps = {
    screen: ScreenSize;
    sectionIndex: number;
    itemIndex: number;
    isLastInSection?: boolean;
};

export const WidgetDropZoneColumn = (props: WidgetDropZoneColumnProps) => {
    const { sectionIndex, itemIndex, isLastInSection = false } = props;

    const dropzoneCoordinates = useDashboardSelector(selectDraggingWidgetTarget);

    const handleInsightListItemDrop = useInsightListItemDropHandler(sectionIndex, itemIndex);
    const handleInsightPlaceholderDrop = useInsightPlaceholderDropHandler(sectionIndex, itemIndex);
    const handleKpiPlaceholderDrop = useKpiPlaceholderDropHandler(sectionIndex, itemIndex);
    const handleRichTextPlaceholderDrop = useRichTextPlaceholderDropHandler(sectionIndex, itemIndex);
    const handleVisualizationSwitcherPlaceholderDrop = useVisualizationSwitcherPlaceholderDropHandler(
        sectionIndex,
        itemIndex,
    );
    const handleWidgetDrop = useMoveWidgetDropHandler(sectionIndex, itemIndex);

    const dispatch = useDashboardDispatch();

    const [collectedProps, dropRef] = useDashboardDrop(
        [
            "insightListItem",
            "kpi-placeholder",
            "insight-placeholder",
            "kpi",
            "insight",
            "richText",
            "richTextListItem",
            "visualizationSwitcher",
            "visualizationSwitcherListItem",
        ],
        {
            drop: (item) => {
                if (isInsightDraggableListItem(item)) {
                    handleInsightListItemDrop(item.insight);
                }
                if (isKpiPlaceholderDraggableItem(item)) {
                    handleKpiPlaceholderDrop();
                }
                if (isInsightPlaceholderDraggableItem(item)) {
                    handleInsightPlaceholderDrop();
                }
                if (isRichTextDraggableListItem(item)) {
                    handleRichTextPlaceholderDrop();
                }
                if (isVisualizationSwitcherDraggableListItem(item)) {
                    handleVisualizationSwitcherPlaceholderDrop();
                }
                if (
                    isInsightDraggableItem(item) ||
                    isKpiDraggableItem(item) ||
                    isRichTextDraggableItem(item) ||
                    isVisualizationSwitcherDraggableItem(item)
                ) {
                    handleWidgetDrop(item);
                }
            },
        },
        [
            dispatch,
            handleInsightListItemDrop,
            handleInsightPlaceholderDrop,
            handleKpiPlaceholderDrop,
            handleVisualizationSwitcherPlaceholderDrop,
        ],
    );

    const showDropZone = useMemo(
        () =>
            dropzoneCoordinates?.sectionIndex === sectionIndex &&
            dropzoneCoordinates?.itemIndex === itemIndex,

        [dropzoneCoordinates?.itemIndex, dropzoneCoordinates?.sectionIndex, itemIndex, sectionIndex],
    );

    if (!showDropZone) {
        return null;
    }

    if (!collectedProps?.item) {
        return null;
    }

    const size = (collectedProps.item as BaseDraggableLayoutItem).size;

    return (
        <div
            className={cx(
                "gd-fluidlayout-column",
                "gd-fluidlayout-column-dropzone",
                "gd-grid-layout__item",
                `gd-grid-layout__item--span-${size.gridWidth}`,
                "s-fluid-layout-column",
            )}
            style={{
                minHeight: getDashboardLayoutItemHeightForGrid(size.gridHeight),
            }}
        >
            {/*<Col*/}
            {/*    xl={size.gridWidth}*/}
            {/*    lg={size.gridWidth}*/}
            {/*    md={size.gridWidth}*/}
            {/*    sm={size.gridWidth}*/}
            {/*    xs={size.gridWidth}*/}
            {/*    className={cx("gd-fluidlayout-column", "gd-fluidlayout-column-dropzone", "s-fluid-layout-column")}*/}
            {/*    style={{*/}
            {/*        minHeight: getDashboardLayoutItemHeightForGrid(size.gridHeight),*/}
            {/*    }}*/}
            {/*>*/}
            <WidgetDropZone
                isLastInSection={isLastInSection}
                sectionIndex={sectionIndex}
                itemIndex={itemIndex}
                dropRef={dropRef}
            />
            {/*</Col>*/}
        </div>
    );
};

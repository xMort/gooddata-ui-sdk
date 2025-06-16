// (C) 2024-2025 GoodData Corporation

import React from "react";
import { FormattedMessage } from "react-intl";
import { Bubble, BubbleHoverTrigger, IAlignPoint, Icon } from "@gooddata/sdk-ui-kit";
import { IDashboardLayout, IDashboardLayoutContainerDirection } from "@gooddata/sdk-model";
import cx from "classnames";

import { useDashboardUserInteraction, ExtendedDashboardWidget } from "../../../../model/index.js";
import { useLayoutConfiguration } from "../../common/useLayoutConfiguration.js";

const TOOLBAR_ALIGN_POINTS: IAlignPoint[] = [
    { align: "tr tl", offset: { x: 0, y: 11 } },
    { align: "tl tr", offset: { x: -2, y: 11 } },
];
const TOOLTIP_ALIGN_POINTS: IAlignPoint[] = [{ align: "tc bc", offset: { x: 0, y: -7 } }];
const ARROW_STYLES = { display: "none" };
const ALIGN_TOOLBAR_TO = ".s-dash-item.is-selected";
const IGNORE_TOOLBAR_CLICKS_ON_BY_CLASS = [ALIGN_TOOLBAR_TO]; // do not close on click to the widget

interface ToolbarProps {
    layout: IDashboardLayout<ExtendedDashboardWidget>;
    onWidgetDelete: () => void;
    onWidgetDirectionChanged: (direction: IDashboardLayoutContainerDirection) => void;
    onToggleHeaders: (areSectionHeadersEnabled: boolean) => void;
    onClose: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    layout,
    onWidgetDelete,
    onWidgetDirectionChanged,
    onToggleHeaders,
    onClose,
}) => {
    const userInteraction = useDashboardUserInteraction();
    const { sections, direction } = useLayoutConfiguration(layout);
    const areSectionHeadersEnabled = sections.areHeadersEnabled;
    const hasSections = layout.sections.length > 0;
    const DirectionIcon = direction === "row" ? Icon.ArrowRight : Icon.ArrowDown;
    return (
        <Bubble
            className="bubble-light"
            overlayClassName="gd-nested-layout__toolbar s-nested-layout__toolbar"
            alignTo={ALIGN_TOOLBAR_TO}
            alignPoints={TOOLBAR_ALIGN_POINTS}
            closeOnOutsideClick={true}
            closeOnParentScroll={false}
            ignoreClicksOnByClass={IGNORE_TOOLBAR_CLICKS_ON_BY_CLASS}
            arrowStyle={ARROW_STYLES}
            onClose={onClose}
        >
            <div>
                <BubbleHoverTrigger eventsOnBubble={true}>
                    <div
                        className="gd-nested-layout__toolbar__button s-nested-layout__button--direction"
                        onClick={() => {
                            onWidgetDirectionChanged(direction === "row" ? "column" : "row");
                            userInteraction.nestedLayoutInteraction(
                                direction === "row"
                                    ? "nestedLayoutDirectionColumn"
                                    : "nestedLayoutDirectionRow",
                            );
                        }}
                    >
                        <DirectionIcon
                            className="gd-nested-layout__toolbar__icon--direction"
                            width={20}
                            height={20}
                        />
                    </div>
                    <Bubble alignPoints={TOOLTIP_ALIGN_POINTS}>
                        {/* TODO: add translation once texts are finalized <FormattedMessage id="nestedLayoutToolbar.xxx" />*/}
                        {direction === "row"
                            ? "Change group direction to columns."
                            : "Change group direction to rows."}
                    </Bubble>
                </BubbleHoverTrigger>
            </div>
            {hasSections ? (
                <>
                    <div>
                        <BubbleHoverTrigger eventsOnBubble={true}>
                            <div
                                className="gd-nested-layout__toolbar__button s-nested-layout__button--headers"
                                onClick={() => {
                                    onToggleHeaders(!areSectionHeadersEnabled);
                                    userInteraction.nestedLayoutInteraction(
                                        areSectionHeadersEnabled
                                            ? "nestedLayoutHeaderDisabled"
                                            : "nestedLayoutHeaderEnabled",
                                    );
                                }}
                            >
                                <Icon.Header
                                    className={cx({
                                        "gd-nested-layout__toolbar__icon--headers-active":
                                            areSectionHeadersEnabled,
                                        "gd-nested-layout__toolbar__icon--headers-disabled":
                                            !areSectionHeadersEnabled,
                                    })}
                                    width={28}
                                    height={28}
                                />
                            </div>
                            <Bubble alignPoints={TOOLTIP_ALIGN_POINTS}>
                                {areSectionHeadersEnabled ? (
                                    <FormattedMessage id="nestedLayoutToolbar.hideHeader" />
                                ) : (
                                    <FormattedMessage id="nestedLayoutToolbar.showHeader" />
                                )}
                            </Bubble>
                        </BubbleHoverTrigger>
                    </div>
                </>
            ) : null}
            <div className="gd-nested-layout__toolbar__delimiter" />
            <div>
                <BubbleHoverTrigger eventsOnBubble={true}>
                    <div
                        className="gd-nested-layout__toolbar__button s-nested-layout__button--remove"
                        onClick={() => {
                            onWidgetDelete();
                            userInteraction.nestedLayoutInteraction("nestedLayoutRemoved");
                        }}
                    >
                        <Icon.Trash
                            className="gd-nested-layout__toolbar__icon--remove"
                            width={20}
                            height={20}
                        />
                    </div>
                    <Bubble alignPoints={TOOLTIP_ALIGN_POINTS}>
                        <FormattedMessage id="nestedLayoutToolbar.remove" />
                    </Bubble>
                </BubbleHoverTrigger>
            </div>
        </Bubble>
    );
};

// (C) 2007-2019 GoodData Corporation
import React from "react";
import {
    RankingFilter,
    IAttributeDropdownItem,
    IMeasureDropdownItem,
    RankingFilterDropdown,
} from "@gooddata/sdk-ui-filters";
import { newRankingFilter, measureLocalId, attributeLocalId, localIdRef } from "@gooddata/sdk-model";
import { ExperimentalLdm } from "@gooddata/experimental-workspace";
import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { withMultipleScreenshots } from "../../../_infra/backstopWrapper";
import { FilterStories } from "../../../_infra/storyGroups";

import "@gooddata/sdk-ui-filters/styles/css/rankingFilter.css";

const wrapperStyle = { width: 400, height: 800, padding: "1em 1em" };

const dropdownScenarios = {
    default: {},
    operatorDropdownOpened: { clickSelector: ".s-rf-operator-dropdown-button", postInteractionWait: 200 },
    valueDropdownOpened: { clickSelector: ".s-rf-value-dropdown-button", postInteractionWait: 200 },
    attributeDropdownOpened: { clickSelector: ".s-rf-attribute-dropdown-button", postInteractionWait: 200 },
    measureDropdownOpened: { clickSelector: ".s-rf-measure-dropdown-button", postInteractionWait: 200 },
};

const dropdownWithoutAttributeItemsScenarios = {
    default: {},
    attributeDropdownButtonTooltip: {
        hoverSelector: ".s-rf-attribute-dropdown-button",
        postInteractionWait: 200,
    },
};

const buttonScenarios = {
    closed: {},
    opened: { clickSelector: ".s-rf-dropdown-button", postInteractionWait: 200 },
};

const rankingFilter = newRankingFilter(ExperimentalLdm.Amount_1.Sum, "TOP", 10);

const measureDropdownItems: IMeasureDropdownItem[] = [
    {
        title: "Sum of amount",
        ref: localIdRef(measureLocalId(ExperimentalLdm.Amount_1.Sum)),
        sequenceNumber: "M1",
    },
    {
        title: "Sum of velocity",
        ref: localIdRef(measureLocalId(ExperimentalLdm.Velocity.Sum)),
        sequenceNumber: "M2",
    },
];

const attributeDropdownItems: IAttributeDropdownItem[] = [
    {
        title: "Account",
        ref: localIdRef(attributeLocalId(ExperimentalLdm.Account.Name)),
        type: "ATTRIBUTE",
    },
    {
        title: "Status",
        ref: localIdRef(attributeLocalId(ExperimentalLdm.Status)),
        type: "ATTRIBUTE",
    },
    {
        title: "Date",
        ref: localIdRef(attributeLocalId(ExperimentalLdm.ClosedDate.DdMmYyyy)),
        type: "DATE",
    },
];

storiesOf(`${FilterStories}/RankingFilter`, module)
    .add("dropdown", () => {
        return withMultipleScreenshots(
            <div style={wrapperStyle} className="screenshot-target">
                <RankingFilterDropdown
                    measureItems={measureDropdownItems}
                    attributeItems={attributeDropdownItems}
                    filter={rankingFilter}
                    onApply={action("apply")}
                    onCancel={action("cancel")}
                    anchorEl="screenshot-target"
                />
            </div>,
            dropdownScenarios,
        );
    })
    .add("dropdown with no attribute items", () => {
        return withMultipleScreenshots(
            <div style={wrapperStyle} className="screenshot-target">
                <RankingFilterDropdown
                    measureItems={measureDropdownItems}
                    attributeItems={[]}
                    filter={rankingFilter}
                    onApply={action("apply")}
                    onCancel={action("cancel")}
                    anchorEl="screenshot-target"
                />
            </div>,
            dropdownWithoutAttributeItemsScenarios,
        );
    })
    .add("default button with dropdown", () => {
        return withMultipleScreenshots(
            <div style={wrapperStyle} className="screenshot-target">
                <RankingFilter
                    measureItems={measureDropdownItems}
                    attributeItems={attributeDropdownItems}
                    filter={rankingFilter}
                    onApply={action("apply")}
                    onCancel={action("cancel")}
                    buttonTitle="Ranking Filter"
                />
            </div>,
            buttonScenarios,
        );
    });

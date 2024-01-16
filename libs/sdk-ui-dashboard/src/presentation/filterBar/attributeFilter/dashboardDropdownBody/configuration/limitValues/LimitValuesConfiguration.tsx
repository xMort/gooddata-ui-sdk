// (C) 2024 GoodData Corporation

import React, { useState } from "react";
import { FormattedMessage, useIntl, IntlShape } from "react-intl";
import { Typography, Bubble, BubbleHoverTrigger, Button } from "@gooddata/sdk-ui-kit";
import { isObjRef, serializeObjRef, ObjRef } from "@gooddata/sdk-model";

import { messages } from "../../../../../../locales.js";
import { ValuesLimitingItem } from "../../../types.js";

import { LimitingItem } from "./LimitingItem.js";
import { useLimitingItems } from "./limitingItemsHook.js";
import { IDashboardAttributeFilterParentItem, useDashboardSelector } from "../../../../../../model/index.js";
import { selectEnableAttributeFilterValuesValidation } from "../../../../../../model/store/config/configSelectors.js";
import { IntlWrapper } from "../../../../../localization/index.js";

const TOOLTIP_ALIGN_POINTS = [{ align: "cr cl" }, { align: "cl cr" }];

const WithExplanationTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <BubbleHoverTrigger tagName="abbr">
            {children}
            <Bubble alignPoints={TOOLTIP_ALIGN_POINTS}>
                <FormattedMessage
                    id="attributesDropdown.valuesLimiting.mainTooltip"
                    values={{ br: <br /> }}
                />
            </Bubble>
        </BubbleHoverTrigger>
    );
};

const UnknownItemTitle: React.FC = () => {
    return (
        <em>
            <FormattedMessage id="attributesDropdown.valuesLimiting.unknownItem" />
        </em>
    );
};

const extractKey = (item: ValuesLimitingItem) =>
    isObjRef(item) ? serializeObjRef(item) : item.localIdentifier;

interface ILimitValuesConfigurationProps {
    parentFilters: IDashboardAttributeFilterParentItem[];
    validateElementsBy?: ObjRef[];
}

const LimitValuesConfiguration: React.FC<ILimitValuesConfigurationProps> = ({
    parentFilters,
    validateElementsBy,
}) => {
    const intl = useIntl();
    const [_isDropdownOpened, setIsDropdownOpened] = useState(false);
    const itemsWithTitles = useLimitingItems(parentFilters, validateElementsBy);

    const onDelete = (_item: ValuesLimitingItem) => {};

    return (
        <div>
            <div className="configuration-category attribute-filter__limit__title">
                <Typography tagName="h3">
                    <FormattedMessage id="attributesDropdown.valuesLimiting.title" />
                    <WithExplanationTooltip>
                        <i className="gd-icon-circle-question" />
                    </WithExplanationTooltip>
                </Typography>
                <Button
                    className="gd-button-small gd-button-link attribute-filter__limit__add-button"
                    iconLeft="gd-icon-plus"
                    onClick={() => setIsDropdownOpened(true)}
                    value={intl.formatMessage(messages.filterAddValuesLimit)}
                />
            </div>
            <div>
                {itemsWithTitles.length === 0 ? (
                    <WithExplanationTooltip>
                        <FormattedMessage id="attributesDropdown.valuesLimiting.empty" />
                    </WithExplanationTooltip>
                ) : (
                    <>
                        {itemsWithTitles.map(({ title, item }) => (
                            <LimitingItem
                                key={extractKey(item)}
                                title={title ?? <UnknownItemTitle />}
                                item={item}
                                onDelete={() => onDelete(item)}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export interface ILocalizedLimitValuesConfiguration {
    parentFilters: IDashboardAttributeFilterParentItem[];
    validateElementsBy?: ObjRef[];
    intl: IntlShape;
}

export const LocalizedLimitValuesConfiguration: React.FC<ILocalizedLimitValuesConfiguration> = ({
    intl,
    parentFilters,
    validateElementsBy,
}) => {
    const isAttributeFilterValuesValidationEnabled = useDashboardSelector(
        selectEnableAttributeFilterValuesValidation,
    );
    if (!isAttributeFilterValuesValidationEnabled) {
        return null;
    }
    return (
        <IntlWrapper locale={intl.locale}>
            <LimitValuesConfiguration parentFilters={parentFilters} validateElementsBy={validateElementsBy} />
        </IntlWrapper>
    );
};

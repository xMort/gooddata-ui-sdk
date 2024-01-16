// (C) 2024 GoodData Corporation

import React from "react";
import { FormattedMessage } from "react-intl";
import cx from "classnames";
import { isObjRef, isIdentifierRef } from "@gooddata/sdk-model";

import { ValuesLimitingItem } from "../../../types.js";

interface IItemTitleProps {
    title: React.ReactNode;
}

const LimitingMetricItem: React.FC<IItemTitleProps> = ({ title }) => {
    return <span className="attribute-filter__limit__item__title type-metric">{title}</span>;
};

const LimitingFactItem: React.FC<IItemTitleProps> = ({ title }) => {
    const titleWithIcon = <span className="attribute-filter__limit__item__title type-measure">{title}</span>;
    return (
        <span className="attribute-filter__limit__item__title--aggregated">
            <FormattedMessage
                id="attributesDropdown.valuesLimiting.sumFact"
                values={{ fact: titleWithIcon }}
            />
        </span>
    );
};
const LimitingAttributeItem: React.FC<IItemTitleProps> = ({ title }) => {
    const titleWithIcon = (
        <span className="attribute-filter__limit__item__title type-attribute">{title}</span>
    );
    return (
        <span className="attribute-filter__limit__item__title--aggregated">
            <FormattedMessage
                id="attributesDropdown.valuesLimiting.countAttribute"
                values={{ attribute: titleWithIcon }}
            />
        </span>
    );
};
const LimitingFilterItem: React.FC<IItemTitleProps> = ({ title }) => {
    return <span className="attribute-filter__limit__item__title type-filter">{title}</span>;
};

export interface ILimitingItemProps {
    title: string | React.ReactNode;
    item: ValuesLimitingItem;
    isDisabled?: boolean;
    onDelete: () => void;
}

const isMetric = (item: ValuesLimitingItem) => isIdentifierRef(item) && item.type === "measure";
const isFact = (item: ValuesLimitingItem) => isIdentifierRef(item) && item.type === "fact";
const isAttribute = (item: ValuesLimitingItem) => isIdentifierRef(item) && item.type === "attribute";
const isParentFilter = (item: ValuesLimitingItem) => !isObjRef(item);

const LimitingItemTitle: React.FC<ILimitingItemProps> = ({ item, title }) => {
    if (isMetric(item)) {
        return <LimitingMetricItem title={title} />;
    }
    if (isFact(item)) {
        return <LimitingFactItem title={title} />;
    }
    if (isAttribute(item)) {
        return <LimitingAttributeItem title={title} />;
    }
    if (isParentFilter(item)) {
        return <LimitingFilterItem title={title} />;
    }
    return <span className="attribute-filter__limit__item__title">{title}</span>;
};

export const LimitingItem: React.FC<ILimitingItemProps> = (props) => {
    const { isDisabled } = props;
    const classNames = cx("attribute-filter__limit__item", {
        "attribute-filter__limit__item--disabled": isDisabled,
    });
    return (
        <div className={classNames}>
            <LimitingItemTitle {...props} />
        </div>
    );
};

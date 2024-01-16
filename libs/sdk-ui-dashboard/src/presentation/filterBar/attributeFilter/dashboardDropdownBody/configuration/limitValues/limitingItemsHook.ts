// (C) 2024 GoodData Corporation

import { useMemo } from "react";
import {
    ObjRef,
    ICatalogAttribute,
    ICatalogMeasure,
    ICatalogFact,
    isIdentifierRef,
    areObjRefsEqual,
} from "@gooddata/sdk-model";

import { ValuesLimitingItem } from "../../../types.js";
import {
    useDashboardSelector,
    selectCatalogAttributes,
    selectCatalogMeasures,
    selectCatalogFacts,
    selectAllCatalogDisplayFormsMap,
    IDashboardAttributeFilterParentItem,
} from "../../../../../../model/index.js";

export interface IValuesLimitingItemWithTitle {
    title?: string;
    item: ValuesLimitingItem;
}

function findTitleForCatalogItem(
    item: ObjRef,
    metrics: ICatalogMeasure[],
    facts: ICatalogFact[],
    attributes: ICatalogAttribute[],
) {
    if (!isIdentifierRef(item)) {
        return undefined;
    }
    if (item.type === "measure") {
        return metrics.find((metric) => areObjRefsEqual(metric.measure.ref, item))?.measure.title;
    }
    if (item.type === "fact") {
        return facts.find((fact) => areObjRefsEqual(fact.fact.ref, item))?.fact.title;
    }
    if (item.type === "attribute") {
        return attributes.find((attribute) => areObjRefsEqual(attribute.attribute.ref, item))?.attribute
            .title;
    }
    return undefined;
}

export const useLimitingItems = (
    parentFilters: IDashboardAttributeFilterParentItem[],
    validateElementsBy?: ObjRef[],
): IValuesLimitingItemWithTitle[] => {
    const attributes = useDashboardSelector(selectCatalogAttributes);
    const labels = useDashboardSelector(selectAllCatalogDisplayFormsMap);
    const metrics = useDashboardSelector(selectCatalogMeasures);
    const facts = useDashboardSelector(selectCatalogFacts);

    return useMemo(() => {
        const parentFilterItems = parentFilters.map((item) => ({
            title: labels.get(item.displayForm)?.title,
            item,
        }));

        const validationItems =
            validateElementsBy?.map((item) => ({
                title: findTitleForCatalogItem(item, metrics, facts, attributes),
                item,
            })) ?? [];
        return [...parentFilterItems, ...validationItems];
    }, [parentFilters, validateElementsBy, attributes, labels, metrics, facts]);
};

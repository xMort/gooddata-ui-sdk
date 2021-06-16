// (C) 2019 GoodData Corporation
import { bucketsItems, IInsight, IInsightDefinition, insightBuckets } from "@gooddata/sdk-model";
import { BucketNames, IDrillEvent, VisualizationTypes } from "@gooddata/sdk-ui";
import React from "react";
import { render } from "react-dom";

import { ATTRIBUTE, BUCKETS, DATE } from "../../../constants/bucket";
import {
    AREA_CHART_SUPPORTED_PROPERTIES,
    OPTIONAL_STACKING_PROPERTIES,
} from "../../../constants/supportedProperties";
import {
    AREA_UICONFIG_WITH_MULTIPLE_DATES,
    DEFAULT_AREA_UICONFIG,
    MAX_CATEGORIES_COUNT,
    MAX_STACKS_COUNT,
    MAX_VIEW_COUNT,
} from "../../../constants/uiConfig";
import {
    IBucketItem,
    IBucketOfFun,
    IDrillDownContext,
    IExtendedReferencePoint,
    IImplicitDrillDown,
    IReferencePoint,
    IUiConfig,
    IVisConstruct,
    IVisProps,
} from "../../../interfaces/Visualization";
import { configureOverTimeComparison, configurePercent } from "../../../utils/bucketConfig";

import {
    getAllAttributeItemsWithPreference,
    getAllCategoriesAttributeItems,
    getDateItems,
    getFilteredMeasuresForStackedCharts,
    getStackItems,
    removeDivergentDateItems,
    isDateBucketItem,
    isNotDateBucketItem,
    removeAllArithmeticMeasuresFromDerived,
    removeAllDerivedMeasures,
    sanitizeFilters,
    getMainDateItem,
    getMeasureItems,
    filterOutDerivedMeasures,
    getFistDateItemWithMultipleDates,
} from "../../../utils/bucketHelper";
import {
    getReferencePointWithSupportedProperties,
    removeImmutableOptionalStackingProperties,
} from "../../../utils/propertiesHelper";
import { removeSort } from "../../../utils/sort";

import { setAreaChartUiConfig } from "../../../utils/uiConfigHelpers/areaChartUiConfigHelper";
import LineChartBasedConfigurationPanel from "../../configurationPanels/LineChartBasedConfigurationPanel";

import { PluggableBaseChart } from "../baseChart/PluggableBaseChart";
import cloneDeep from "lodash/cloneDeep";
import set from "lodash/set";
import {
    addIntersectionFiltersToInsight,
    modifyBucketsAttributesForDrillDown,
    reverseAndTrimIntersection,
} from "../drillDownUtil";

export class PluggableAreaChart extends PluggableBaseChart {
    constructor(props: IVisConstruct) {
        super(props);
        this.type = VisualizationTypes.AREA;
        this.defaultControlsProperties = {
            stackMeasures: true,
        };
        this.initializeProperties(props.visualizationProperties);
    }

    public getUiConfig(): IUiConfig {
        return cloneDeep(
            this.isMultipleDatesEnabled() ? AREA_UICONFIG_WITH_MULTIPLE_DATES : DEFAULT_AREA_UICONFIG,
        );
    }

    protected updateInstanceProperties(
        options: IVisProps,
        insight: IInsightDefinition,
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        insightPropertiesMeta: any,
    ): void {
        super.updateInstanceProperties(options, insight, insightPropertiesMeta);

        this.updateCustomSupportedProperties(insight);
    }

    public getExtendedReferencePoint(referencePoint: IReferencePoint): Promise<IExtendedReferencePoint> {
        const clonedReferencePoint = cloneDeep(referencePoint);
        let newReferencePoint: IExtendedReferencePoint = {
            ...clonedReferencePoint,
            uiConfig: this.getUiConfig(),
        };
        newReferencePoint = removeAllArithmeticMeasuresFromDerived(newReferencePoint);
        newReferencePoint = removeAllDerivedMeasures(newReferencePoint);

        this.configureBuckets(newReferencePoint);

        newReferencePoint = setAreaChartUiConfig(newReferencePoint, this.intl, this.type);
        newReferencePoint = configurePercent(newReferencePoint, false);
        newReferencePoint = configureOverTimeComparison(
            newReferencePoint,
            !!this.featureFlags["enableWeekFilters"],
        );

        this.supportedPropertiesList = removeImmutableOptionalStackingProperties(
            newReferencePoint,
            this.getSupportedPropertiesList(),
        );
        newReferencePoint = getReferencePointWithSupportedProperties(
            newReferencePoint,
            this.supportedPropertiesList,
        );
        newReferencePoint = removeSort(newReferencePoint);
        return Promise.resolve(sanitizeFilters(newReferencePoint));
    }

    protected configureBuckets(extendedReferencePoint: IExtendedReferencePoint): void {
        const { measures, views, stacks } = this.isMultipleDatesEnabled()
            ? this.getBucketItemsWithMultipleDates(extendedReferencePoint)
            : this.getBucketItems(extendedReferencePoint);

        set(extendedReferencePoint, BUCKETS, [
            {
                localIdentifier: BucketNames.MEASURES,
                items: measures,
            },
            {
                localIdentifier: BucketNames.VIEW,
                items: views,
            },
            {
                localIdentifier: BucketNames.STACK,
                items: stacks,
            },
        ]);
    }

    protected getSupportedPropertiesList(): string[] {
        return AREA_CHART_SUPPORTED_PROPERTIES;
    }

    private addFilters(source: IInsight, drillConfig: IImplicitDrillDown, event: IDrillEvent) {
        const cutIntersection = reverseAndTrimIntersection(drillConfig, event.drillContext.intersection);
        return addIntersectionFiltersToInsight(source, cutIntersection);
    }

    public getInsightWithDrillDownApplied(source: IInsight, drillDownContext: IDrillDownContext): IInsight {
        const withFilters = this.addFilters(source, drillDownContext.drillDefinition, drillDownContext.event);
        return modifyBucketsAttributesForDrillDown(withFilters, drillDownContext.drillDefinition);
    }

    protected renderConfigurationPanel(insight: IInsightDefinition): void {
        if (document.querySelector(this.configPanelElement)) {
            render(
                <LineChartBasedConfigurationPanel
                    locale={this.locale}
                    colors={this.colors}
                    properties={this.visualizationProperties}
                    propertiesMeta={this.propertiesMeta}
                    insight={insight}
                    references={this.references}
                    pushData={this.handlePushData}
                    type={this.type}
                    isError={this.getIsError()}
                    isLoading={this.isLoading}
                    featureFlags={this.featureFlags}
                />,
                document.querySelector(this.configPanelElement),
            );
        }
    }

    private updateCustomSupportedProperties(insight: IInsightDefinition): void {
        if (bucketsItems(insightBuckets(insight, BucketNames.VIEW)).length > 1) {
            this.addSupportedProperties(OPTIONAL_STACKING_PROPERTIES);
            this.setCustomControlsProperties({
                stackMeasures: false,
                stackMeasuresToPercent: false,
            });
        } else {
            this.setCustomControlsProperties({});
        }
    }

    private addSupportedProperties(properties: string[]) {
        const supportedPropertiesList = this.supportedPropertiesList;
        (properties || []).forEach((property: string) => {
            if (!supportedPropertiesList.some((supportedProperty) => supportedProperty === property)) {
                supportedPropertiesList.push(property);
            }
        });
    }

    private getAllAttributes(buckets: IBucketOfFun[]): IBucketItem[] {
        return getAllAttributeItemsWithPreference(buckets, [
            BucketNames.TREND,
            BucketNames.VIEW,
            BucketNames.SEGMENT,
            BucketNames.STACK,
        ]);
    }

    private getAllAttributesWithoutDate(buckets: IBucketOfFun[]): IBucketItem[] {
        return this.getAllAttributes(buckets).filter(isNotDateBucketItem);
    }

    private filterStackItems(bucketItems: IBucketItem[]): IBucketItem[] {
        return bucketItems.filter(isNotDateBucketItem).slice(0, MAX_STACKS_COUNT);
    }

    private getBucketItems(referencePoint: IReferencePoint) {
        const buckets = referencePoint?.buckets ?? [];
        const measures = getFilteredMeasuresForStackedCharts(buckets);
        const dateItems = getDateItems(buckets);
        const mainDateItem = getMainDateItem(dateItems);

        let stacks: IBucketItem[] = this.filterStackItems(getStackItems(buckets));
        const isAllowMoreThanOneViewByAttribute = !stacks.length && measures.length <= 1;
        const numOfAttributes = isAllowMoreThanOneViewByAttribute ? MAX_VIEW_COUNT : 1;
        let views: IBucketItem[] = removeDivergentDateItems(
            getAllCategoriesAttributeItems(buckets),
            mainDateItem,
        ).slice(0, numOfAttributes);
        const hasDateItemInViewByBucket = views.some(isDateBucketItem);

        if (dateItems.length && !hasDateItemInViewByBucket) {
            const allAttributes = this.getAllAttributesWithoutDate(buckets);
            const extraViewItems = allAttributes.slice(0, numOfAttributes - 1);
            views = numOfAttributes > 1 ? [mainDateItem, ...extraViewItems] : [mainDateItem];
            if (!isAllowMoreThanOneViewByAttribute && measures.length <= 1) {
                stacks = allAttributes.slice(0, MAX_STACKS_COUNT);
            }
        }

        return {
            measures,
            views,
            stacks,
        };
    }

    private getViewByMaxItemCount(referencePoint: IExtendedReferencePoint): number {
        return referencePoint.uiConfig?.buckets?.[BucketNames.VIEW]?.itemsLimit ?? MAX_CATEGORIES_COUNT;
    }

    private getBucketItemsWithMultipleDates(referencePoint: IExtendedReferencePoint) {
        const buckets = referencePoint?.buckets ?? [];
        const measures = getMeasureItems(buckets);
        const masterMeasures = filterOutDerivedMeasures(measures);
        const viewByMaxItemCount = this.getViewByMaxItemCount(referencePoint);

        let views: IBucketItem[] = [];
        let stacks: IBucketItem[] = getStackItems(buckets, [ATTRIBUTE, DATE]);
        const allAttributes = getAllAttributeItemsWithPreference(buckets, [
            BucketNames.LOCATION,
            BucketNames.TREND,
            BucketNames.VIEW,
            BucketNames.ATTRIBUTES,
            BucketNames.SEGMENT,
            BucketNames.STACK,
        ]).filter((attribute) => !stacks.includes(attribute));

        const firstDateItemInViews = getFistDateItemWithMultipleDates(buckets);

        if (firstDateItemInViews) {
            views = [firstDateItemInViews];

            const [nextAttribute] = allAttributes.filter((attribute) => attribute !== firstDateItemInViews);

            if (masterMeasures.length <= 1 && nextAttribute && !stacks.length) {
                const isNextAttributeDate = isDateBucketItem(nextAttribute);

                if (!isNextAttributeDate) {
                    stacks = [nextAttribute];
                    views = [...views];
                } else {
                    views = [...views, nextAttribute].slice(0, viewByMaxItemCount);
                }
            }
        } else {
            if (masterMeasures.length <= 1 && allAttributes.length > 0 && !stacks.length) {
                // have more attributes and stacks empty -> fill views
                views = allAttributes.slice(0, viewByMaxItemCount);
            } else if (masterMeasures.length <= 1 && allAttributes.length) {
                // have more attributes and stacks non-empty -> keep only one attribute in view
                views = getAllCategoriesAttributeItems(buckets).slice(0, 1);
            } else if (masterMeasures.length <= 1) {
                // more measures -> prefer measures
                views = getAllCategoriesAttributeItems(buckets).slice(0, 1);
            } else {
                // more measures -> prefer measures and clear stack
                views = getAllCategoriesAttributeItems(buckets).slice(0, 1);
                stacks = [];
            }
        }

        return {
            measures,
            views,
            stacks,
        };
    }
}

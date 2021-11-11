// (C) 2019 GoodData Corporation

import { IExecutionFactory, ISettings } from "@gooddata/sdk-backend-spi";
import { bucketIsEmpty, IInsightDefinition, insightBucket, insightHasDataDefined } from "@gooddata/sdk-model";

import { BucketNames } from "@gooddata/sdk-ui";
import { CoreHeadline, updateConfigWithSettings } from "@gooddata/sdk-ui-charts";
import React from "react";
import { render } from "react-dom";
import { METRIC } from "../../../constants/bucket";
import {
    IBucketItem,
    IBucketOfFun,
    IExtendedReferencePoint,
    InvalidBucketsSdkError,
    IReferencePoint,
    IVisConstruct,
    IVisProps,
    RenderFunction,
} from "../../../interfaces/Visualization";

import { configureOverTimeComparison, configurePercent } from "../../../utils/bucketConfig";
import {
    findDerivedBucketItem,
    getAllItemsByType,
    hasDerivedBucketItems,
    isDerivedBucketItem,
    limitNumberOfMeasuresInBuckets,
    removeAllArithmeticMeasuresFromDerived,
    removeAllDerivedMeasures,
    sanitizeFilters,
} from "../../../utils/bucketHelper";
import { hasGlobalDateFilter } from "../../../utils/bucketRules";
import { unmountComponentsAtNodes } from "../../../utils/domHelper";
import {
    getReferencePointWithSupportedProperties,
    getSupportedProperties,
} from "../../../utils/propertiesHelper";
import { removeSort } from "../../../utils/sort";
import {
    getDefaultHeadlineUiConfig,
    getHeadlineUiConfig,
} from "../../../utils/uiConfigHelpers/headlineUiConfigHelper";
import UnsupportedConfigurationPanel from "../../configurationPanels/UnsupportedConfigurationPanel";
import { AbstractPluggableVisualization } from "../AbstractPluggableVisualization";
import {
    findComplementaryOverTimeComparisonMeasure,
    findNthMasterMeasure,
    setHeadlineRefPointBuckets,
    tryToMapForeignBuckets,
} from "./headlineBucketHelper";
import cloneDeep from "lodash/cloneDeep";
import { getTranslation } from "../../../utils/translations";
import { IntlShape } from "react-intl";

const getDefaultChangeMeasure = (
    primaryMeasure: IBucketItem,
    secondaryMeasure: IBucketItem,
    intl: IntlShape,
): IBucketItem | undefined => {
    if (primaryMeasure && secondaryMeasure) {
        return {
            alias: getTranslation("kpiPop.change", intl),
            operator: "change",
            operandLocalIdentifiers: [primaryMeasure.localIdentifier, secondaryMeasure.localIdentifier],
            localIdentifier: `${primaryMeasure.localIdentifier}-${secondaryMeasure.localIdentifier}`,
            format: "#,##0%",
            type: "metric",
            attribute: null,
            filters: [],
        };
    }
};

const secondaryMeasureWasAddedRightNow = (
    lastReferencePoint: IReferencePoint,
    newReferencePoint: IReferencePoint,
): boolean => {
    return (
        !!lastReferencePoint &&
        !!lastReferencePoint.buckets[0] &&
        !!lastReferencePoint.buckets[1] &&
        !!lastReferencePoint.buckets[0].items[0] &&
        !lastReferencePoint.buckets[1].items[0] &&
        !!newReferencePoint.buckets[0].items[0] &&
        !!newReferencePoint.buckets[1].items[0]
    );
};

export class PluggableHeadline extends AbstractPluggableVisualization {
    private readonly settings?: ISettings;
    private readonly renderFun: RenderFunction;

    constructor(props: IVisConstruct) {
        super(props);

        //  this.projectId = props.projectId;
        this.settings = props.featureFlags;
        this.renderFun = props.renderFun;
    }

    public unmount(): void {
        unmountComponentsAtNodes([this.element, this.configPanelElement]);
    }

    public getExtendedReferencePoint(
        referencePoint: Readonly<IReferencePoint>,
        previousReferencePoint?: Readonly<IReferencePoint>,
        onNewDerivedBucketItemsPlaced?: (referencePoint: IReferencePoint) => void,
    ): Promise<IExtendedReferencePoint> {
        const referencePointCloned = cloneDeep(referencePoint);
        let newReferencePoint: IExtendedReferencePoint = {
            ...referencePointCloned,
            uiConfig: getDefaultHeadlineUiConfig(),
        };

        if (!hasGlobalDateFilter(referencePoint.filters)) {
            newReferencePoint = removeAllArithmeticMeasuresFromDerived(newReferencePoint);
            newReferencePoint = removeAllDerivedMeasures(newReferencePoint);
        }

        const mappedReferencePoint = tryToMapForeignBuckets(newReferencePoint);

        if (mappedReferencePoint) {
            newReferencePoint = mappedReferencePoint;
        } else {
            const limitedBuckets = limitNumberOfMeasuresInBuckets(newReferencePoint.buckets, 3, true);
            const allMeasures = getAllItemsByType(limitedBuckets, [METRIC]);
            const primaryMeasure = allMeasures.length > 0 ? allMeasures[0] : null;
            const secondaryMeasure =
                findComplementaryOverTimeComparisonMeasure(primaryMeasure, allMeasures) ||
                findNthMasterMeasure(allMeasures, 1);

            const changeMeasure = findNthMasterMeasure(allMeasures, 2);

            newReferencePoint = setHeadlineRefPointBuckets(
                newReferencePoint,
                primaryMeasure,
                secondaryMeasure,
                changeMeasure,
            );
        }
        // calculate default change if needed
        const providedChangeMeasure = newReferencePoint.buckets[2].items[0];
        let shouldCall = false;
        if (
            !providedChangeMeasure &&
            secondaryMeasureWasAddedRightNow(previousReferencePoint, newReferencePoint)
        ) {
            const defaultChangeMeasure = getDefaultChangeMeasure(
                newReferencePoint.buckets[0].items[0],
                newReferencePoint.buckets[1].items[0],
                this.intl,
            );
            if (defaultChangeMeasure) {
                newReferencePoint.buckets[2].items.push(defaultChangeMeasure);
                shouldCall = true;
            }
        }

        configurePercent(newReferencePoint, true);

        configureOverTimeComparison(newReferencePoint, !!this.settings?.["enableWeekFilters"]);

        newReferencePoint.uiConfig = getHeadlineUiConfig(newReferencePoint, this.intl);
        newReferencePoint = getReferencePointWithSupportedProperties(
            newReferencePoint,
            this.supportedPropertiesList,
        );
        newReferencePoint = removeSort(newReferencePoint);
        const finalReferencePoint = sanitizeFilters(newReferencePoint);
        if (shouldCall) {
            onNewDerivedBucketItemsPlaced(finalReferencePoint);
        }
        return Promise.resolve(finalReferencePoint);
    }

    protected checkBeforeRender(insight: IInsightDefinition): boolean {
        super.checkBeforeRender(insight);

        const measureBucket = insightBucket(insight, BucketNames.MEASURES);

        if (!measureBucket || bucketIsEmpty(measureBucket)) {
            // unmount on error because currently AD cannot recover in certain cases (RAIL-2625)
            this.unmount();

            throw new InvalidBucketsSdkError();
        }

        return true;
    }

    protected renderVisualization(
        options: IVisProps,
        insight: IInsightDefinition,
        executionFactory: IExecutionFactory,
    ): void {
        if (!insightHasDataDefined(insight)) {
            return;
        }

        const {
            locale,
            dateFormat,
            custom = {},
            config,
            customVisualizationConfig,
            executionConfig,
        } = options;
        const { drillableItems } = custom;
        const execution = executionFactory
            .forInsight(insight)
            .withDimensions({ itemIdentifiers: ["measureGroup"] })
            .withDateFormat(dateFormat)
            .withExecConfig(executionConfig);

        this.renderFun(
            <CoreHeadline
                execution={execution}
                drillableItems={drillableItems}
                onDrill={this.onDrill}
                locale={locale}
                config={updateConfigWithSettings({ ...config, ...customVisualizationConfig }, this.settings)}
                afterRender={this.afterRender}
                onLoadingChanged={this.onLoadingChanged}
                pushData={this.pushData}
                onError={this.onError}
                LoadingComponent={null}
                ErrorComponent={null}
            />,
            document.querySelector(this.element),
        );
    }

    protected renderConfigurationPanel(): void {
        if (document.querySelector(this.configPanelElement)) {
            const properties = this.visualizationProperties ?? {};

            render(
                <UnsupportedConfigurationPanel
                    locale={this.locale}
                    pushData={this.pushData}
                    properties={getSupportedProperties(properties, this.supportedPropertiesList)}
                />,
                document.querySelector(this.configPanelElement),
            );
        }
    }

    protected mergeDerivedBucketItems(
        referencePoint: IReferencePoint,
        bucket: IBucketOfFun,
        newDerivedBucketItems: IBucketItem[],
    ): IBucketItem[] {
        return bucket.items.reduce((resultItems: IBucketItem[], bucketItem: IBucketItem) => {
            const newDerivedBucketItem = findDerivedBucketItem(bucketItem, newDerivedBucketItems);
            const shouldAddItem =
                newDerivedBucketItem &&
                !isDerivedBucketItem(bucketItem) &&
                !hasDerivedBucketItems(bucketItem, referencePoint.buckets);
            const shouldAddAfterMasterItem = bucket.localIdentifier === BucketNames.MEASURES;

            if (shouldAddItem && !shouldAddAfterMasterItem) {
                resultItems.push(newDerivedBucketItem);
            }

            resultItems.push(bucketItem);

            if (shouldAddItem && shouldAddAfterMasterItem) {
                resultItems.push(newDerivedBucketItem);
            }

            return resultItems;
        }, []);
    }
}

// (C) 2007-2018 GoodData Corporation
import React from "react";
import { IPreparedExecution } from "@gooddata/sdk-backend-spi";
import { IBucket, IMeasure, INullableFilter, newArithmeticMeasure, newBucket } from "@gooddata/sdk-model";
import {
    BucketNames,
    Subtract,
    useResolveValuesWithPlaceholders,
    withContexts,
    MeasureOrPlaceholder,
    NullableFiltersOrPlaceholders,
} from "@gooddata/sdk-ui";
import { IBucketChartProps, ICoreChartProps } from "../../interfaces";
import { CoreHeadline } from "./CoreHeadline";
import omit from "lodash/omit";
import invariant from "ts-invariant";

//
// Public interface
//

/**
 * @public
 */
export interface IHeadlineBucketProps {
    /**
     * Specify the measure whose value will be shown as the headline.
     */
    primaryMeasure: MeasureOrPlaceholder;

    /**
     * Optionally specify secondary measure whose value will be shown for comparison with the primary measure.
     * The change in percent between the two values will also be calculated and displayed.
     */
    secondaryMeasure?: MeasureOrPlaceholder;

    /**
     * Optionally specify custom change measure whose value will be shown as a change trend.
     * If not provided the change in percent between the primary and secondary values will be calculated and displayed.
     */
    changeMeasure?: MeasureOrPlaceholder;

    /**
     * Optionally specify filters to apply on the data to chart.
     */
    filters?: NullableFiltersOrPlaceholders;

    /**
     * Optional resolution context for composed placeholders.
     */
    placeholdersResolutionContext?: any;
}

/**
 * @public
 */
export interface IHeadlineProps extends IBucketChartProps, IHeadlineBucketProps {}

const WrappedHeadline = withContexts(RenderHeadline);

/**
 * [Headline](https://sdk.gooddata.com/gooddata-ui/docs/headline_component.html)
 * Headline shows a single number or compares two numbers. You can display both measures and attributes.
 *
 * Headlines have two sections: Measure (primary) and Measure (secondary).
 * You can add one item to each section. If you add both items, the headline also displays the change in percent. If change should represent something different, provide changeMeasure
 *
 * @public
 */
export const Headline = (props: IHeadlineProps) => {
    const [primaryMeasure, secondaryMeasure, changeMeasure, filters] = useResolveValuesWithPlaceholders(
        [props.primaryMeasure, props.secondaryMeasure, props.changeMeasure, props.filters],
        props.placeholdersResolutionContext,
    );

    return <WrappedHeadline {...props} {...{ primaryMeasure, secondaryMeasure, changeMeasure, filters }} />;
};

export function RenderHeadline(props: IHeadlineProps): JSX.Element {
    invariant(props.primaryMeasure, "The property primaryMeasure must be specified.");
    return <CoreHeadline {...toCoreHeadlineProps(props)} />;
}

//
// Internals
//

type IIrrelevantHeadlineProps = IHeadlineBucketProps & IBucketChartProps;
type IHeadlineNonBucketProps = Subtract<IHeadlineProps, IIrrelevantHeadlineProps>;

function defineChangeMeasure(primaryMeasure: IMeasure, secondaryMeasure: IMeasure) {
    if (primaryMeasure && secondaryMeasure) {
        return newArithmeticMeasure([primaryMeasure, secondaryMeasure], "change");
    }
}

export function toCoreHeadlineProps(props: IHeadlineProps): ICoreChartProps {
    console.log("toCoreHeadlineProps");
    const usedChangeMeasure = props.changeMeasure
        ? props.changeMeasure
        : defineChangeMeasure(props.primaryMeasure as IMeasure, props.secondaryMeasure as IMeasure);
    const buckets = [
        newBucket(
            BucketNames.MEASURES,
            props.primaryMeasure as IMeasure,
            props.secondaryMeasure as IMeasure,
            usedChangeMeasure as IMeasure,
        ),
    ];

    const newProps: IHeadlineNonBucketProps = omit<IHeadlineProps, keyof IIrrelevantHeadlineProps>(props, [
        "primaryMeasure",
        "secondaryMeasure",
        "changeMeasure",
        "filters",
        "backend",
    ]);

    return {
        ...newProps,
        execution: createExecution(buckets, props),
        exportTitle: props.exportTitle || "Headline",
    };
}

function createExecution(buckets: IBucket[], props: IHeadlineProps): IPreparedExecution {
    const { backend, workspace, execConfig } = props;

    return backend
        .withTelemetry("Headline", props)
        .workspace(workspace)
        .execution()
        .forBuckets(buckets, props.filters as INullableFilter[])
        .withDimensions({ itemIdentifiers: ["measureGroup"] })
        .withExecConfig(execConfig);
}

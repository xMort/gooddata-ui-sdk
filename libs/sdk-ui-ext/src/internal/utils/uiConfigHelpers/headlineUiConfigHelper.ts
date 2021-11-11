// (C) 2019-2021 GoodData Corporation
import cloneDeep from "lodash/cloneDeep";
import set from "lodash/set";
import { IntlShape } from "react-intl";

import { BucketNames, VisualizationTypes } from "@gooddata/sdk-ui";
import { IUiConfig, IReferencePoint } from "../../interfaces/Visualization";
import { DEFAULT_HEADLINE_UICONFIG } from "../../constants/uiConfig";
import { BUCKETS } from "../../constants/bucket";

import { hasNoMeasures, hasNoSecondaryMeasures, hasNoTertiaryMeasures } from "./../bucketRules";

import { setBucketTitles, getItemsCount } from "./../bucketHelper";
import { getTranslation } from "./../translations";

import headlineMeasuresIcon from "../../assets/headline/bucket-title-measures.svg";
import headlineSecondaryMeasuresIcon from "../../assets/headline/bucket-title-secondary-measures.svg";
import headlineTertiaryMeasuresIcon from "../../assets/headline/bucket-title-tertiary-measures.svg";

export function getDefaultHeadlineUiConfig(): IUiConfig {
    return cloneDeep(DEFAULT_HEADLINE_UICONFIG);
}

export function getHeadlineUiConfig(referencePoint: IReferencePoint, intl: IntlShape): IUiConfig {
    let uiConfig = getDefaultHeadlineUiConfig();

    const buckets = referencePoint?.buckets ?? [];
    const viewCanAddPrimaryItems = hasNoMeasures(buckets);
    const viewCanAddSecondaryItems = hasNoSecondaryMeasures(buckets);
    const viewCanAddTertiaryItems = hasNoTertiaryMeasures(buckets);

    uiConfig = setBucketTitles(
        {
            ...referencePoint,
            uiConfig,
        },
        VisualizationTypes.HEADLINE,
        intl,
    );

    set(uiConfig, [BUCKETS, BucketNames.MEASURES, "canAddItems"], viewCanAddPrimaryItems);
    set(uiConfig, [BUCKETS, BucketNames.SECONDARY_MEASURES, "canAddItems"], viewCanAddSecondaryItems);
    set(uiConfig, [BUCKETS, BucketNames.TERTIARY_MEASURES, "canAddItems"], viewCanAddTertiaryItems);

    set(uiConfig, [BUCKETS, BucketNames.MEASURES, "icon"], headlineMeasuresIcon);
    set(uiConfig, [BUCKETS, BucketNames.SECONDARY_MEASURES, "icon"], headlineSecondaryMeasuresIcon);
    set(uiConfig, [BUCKETS, BucketNames.TERTIARY_MEASURES, "icon"], headlineTertiaryMeasuresIcon);

    const primaryMeasuresCount = getItemsCount(buckets, BucketNames.MEASURES);
    const secondaryMeasuresCount = getItemsCount(buckets, BucketNames.SECONDARY_MEASURES);

    if (primaryMeasuresCount === 0 && secondaryMeasuresCount !== 0) {
        uiConfig.customError = {
            heading: getTranslation("dashboard.error.missing_primary_bucket_item.heading", intl),
            text: getTranslation("dashboard.error.missing_primary_bucket_item.text", intl),
        };
    }

    return uiConfig;
}

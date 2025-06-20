// (C) 2024-2025 GoodData Corporation

import { IDashboardLayout } from "@gooddata/sdk-model";

import { ExtendedDashboardWidget } from "../../../model/index.js";
import {
    IDashboardLayoutItemFacade,
    IDashboardLayoutSectionFacade,
} from "../../../_staging/dashboard/flexibleLayout/index.js";

export const getLayoutConfiguration = (layout: IDashboardLayout<ExtendedDashboardWidget | unknown>) => {
    // backward compatibility, assume the container direction is set to "row" when not set
    const direction = layout.configuration?.direction ?? "row";

    const sectionsConfiguration = layout.configuration?.sections;
    // backward compatibility, assume header is enabled when configuration is not set on the layout
    const enableHeader = sectionsConfiguration?.enableHeader ?? true;

    return {
        direction,
        sections: {
            areHeadersEnabled: enableHeader,
        },
    };
};

export const getLayoutConfigurationForItem = (
    item: IDashboardLayoutItemFacade<ExtendedDashboardWidget | unknown>,
) => {
    return getLayoutConfiguration(item.section().layout().raw());
};

export const getLayoutConfigurationForSection = (
    section: IDashboardLayoutSectionFacade<ExtendedDashboardWidget | unknown>,
) => {
    return getLayoutConfiguration(section.layout().raw());
};

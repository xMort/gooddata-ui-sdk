// (C) 2024-2025 GoodData Corporation

import { IDashboardLayout, isDashboardLayout } from "@gooddata/sdk-model";
import { ExtendedDashboardWidget } from "../../../model/index.js";
import {
    IDashboardLayoutItemFacade,
    IDashboardLayoutSectionFacade,
    DashboardLayoutItemFacade,
    DashboardLayoutSectionFacade,
} from "../../../_staging/dashboard/flexibleLayout/index.js";

/**
 * Returns configuration from the parent layout of the provided item. In the case of a layout item or section,
 * it returns configuration from the layout of the parent item. When a layout is provided, the function
 * returns its direct configuration. The function returns the default configuration when the parent layout
 * does not have it specified.
 *
 * @param item - item facade, section facade, or raw layout for which we want to get the configuration.
 */
export function getLayoutConfiguration(
    item:
        | IDashboardLayout<ExtendedDashboardWidget | unknown>
        | IDashboardLayoutItemFacade<ExtendedDashboardWidget | unknown>
        | IDashboardLayoutSectionFacade<ExtendedDashboardWidget | unknown>,
) {
    if (item instanceof DashboardLayoutItemFacade) {
        return getLayoutConfiguration(item.section().layout().raw());
    }
    if (item instanceof DashboardLayoutSectionFacade) {
        return getLayoutConfiguration(item.layout().raw());
    }
    if (!isDashboardLayout(item)) {
        throw new Error("Unsupported layout item type provided.");
    }
    return getSanitizedConfigurationFromLayout(item);
}

function getSanitizedConfigurationFromLayout(layout: IDashboardLayout<ExtendedDashboardWidget | unknown>) {
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
}

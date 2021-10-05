// (C) 2020 GoodData Corporation
import React, { useMemo } from "react";
import { useDashboardComponentsContext } from "../../dashboardContexts";
import { useDashboardWidgetProps } from "./DashboardWidgetPropsContext";
import { extendedWidgetDebugStr } from "../../../model";
import { DefaultDashboardWidgetInner } from "./DefaultDashboardWidget";
import { isDashboardWidget } from "@gooddata/sdk-backend-spi";

const BadWidgetType: React.FC = () => {
    return <div>Missing renderer</div>;
};

const MissingWidget: React.FC = () => {
    return <div>Missing widget</div>;
};

/**
 * @internal
 */
export const DashboardWidget: React.FC = (): JSX.Element => {
    const { WidgetComponentProvider } = useDashboardComponentsContext();
    const { widget } = useDashboardWidgetProps();
    const WidgetComponent = useMemo((): React.ComponentType => {
        // TODO: we need to get rid of this; the widget being optional at this point is the problem; the parent
        //  components (or possibly the model) should deal with layout items that have no valid widgets associated
        //  and thus short-circuit.
        if (!widget) {
            return MissingWidget;
        }

        const Component = WidgetComponentProvider(widget);

        if (Component) {
            return Component;
        }

        if (isDashboardWidget(widget)) {
            return DefaultDashboardWidgetInner;
        } else if (widget) {
            // eslint-disable-next-line no-console
            console.warn(`Unable to render widget ${extendedWidgetDebugStr(widget)}`);

            return BadWidgetType;
        } else {
            // TODO: same as the above note
            // eslint-disable-next-line no-console
            console.warn("Attempting render an undefined widget.");

            return MissingWidget;
        }
    }, [widget]);

    return <WidgetComponent />;
};

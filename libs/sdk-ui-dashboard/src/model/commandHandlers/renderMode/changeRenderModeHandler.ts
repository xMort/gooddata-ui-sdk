// (C) 2021-2024 GoodData Corporation
import { SagaIterator } from "redux-saga";
import { call, put, select, SagaReturnType } from "redux-saga/effects";
import { batchActions } from "redux-batched-actions";
import { DashboardContext } from "../../types/commonTypes.js";
import { ChangeRenderMode, resetDashboard as resetDashboardCommand } from "../../commands/index.js";
import { DashboardRenderModeChanged } from "../../events/index.js";
import { renderModeChanged } from "../../events/renderMode.js";
import { renderModeActions } from "../../store/renderMode/index.js";
import { resetDashboardRuntime } from "../dashboard/resetDashboardHandler.js";
import { validateDrills } from "../common/validateDrills.js";
import { selectAllAnalyticalWidgets } from "../../store/layout/layoutSelectors.js";
import { validateDrillToCustomUrlParams } from "../common/validateDrillToCustomUrlParams.js";
import { isInsightWidget } from "@gooddata/sdk-model";
import { loadInaccessibleDashboards } from "../dashboard/initializeDashboardHandler/loadInaccessibleDashboards.js";
import { uiActions } from "../../store/ui/index.js";
import { PromiseFnReturnType } from "../../types/sagas.js";
import { selectCatalogFacts, selectCatalogMeasures } from "../../store/catalog/catalogSelectors.js";
import { catalogActions } from "../../store/catalog/index.js";

import { loadMeasuresAndFacts } from "./loadMeasuresAndFacts.js";

export function* changeRenderModeHandler(
    ctx: DashboardContext,
    cmd: ChangeRenderMode,
): SagaIterator<DashboardRenderModeChanged> {
    const {
        payload: { renderMode, renderModeChangeOptions },
        correlationId,
    } = cmd;

    // Reset dashboard and widgets first, as changing the edit mode forces visualizations to re-execute.
    // To avoid sending DashboardWidgetExecutionSucceeded or DashboardWidgetExecutionFailed events
    // for discarded widgets, sanitization must be done before the mode is changed.
    if (renderModeChangeOptions.resetDashboard) {
        const data: SagaReturnType<typeof resetDashboardRuntime> = yield call(
            resetDashboardRuntime,
            ctx,
            resetDashboardCommand(correlationId),
        );
        yield put(
            batchActions([
                data.batch,
                uiActions.resetInvalidDrillWidgetRefs(),
                uiActions.resetAllInvalidCustomUrlDrillParameterWidgetsWarnings(),
                renderModeActions.setRenderMode(renderMode),
            ]),
        );
        yield put(data.reset);
    } else {
        yield put(
            batchActions([
                uiActions.resetInvalidDrillWidgetRefs(),
                uiActions.resetAllInvalidCustomUrlDrillParameterWidgetsWarnings(),
                renderModeActions.setRenderMode(renderMode),
            ]),
        );
    }

    if (renderMode === "edit") {
        const widgets: ReturnType<typeof selectAllAnalyticalWidgets> = yield select(
            selectAllAnalyticalWidgets,
        );
        yield call(loadInaccessibleDashboards, ctx, widgets);
        yield call(validateDrills, ctx, cmd, widgets);
        yield call(validateDrillToCustomUrlParams, widgets.filter(isInsightWidget));
        yield call(loadMeasuresAndFactsIfNecessary, ctx);
    }

    return renderModeChanged(ctx, renderMode, correlationId);
}

function* loadMeasuresAndFactsIfNecessary(ctx: DashboardContext) {
    // If supportsKpiWidget == true, measures and facts were loaded via loadCatalog in
    // initializeDashboardHandler, otherwise we need to load them here when we are going into edit mode
    // for the sake of attribute filters and its elements validation feature (unless they were loaded
    // already by previous edit mode switch)
    if (!ctx.backend.capabilities.supportsKpiWidget) {
        const facts: ReturnType<typeof selectCatalogFacts> = yield select(selectCatalogFacts);
        const measures: ReturnType<typeof selectCatalogMeasures> = yield select(selectCatalogMeasures);

        // loadCatalog set facts = [], measures = [],
        // let's consider non-existence in state as the fact that it was not loaded yet
        const shouldLoadMeasuresAndFacts = facts.length === 0 && measures.length === 0;

        if (shouldLoadMeasuresAndFacts) {
            const catalog: PromiseFnReturnType<typeof loadMeasuresAndFacts> = yield call(
                loadMeasuresAndFacts,
                ctx,
            );
            yield put(
                catalogActions.setCatalogMeasuresAndFacts({
                    facts: catalog.facts(),
                    measures: catalog.measures(),
                }),
            );
        }
    }
}

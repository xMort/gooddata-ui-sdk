// (C) 2021-2022 GoodData Corporation
import { combineReducers, configureStore, EnhancedStore, Middleware } from "@reduxjs/toolkit";
import createSagaMiddleware, { Saga, SagaIterator, Task } from "redux-saga";
import { enableBatching } from "redux-batched-actions";
import { v4 as uuidv4 } from "uuid";
import { filterContextSliceReducer } from "./filterContext";
import { layoutSliceReducer } from "./layout";
import { loadingSliceReducer } from "./loading";
import { savingSliceReducer } from "./saving";
import { insightsSliceReducer } from "./insights";
import { createRootEventEmitter } from "./_infra/rootEventEmitter";
import { DashboardEventHandler } from "../eventHandlers/eventHandler";
import { rootCommandHandler } from "./_infra/rootCommandHandler";
import { DashboardContext, PrivateDashboardContext } from "../types/commonTypes";
import { configSliceReducer } from "./config";
import { dateFilterConfigSliceReducer } from "./dateFilterConfig";
import { permissionsSliceReducer } from "./permissions";
import { alertsSliceReducer } from "./alerts";
import { catalogSliceReducer } from "./catalog";
import { call, fork } from "redux-saga/effects";
import { userSliceReducer } from "./user";
import { metaSliceReducer } from "./meta";
import { DashboardDispatch, DashboardState } from "./types";
import { AllQueryServices } from "../queryServices";
import { executionResultsSliceReducer } from "./executionResults";
import { createQueryProcessingModule } from "./_infra/queryProcessing";
import { IDashboardQueryService } from "./_infra/queryService";
import values from "lodash/values";
import merge from "lodash/merge";
import keyBy from "lodash/keyBy";
import { listedDashboardsSliceReducer } from "./listedDashboards";
import { accessibleDashboardsSliceReducer } from "./accessibleDashboards";
import { backendCapabilitiesSliceReducer } from "./backendCapabilities";
import { drillTargetsReducer } from "./drillTargets";
import { DashboardEventType } from "../events";
import { DashboardCommandType } from "../commands";
import { drillSliceReducer } from "./drill";
import { uiSliceReducer } from "./ui";
import { getDashboardContext } from "./_infra/contexts";
import { RenderMode } from "../../types";
import { legacyDashboardsSliceReducer } from "./legacyDashboards";
import { placeholdersSliceReducer } from "./placeholders";

const nonSerializableEventsAndCommands: (DashboardEventType | DashboardCommandType | string)[] = [
    "GDC.DASH/EVT.COMMAND.STARTED",
    "GDC.DASH/EVT.COMMAND.FAILED",
    "GDC.DASH/EVT.QUERY.FAILED",
    "@@GDC.DASH.SAVE_NEW",
    "@@GDC.DASH.SAVE_EXISTING",
    "@@GDC.DASH.SAVE_AS",
    // Execution events have errors, execution definitions etc. in them
    "GDC.DASH/EVT.WIDGET.EXECUTION_STARTED",
    "GDC.DASH/EVT.WIDGET.EXECUTION_SUCCEEDED",
    "GDC.DASH/EVT.WIDGET.EXECUTION_FAILED",
    // Custom events may contain whatever
    "GDC.DASH/CMD.EVENT.TRIGGER",
    // Drill commands & events contain non-serializable dataView
    "GDC.DASH/CMD.DRILL",
    "GDC.DASH/CMD.EXECUTION_RESULT.UPSERT",
    "GDC.DASH/EVT.DRILL.REQUESTED",
    "GDC.DASH/EVT.DRILL.RESOLVED",
    "GDC.DASH/CMD.DRILL.DRILL_DOWN",
    "GDC.DASH/EVT.DRILL.DRILL_DOWN.REQUESTED",
    "GDC.DASH/EVT.DRILL.DRILL_DOWN.RESOLVED",
    "GDC.DASH/CMD.DRILL.DRILL_TO_INSIGHT",
    "GDC.DASH/EVT.DRILL.DRILL_TO_INSIGHT.REQUESTED",
    "GDC.DASH/EVT.DRILL.DRILL_TO_INSIGHT.RESOLVED",
    "GDC.DASH/CMD.DRILL.DRILL_TO_DASHBOARD",
    "GDC.DASH/EVT.DRILL.DRILL_TO_DASHBOARD.REQUESTED",
    "GDC.DASH/EVT.DRILL.DRILL_TO_DASHBOARD.RESOLVED",
    "GDC.DASH/CMD.DRILL.DRILL_TO_ATTRIBUTE_URL",
    "GDC.DASH/EVT.DRILL.DRILL_TO_ATTRIBUTE_URL.REQUESTED",
    "GDC.DASH/EVT.DRILL.DRILL_TO_ATTRIBUTE_URL.RESOLVED",
    "GDC.DASH/CMD.DRILL.DRILL_TO_CUSTOM_URL",
    "GDC.DASH/EVT.DRILL.DRILL_TO_CUSTOM_URL.REQUESTED",
    "GDC.DASH/EVT.DRILL.DRILL_TO_CUSTOM_URL.RESOLVED",
    "GDC.DASH/CMD.DRILL.DRILL_TO_LEGACY_DASHBOARD",
    "GDC.DASH/EVT.DRILL.DRILL_TO_LEGACY_DASHBOARD.REQUESTED",
    "GDC.DASH/EVT.DRILL.DRILL_TO_LEGACY_DASHBOARD.RESOLVED",
    "GDC.DASH/CMD.DRILL.DRILLABLE_ITEMS.CHANGE",
    "GDC.DASH/EVT.DRILL.DRILLABLE_ITEMS.CHANGED",
    "meta/setDrillableItems",
    "layout/updateWidgetIdentities",
    "executionResults/upsertExecutionResult",
    "loadingSlice/setLoadingError",
];

/*
 * This explicit typing is unfortunate but cannot find better way. Normally the typings get inferred from store,
 * however since this code creates store dynamically such thing is not possible.
 *
 * Beware.. even if we get the inference working through the use of some throw-away internal, the
 * api-extractor will have problems if just the inferred types gets exported unless the value
 * from which it is inferred is exported as well.
 */

/**
 * @internal
 */
export type DashboardStore = EnhancedStore<DashboardState>;

export interface DashboardStoreEventing {
    /**
     * Specify event handlers to register during the initialization.
     */
    initialEventHandlers?: DashboardEventHandler[];

    /**
     * Specify callback that will be called each time the state changes.
     */
    onStateChange?: (state: DashboardState, dispatch: DashboardDispatch) => void;

    /**
     * Specify callback that will be called when the dashboard eventing subsystem initializes and
     * it is possible to register new or unregister existing event handlers.
     *
     * @remarks
     * Note: these callbacks allow modification of event handlers on an existing, initialized dashboard. See
     * {@link IDashboardEventing.eventHandlers} prop if you want to register handlers _before_ the dashboard
     * initialization starts.
     */
    onEventingInitialized?: (
        registerEventHandler: (handler: DashboardEventHandler) => void,
        unregisterEventHandler: (handler: DashboardEventHandler) => void,
    ) => void;
}

export interface DashboardStoreConfig {
    /**
     * Specifies context that will be hammered into the saga middleware.
     *
     * @remarks
     * All sagas can then access the values from the context.
     *
     * Remember: `DashboardContext` is part of the public API. Do not store internals in here. If need
     * to have internals in the context, then use the privateContext.
     *
     * This context is automatically passed to all command handlers, query processors and background workers.
     * If you need to obtain the context from some other place, use the `getDashboardContext` generator
     */
    dashboardContext: DashboardContext;

    /**
     * Specify private context that will be hammered into the saga middleware.
     *
     * @remarks
     * Private context may contain internal global configuration / customization that needs to be available
     * in the different parts of the model.
     *
     * The private context is not passed around by the infrastructure. To obtain it, use the `getPrivateContext`
     * generator.
     */
    privateContext?: PrivateDashboardContext;

    /**
     * Specify redux middleware to register into the store.
     */
    additionalMiddleware?: Middleware<any>;

    /**
     * Eventing configuration to apply during store initialization.
     */
    eventing?: DashboardStoreEventing;

    /**
     * Specify query service implementations.
     *
     * @remarks
     * These will be used to override the default implementations and add new services.
     */
    queryServices?: IDashboardQueryService<any, any>[];

    /**
     * Specify background workers implementations.
     *
     * @remarks
     * Workers are redux-saga iterators that run on the background, they can listen to dashboard events and fire dashboard commands.
     * All the provided workers will run in parallel on the background.
     * Background workers are processed last in the chain of all command and event processing.
     */
    backgroundWorkers: ((context: DashboardContext) => SagaIterator<void>)[];

    /**
     * @internal
     *
     * Specify which render mode will be used for initial rendering.
     *
     * @remarks
     * If you do not specify initialRenderMode, the dashboard component will be display in view mode.
     */
    initialRenderMode: RenderMode;
}

function* rootSaga(
    eventEmitter: Saga,
    commandHandler: Saga,
    queryProcessor: Saga,
    backgroundWorkers: ((context: DashboardContext) => SagaIterator<void>)[],
): SagaIterator<void> {
    const dashboardContext: DashboardContext = yield call(getDashboardContext);

    try {
        yield fork(eventEmitter);
        yield fork(commandHandler);
        yield fork(queryProcessor);
        for (const worker of backgroundWorkers) {
            yield fork(worker, dashboardContext);
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Root saga failed", e);
    }
}

/**
 * Fully configured and initialized dashboard store realized by redux and with redux-sagas.
 */
export interface ReduxedDashboardStore {
    store: DashboardStore;
    registerEventHandler: (handler: DashboardEventHandler) => void;
    unregisterEventHandler: (handler: DashboardEventHandler) => void;
    rootSagaTask: Task;
}

/**
 * This middleware ensures that actions occurring in the dashboard have their meta enriched with appropriate
 * information:
 *  - all actions have an acceptedTimestamp - this represents the moment the action was recognized by the redux machinery
 *  - command actions also have a uuid - this is mainly used to implement the undo/redo logic
 *
 * Moving forward, there might be even more types of information added here.
 *
 * Note that for the time-related properties to make sense, this middleware should be registered as the first of all the middlewares if possible.
 */
const actionMetaFillingMiddleware: Middleware = () => (next) => (action) => {
    const nowTimestamp = +new Date();
    action.meta = {
        ...action.meta,
        acceptedTimestamp: nowTimestamp,
    };

    if (action.type.startsWith("GDC.DASH/CMD.")) {
        // see: https://www.reddit.com/r/reactjs/comments/7cfgzr/redux_modifying_action_payload_in_middleware/dppknrh?utm_source=share&utm_medium=web2x&context=3
        action.meta = {
            ...action.meta,
            uuid: uuidv4(),
        };
    }

    return next(action);
};

function mergeQueryServices(
    original: IDashboardQueryService<any, any>[],
    extras: IDashboardQueryService<any, any>[] = [],
): IDashboardQueryService<any, any>[] {
    return values(
        merge(
            {},
            keyBy(original, (service) => service.name),
            keyBy(extras, (service) => service.name),
        ),
    );
}

/**
 * Creates a new store for a dashboard.
 *
 * @param config - runtime configuration to apply on the middlewares and the store
 */
export function createDashboardStore(config: DashboardStoreConfig): ReduxedDashboardStore {
    const queryProcessing = createQueryProcessingModule(
        mergeQueryServices(AllQueryServices, config.queryServices),
    );
    const sagaMiddleware = createSagaMiddleware({
        context: {
            dashboardContext: config.dashboardContext,
            privateContext: config.privateContext ?? {},
        },
    });

    const rootReducer = combineReducers<DashboardState>({
        loading: loadingSliceReducer,
        saving: savingSliceReducer,
        backendCapabilities: backendCapabilitiesSliceReducer,
        config: configSliceReducer,
        permissions: permissionsSliceReducer,
        filterContext: filterContextSliceReducer,
        layout: layoutSliceReducer,
        dateFilterConfig: dateFilterConfigSliceReducer,
        insights: insightsSliceReducer,
        alerts: alertsSliceReducer,
        drillTargets: drillTargetsReducer,
        catalog: catalogSliceReducer,
        user: userSliceReducer,
        meta: metaSliceReducer,
        drill: drillSliceReducer,
        listedDashboards: listedDashboardsSliceReducer,
        accessibleDashboards: accessibleDashboardsSliceReducer,
        legacyDashboards: legacyDashboardsSliceReducer,
        executionResults: executionResultsSliceReducer,
        ui: uiSliceReducer,
        placeholders: placeholdersSliceReducer,
        _queryCache: queryProcessing.queryCacheReducer,
    });

    const store = configureStore({
        reducer: enableBatching(rootReducer),
        middleware: (getDefaultMiddleware) => {
            return getDefaultMiddleware({
                thunk: false,
                /*
                 * All events that fly through the store have the dashboard context in the `ctx` prop. This is
                 * for the receiver of the event (who may be well off redux).
                 *
                 * Additionally, some events - namely those reporting on error scenarios may include the actual
                 * error instance in them.
                 */
                serializableCheck: {
                    ignoredActions: nonSerializableEventsAndCommands,
                    // events always include ctx
                    // various envelopes allow sending explicit callback functions that will be fired
                    // while processing the enveloped content. the envelopes are purely for 'promisification' of
                    // command or query handling, they have no impact on state; it is no problem that they
                    // have such content in them
                    ignoredActionPaths: ["ctx", "onStart", "onError", "onSuccess"],
                    ignoredPaths: [
                        // drillableItems can be functions (header predicates)
                        "drill.drillableItems",
                        // executions can have Errors stored, also some decorated execution results are non-serializable too
                        "executionResults",
                    ],
                    // prolong the check limit, otherwise this will flood the logs on CI with non-actionable warnings
                    warnAfter: 128,
                },
            })
                .prepend(actionMetaFillingMiddleware)
                .concat(
                    ...(config.additionalMiddleware ? [config.additionalMiddleware] : []),
                    sagaMiddleware,
                );
        },
    });

    const { eventing = {} } = config;

    if (eventing.onStateChange) {
        store.subscribe(() => eventing.onStateChange?.(store.getState(), store.dispatch));
    }

    const rootEventEmitter = createRootEventEmitter(eventing.initialEventHandlers, store.dispatch);
    eventing.onEventingInitialized?.(rootEventEmitter.registerHandler, rootEventEmitter.unregisterHandler);

    const rootSagaTask = sagaMiddleware.run(
        rootSaga,
        rootEventEmitter.eventEmitterSaga,
        rootCommandHandler,
        queryProcessing.rootQueryProcessor,
        config.backgroundWorkers,
    );

    return {
        store,
        registerEventHandler: rootEventEmitter.registerHandler,
        unregisterEventHandler: rootEventEmitter.unregisterHandler,
        rootSagaTask,
    };
}

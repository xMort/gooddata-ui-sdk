// (C) 2021 GoodData Corporation
import React from "react";
import { InsightComponentProvider } from "../presentation";
import {
    DashboardDispatch,
    DashboardEventHandler,
    DashboardEventHandlerFn,
    DashboardEvents,
    DashboardEventType,
    DashboardState,
    ICustomDashboardEvent,
} from "../model";

/**
 * @alpha
 */
export interface IDashboardInsightCustomizer {
    /**
     * A convenience method that will register a specific React component to use for rendering
     * any insight that is tagged with the provided `tag`. If plugins register multiple providers
     * for the same tag, then the provider will be picked using 'last-win' strategy.
     *
     * @param tag - tag to look for on the insight
     * @param component - component to use if the tag is found
     * @returns self, for call chaining sakes
     */
    withTag(tag: string, component: React.ComponentType): IDashboardInsightCustomizer;

    /**
     * Register a provider for React components to render insights. A provider takes the insight and
     * widget that it is part of as input and is expected to return a React component that should be
     * used to render that insight.
     *
     * If the provider returns `undefined` then:
     *
     * -  if there are other providers registered, they will be called to see if they can provide
     *    a component to render the insight
     * -  if there are no other providers registered, the default, built-in component will be used.
     *
     * You may register multiple providers. They will be evaluated in the order you register them.
     *
     * @remarks see the {@link IDashboardInsightCustomizer.withTag} convenience method to register components for insights
     *  with particular tags.
     * @param provider - provider to register
     * @returns self, for call chaining sakes
     */
    withCustomProvider(provider: InsightComponentProvider): IDashboardInsightCustomizer;

    /**
     * Register a factory for insight decorator providers. Decorators are a way to add customizations or embellishments on top
     * of an existing component. Decorators are more complex to write because they need to work with the component
     * they should decorate and add 'something' on top of that component.
     *
     * This is best illustrated on an example:
     *
     * ```
     * withCustomDecorator((next) => {
     *     return (insight, widget) => {
     *         if (some_condition_to_prevent_decoration) {
     *             return undefined;
     *         }
     *
     *         function MyCustomDecorator() {
     *              const Decorated = next(insight, widget);
     *
     *              return (
     *                  <div>
     *                      <p>My Custom Decoration</p>
     *                      <Decorated/>
     *                  <div>
     *              )
     *         }
     *
     *         return MyCustomDecorator;
     *     }
     * })
     * ```
     *
     * The above shows how to register a decorator that will use some condition to determine whether particular
     * insight is eligible for decoration. If yes, it will add some extra text in front of the insight. Decorator
     * defers rendering of the actual insight to the underlying provider.
     *
     * Note: the factory function that you specify will be called immediately at the registration time. The
     * provider that it returns will be called at render time.
     *
     * @param providerFactory - factory
     */
    withCustomDecorator(
        providerFactory: (next: InsightComponentProvider) => InsightComponentProvider,
    ): IDashboardInsightCustomizer;
}

/**
 * @alpha
 */
export interface IDashboardCustomizer {
    /**
     * Customize how rendering of insights is done.
     */
    insightRendering(): IDashboardInsightCustomizer;
}

/**
 * TODO: move to common location
 *
 * @alpha
 */
export type DashboardStateChangeCallback = (state: DashboardState, dispatch: DashboardDispatch) => void;

/**
 * Defines a facade that you can use to register or unregister dashboard event handlers.
 *
 * @alpha
 */
export interface IDashboardEventHandling {
    /**
     * Adds a handler for particular event type. Every time event of that type occurs, the provided callback
     * function will be triggered.
     *
     * @param eventType - type of the event to handle; this can be either built-event event type (see {@link DashboardEventType}), a custom
     *  event type or '*' to register handler for all events
     * @param callback - function to call when the event occurs
     */
    addEventHandler<TEvents extends DashboardEvents | ICustomDashboardEvent>(
        eventType: DashboardEventType | string | "*",
        callback: DashboardEventHandlerFn<TEvents>,
    ): IDashboardEventHandling;

    /**
     * Removes a handler for particular event type. This is reverse operation to {@link IDashboardEventHandling.addEventHandler}. In order for
     * this method to remove a handler, the arguments must be the same when you added the handler.
     *
     * E.g. it is not possible to add a handler for all events using '*' and then subtract just one particular event
     * from handling.
     *
     * @param eventType - type of the event to stop handling; this can be either built-event event type (see {@link DashboardEventType}), a custom
     *  event type or '*' to register handler for all events
     * @param callback  - originally registered callback function
     * @returns self, for call chaining sakes
     */
    removeEventHandler<TEvents extends DashboardEvents | ICustomDashboardEvent>(
        eventType: DashboardEventType | string | "*",
        callback: DashboardEventHandlerFn<TEvents>,
    ): IDashboardEventHandling;

    /**
     * Adds a custom event handler. This is a lower-level API where the handler can include both the function to
     * evaluate events and the function to trigger when the evaluation succeeds.
     *
     * @param handler - event handler to add
     * @returns self, for call chaining sakes
     */
    addCustomEventHandler(handler: DashboardEventHandler): IDashboardEventHandling;

    /**
     * Removes custom event handler. In order for successful removal the entire handler object must be
     * exactly the same as the one that was used when you added the handler.
     *
     * @param handler - event handler to remove
     * @returns self, for call chaining sakes
     */
    removeEventCustomHandler(handler: DashboardEventHandler): IDashboardEventHandling;

    /**
     * Subscribe to state changes of the dashboard.
     *
     * Note: there is no need to use this if all you need is your custom React components to get up-to-date state. Your
     * React component code can (and really should) use the {@link @gooddata/sdk-ui-dashboard#useDashboardSelector} and
     * {@link @gooddata/sdk-ui-dashboard#useDashboardDispatch} hooks instead.
     *
     * Subscription to state changes is only really needed if you have custom code outside of React components and
     * you need to extract custom data from state using the selectors API.
     *
     * @param callback - function to call when dashboard state changes; the function will be called with
     *  two parameters: the new state and an instance of dispatch to use.
     * @returns self, for call chaining sakes
     */
    subscribeToStateChanges(callback: DashboardStateChangeCallback): IDashboardEventHandling;

    /**
     * Unsubscribe from receiving calls about state changes of the dashboard.
     **
     * @param callback - callback that was previously used for subscription
     * @returns self, for call chaining sakes
     */
    unsubscribeFromStateChanges(callback: DashboardStateChangeCallback): IDashboardEventHandling;
}

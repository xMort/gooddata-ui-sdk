// (C) 2019-2024 GoodData Corporation
import React, { useMemo } from "react";
import { BackendProvider, WorkspaceProvider } from "@gooddata/sdk-ui";
import { Dashboard } from "@gooddata/sdk-ui-dashboard";

import { createBackend } from "./createBackend.js";

function hasCredentialsSetup(): boolean {
    return !!import.meta.env.VITE_TIGER_API_TOKEN;
}

const dashboard = import.meta.env.VITE_DASHBOARD;

const AppWithBackend: React.FC = () => {
    // only create the backend instance once
    const backend = useMemo(() => {
        return createBackend();
    }, []);

    return (
        <BackendProvider backend={backend}>
            <WorkspaceProvider workspace={import.meta.env.VITE_WORKSPACE}>
                {/* Build your playground components under the playground directory.*/}
                {dashboard ? (
                    <Dashboard
                        dashboard={dashboard}
                        config={{
                            initialRenderMode: "view",
                        }}
                    />
                ) : undefined}
            </WorkspaceProvider>
        </BackendProvider>
    );
};

export const App: React.FC = () => {
    if (!hasCredentialsSetup()) {
        return (
            <p>
                Your playground is not setup with credentials. Check out the README.md for more. TL;DR: point
                the playground against the public access proxy or set GDC_USERNAME and GDC_PASSWORD or
                TIGER_API_TOKEN in the .env file.
            </p>
        );
    }

    return <AppWithBackend />;
};

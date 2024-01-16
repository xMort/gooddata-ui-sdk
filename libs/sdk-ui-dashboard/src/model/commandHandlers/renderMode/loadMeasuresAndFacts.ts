// (C) 2021-2024 GoodData Corporation
import { idRef } from "@gooddata/sdk-model";
import { IWorkspaceCatalog, IWorkspaceCatalogFactoryOptions } from "@gooddata/sdk-backend-spi";

import { DashboardContext } from "../../types/commonTypes.js";

export function loadMeasuresAndFacts(ctx: DashboardContext): Promise<IWorkspaceCatalog> {
    const { backend, workspace, config } = ctx;
    const availability = config?.objectAvailability;

    const options: IWorkspaceCatalogFactoryOptions = {
        excludeTags: (availability?.excludeObjectsWithTags ?? []).map((tag) => idRef(tag)),
        includeTags: (availability?.includeObjectsWithTags ?? []).map((tag) => idRef(tag)),
        types: ["fact", "measure"],
        loadGroups: false,
    };

    return backend.workspace(workspace).catalog().withOptions(options).load();
}

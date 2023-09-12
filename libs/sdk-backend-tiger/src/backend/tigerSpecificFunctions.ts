// (C) 2022-2023 GoodData Corporation

import {
    ActionsApiProcessInvitationRequest,
    AnomalyDetectionResult,
    AnomalyUserNotification,
    ApiEntitlement,
    ClusteringResult,
    DataSourceParameter,
    DeclarativeAnalytics,
    DeclarativeModel,
    DeclarativePdm,
    DeclarativeTables,
    DeclarativeWorkspaceDataFilters,
    DependentEntitiesRequest,
    DependentEntitiesResponse,
    EntityIdentifier,
    ForecastResult,
    GenerateLdmRequest,
    HierarchyObjectIdentification,
    IdentifierDuplications,
    ITigerClient,
    JsonApiApiTokenInDocument,
    JsonApiApiTokenInTypeEnum,
    JsonApiApiTokenOutList,
    JsonApiCspDirectiveInDocument,
    JsonApiCspDirectiveInTypeEnum,
    JsonApiCustomApplicationSettingOut,
    JsonApiCustomApplicationSettingOutTypeEnum,
    JsonApiDatasetOutList,
    JsonApiDataSourceIdentifierOutDocument,
    JsonApiDataSourceIdentifierOutWithLinks,
    JsonApiDataSourceInAttributesTypeEnum,
    JsonApiDataSourceInDocument,
    JsonApiDataSourceInTypeEnum,
    JsonApiDataSourceOutDocument,
    JsonApiFilterContextOutWithLinks,
    jsonApiHeaders,
    JsonApiOrganizationOutMetaPermissionsEnum,
    JsonApiOrganizationPatchTypeEnum,
    JsonApiVisualizationObjectOutWithLinks,
    JsonApiWorkspaceInDocument,
    JsonApiWorkspaceInTypeEnum,
    KeyDriversDimension,
    LayoutApiPutWorkspaceLayoutRequest,
    LayoutApiSetPdmLayoutRequest,
    MetadataUtilities,
    OrganizationUtilities,
    PlatformUsage,
    RecentAnalyticalObject,
    Recommendation,
    ScanSqlResponse,
    TestDefinitionRequestTypeEnum,
    VisualizationObjectModelV1,
    WidgetAlertUserNotification,
    JsonApiWorkspaceDataFilterInDocument,
    JsonApiWorkspaceDataFilterOutDocument,
    JsonApiWorkspaceDataFilterSettingOutDocument,
    JsonApiWorkspaceDataFilterSettingInDocument,
} from "@gooddata/api-client-tiger";
import { convertApiError } from "../utils/errorHandling.js";
import uniq from "lodash/uniq.js";
import toLower from "lodash/toLower.js";
import { UnexpectedError, ErrorConverter, IAnalyticalBackend } from "@gooddata/sdk-backend-spi";
import isEmpty from "lodash/isEmpty.js";
import { AuthenticatedAsyncCall } from "@gooddata/sdk-backend-base";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { IUser, IMeasure, IWidgetAlert, IInsight } from "@gooddata/sdk-model";
import { convertMeasure } from "../convertors/toBackend/afm/MeasureConverter.js";
import { convertWidgetAlert } from "../convertors/fromBackend/analyticalDashboards/WidgetAlertConverter.js";
import { convertVisualizationObject } from "../convertors/fromBackend/visualizationObjects/VisualizationObjectConverter.js";
import { insightFromInsightDefinition } from "../convertors/fromBackend/InsightConverter.js";
import { isInheritedObject } from "../convertors/fromBackend/ObjectInheritance.js";

/**
 * @internal
 */
export interface IApiToken {
    id: string;
}

/**
 * @internal
 */
export interface IApiTokenExtended extends IApiToken {
    bearerToken: string | undefined;
}

/**
 * Copy of interface from gooddata/data-source-management
 * This should be refactored to have the source of truth here in SDK and not expose JSON API entities
 *
 * @internal
 */
export interface IDataSource {
    entity: JsonApiDataSourceInDocument;
    pdm: DeclarativePdm;
}

/**
 * @internal
 */
export interface ScanRequest {
    scanTables: boolean;
    scanViews: boolean;
    separator: string;
    tablePrefix: string;
    viewPrefix: string;
    schemata: string[];
}

/**
 * @internal
 */
export interface ScanResult {
    pdm: DeclarativeTables;
}

/**
 * @internal
 */
export interface PublishPdmResult {
    status: string;
}

/**
 * @internal
 */
export interface Entitlement {
    id: string;
    value?: string;
    expiry?: string;
}

/**
 * @internal
 */
export type IDataSourceType = JsonApiDataSourceInAttributesTypeEnum;

/**
 * @internal
 */
export type IDataSourcePermission = "MANAGE" | "USE";

/**
 * @internal
 */
export interface IDataSourceConnectionInfo {
    id: string;
    type: IDataSourceType;
    name: string;
    schema: string;
    username?: string;
    url?: string;
    permissions?: IDataSourcePermission[];
    parameters?: Array<DataSourceParameter>;
    decodedParameters?: Array<DataSourceParameter>;
}

/**
 *@internal
 */
export interface IDataSourceApiResult {
    data?: IDataSourceConnectionInfo;
    errorMessage?: string;
}

/**
 * @internal
 */
export interface IDataSourceUpsertRequest {
    id: string;
    name: string;
    password?: string;
    schema: string;
    token?: string;
    type: IDataSourceType;
    url?: string;
    username?: string;
    parameters?: Array<DataSourceParameter>;
}

/**
 * @internal
 */
export interface IDataSourcePatchRequest {
    id: string;
    name?: string;
    password?: string;
    schema?: string;
    token?: string;
    type?: IDataSourceType;
    url?: string;
    username?: string;
    parameters?: Array<DataSourceParameter>;
}

/**
 * @internal
 */
export interface IDataSourceTestConnectionRequest {
    password?: string;
    schema: string;
    token?: string;
    type: TestDefinitionRequestTypeEnum;
    url: string;
    username?: string;
    parameters?: Array<DataSourceParameter>;
}

/**
 * @internal
 */
export interface IDataSourceTestConnectionResponse {
    successful: boolean;
    error?: string;
}

/**
 * @internal
 */
export interface IDataSourceDeletedResponse {
    successful?: boolean;
    errorMessage?: string;
}

/**
 * @internal
 */
export interface IInvitationUserResponse {
    successful?: boolean;
    errorMessage?: string;
}

/**
 * @internal
 */
export interface ICSPDirective {
    id: string;
    attributes: {
        /**
         * Representation values of the CSP directive entity.
         * Ex: http://a.com, *.abc.com, 'self', ..
         */
        sources: Array<string>;
    };
}

/**
 * @internal
 */
export interface ICustomApplicationSetting {
    id: string;
    /**
     * Name of the application the setting is applied.
     * Ex: ldmModeler
     */
    applicationName: string;
    /**
     * Representation values of the setting.
     * Ex: Layout setting of ldmModeler:  \{ "layout" : []\}
     */
    content: { [key: string]: any };
}

/**
 * @internal
 */
export type OrganizationPermission = JsonApiOrganizationOutMetaPermissionsEnum;

/**
 * @internal
 */
export type GenerateLogicalModelRequest = GenerateLdmRequest;

/**
 * @internal
 */
export type DeclarativeLogicalModel = DeclarativeModel;

/**
 * @internal
 */
export type DeclarativeAnalyticsModel = DeclarativeAnalytics;

/**
 * @internal
 */
export type PhysicalDataModel = DeclarativePdm;

/**
 * @internal
 */
export type SetPdmLayoutRequest = LayoutApiSetPdmLayoutRequest;

/**
 * @internal
 */
export type PutWorkspaceLayoutRequest = LayoutApiPutWorkspaceLayoutRequest;

/**
 * @internal
 */
export type DataSourceDefinition = JsonApiDataSourceInDocument;

/**
 * @internal
 */
export type WorkspaceDefinition = JsonApiWorkspaceInDocument;

/**
 * @internal
 */
export type DependentEntitiesGraphRequest = DependentEntitiesRequest;

/**
 * @internal
 */
export type DependentEntitiesGraphResponse = DependentEntitiesResponse;

/**
 * @internal
 */
export type WorkspaceDataFiltersLayout = DeclarativeWorkspaceDataFilters;

/**
 * @internal
 */
export type WorkspaceDataFilterResult = JsonApiWorkspaceDataFilterOutDocument;

/**
 * @internal
 */
export type WorkspaceDataFilterSettingResult = JsonApiWorkspaceDataFilterSettingOutDocument;

/**
 * @internal
 */
export type WorkspaceDataFilter = JsonApiWorkspaceDataFilterInDocument;

/**
 * @internal
 */
export type WorkspaceDataFilterSetting = JsonApiWorkspaceDataFilterSettingInDocument;

/**
 * @internal
 */
export type ScanSqlResult = ScanSqlResponse;

/**
 * @internal
 */
export type WorkspaceEntitiesDatasets = JsonApiDatasetOutList;

interface IKeyDriverAnalysisResult {
    data: {
        effect: number[];
        label: string[];
        labelElement: string[];
    };
}

/**
 * @internal
 */
export interface IKeyDriverAnalysis {
    labels: string[];
    effects: number[];
}

/**
 * @internal
 */
export type IAnomalyDetectionCacheResult = AnomalyDetectionResult;

/**
 * @internal
 */
export type IForecastCacheResult = ForecastResult;

/**
 * @internal
 */
export type IClusteringCacheResult = ClusteringResult;

/**
 * @internal
 */
export type IUserNotification = WidgetAlertUserNotification | AnomalyUserNotification;

/**
 * TigerBackend-specific functions.
 * If possible, avoid these functions, they are here for specific use cases.
 *
 * Do not use parameters or return values from \@gooddata/api-client-tiger.
 *
 * @internal
 */
export type TigerSpecificFunctions = {
    isCommunityEdition?: () => Promise<boolean>;
    isOrganizationAdmin?: () => Promise<boolean>;
    organizationExpiredDate?: () => Promise<string>;
    getOrganizationAllowedOrigins?: (organizationId: string) => Promise<string[]>;
    getOrganizationPermissions?: (organizationId: string) => Promise<Array<OrganizationPermission>>;
    updateOrganizationAllowedOrigins?: (
        organizationId: string,
        updatedOrigins: string[],
    ) => Promise<string[]>;
    getDeploymentVersion?: () => Promise<string>;
    getAllApiTokens?: (userId: string) => Promise<IApiToken[]>;
    generateApiToken?: (userId: string, tokenId: string) => Promise<IApiTokenExtended | undefined>;
    deleteApiToken?: (userId: string, tokenId: string) => Promise<void>;
    someDataSourcesExists?: (filter?: string) => Promise<boolean>;
    generateLogicalModel?: (
        dataSourceId: string,
        generateLogicalModelRequest: GenerateLogicalModelRequest,
    ) => Promise<DeclarativeLogicalModel>;
    scanDataSource?: (dataSourceId: string, scanRequest: ScanRequest) => Promise<ScanResult>;
    publishPdm?: (dataSourceId: string, declarativePdm: PhysicalDataModel) => Promise<PublishPdmResult>;
    createDemoWorkspace?: (sampleWorkspace: WorkspaceDefinition) => Promise<string>;
    createDemoDataSource?: (sampleDataSource: DataSourceDefinition) => Promise<string>;
    setPdmLayout?: (requestParameters: SetPdmLayoutRequest) => Promise<void>;
    createWorkspace?: (id: string, name: string) => Promise<string>;
    updateWorkspaceTitle?: (id: string, name: string) => Promise<void>;
    deleteWorkspace?: (id: string) => Promise<void>;
    canDeleteWorkspace?: (id: string) => Promise<boolean>;
    getWorkspaceLogicalModel?: (id: string, includeParents?: boolean) => Promise<DeclarativeLogicalModel>;
    getWorkspaceEntitiesDatasets?: (id: string) => Promise<WorkspaceEntitiesDatasets>;
    getEntitlements?: () => Promise<Array<Entitlement>>;
    putWorkspaceLayout?: (requestParameters: PutWorkspaceLayoutRequest) => Promise<void>;
    getAllDataSources?: () => Promise<IDataSourceConnectionInfo[]>;
    getDataSourceById?: (id: string) => Promise<IDataSourceApiResult>;
    getDataSourceIdentifierById?: (id: string) => Promise<IDataSourceApiResult>;
    createDataSource?: (requestData: IDataSourceUpsertRequest) => Promise<IDataSourceApiResult>;
    updateDataSource?: (id: string, requestData: IDataSourceUpsertRequest) => Promise<IDataSourceApiResult>;
    patchDataSource?: (id: string, requestData: IDataSourcePatchRequest) => Promise<IDataSourceApiResult>;
    deleteDataSource?: (id: string) => Promise<IDataSourceDeletedResponse>;
    testDataSourceConnection?: (
        connectionData: IDataSourceTestConnectionRequest,
        id?: string,
    ) => Promise<IDataSourceTestConnectionResponse>;
    publishLogicalModel?: (workspaceId: string, declarativeModel: DeclarativeLogicalModel) => Promise<void>;
    getDataSourceSchemata?: (dataSourceId: string) => Promise<string[]>;
    getPdm?: (dataSourceId: string) => Promise<PhysicalDataModel>;
    getDependentEntitiesGraph?: (workspaceId: string) => Promise<DependentEntitiesGraphResponse>;
    getDependentEntitiesGraphFromEntryPoints?: (
        workspaceId: string,
        dependentEntitiesGraphRequest: DependentEntitiesGraphRequest,
    ) => Promise<DependentEntitiesGraphResponse>;
    resolveAllEntitlements?: () => Promise<ApiEntitlement[]>;
    getAllPlatformUsage?: () => Promise<PlatformUsage[]>;
    inviteUser?: (
        requestParameters: ActionsApiProcessInvitationRequest,
        options?: AxiosRequestConfig,
    ) => Promise<IInvitationUserResponse>;
    getWorkspaceDataFiltersLayout?: () => Promise<WorkspaceDataFiltersLayout>;
    setWorkspaceDataFiltersLayout?: (workspaceDataFiltersLayout: WorkspaceDataFiltersLayout) => Promise<void>;
    getWorkspaceDataFilter?: (workspaceId: string, objectId: string) => Promise<WorkspaceDataFilterResult>;
    setWorkspaceDataFilter?: (workspaceId: string, workspaceDataFilter: WorkspaceDataFilter) => Promise<void>;
    getWorkspaceDataFilterSetting?: (
        workspaceId: string,
        objectId: string,
    ) => Promise<WorkspaceDataFilterSettingResult>;
    setWorkspaceDataFilterSetting?: (
        workspaceId: string,
        workspaceDataFilterSetting: WorkspaceDataFilterSetting,
    ) => Promise<void>;
    getAllCSPDirectives?: () => Promise<Array<ICSPDirective>>;
    getCSPDirective?: (directiveId: string) => Promise<ICSPDirective>;
    createCSPDirective?: (requestData: ICSPDirective) => Promise<ICSPDirective>;
    updateCSPDirective?: (directiveId: string, requestData: ICSPDirective) => Promise<ICSPDirective>;
    deleteCSPDirective?: (directiveId: string) => Promise<void>;
    registerUploadNotification?: (dataSourceId: string) => Promise<void>;
    setFavorite?: (
        workspaceId: string,
        objectType: "Dashboard" | "Insight" | "Metric",
        objectId: string,
        isDelete: boolean,
    ) => Promise<void>;
    setLike?: (
        workspaceId: string,
        objectType: "Dashboard" | "Insight" | "Metric",
        objectId: string,
        isDelete: boolean,
    ) => Promise<void>;
    setDislike?: (
        workspaceId: string,
        objectType: "Dashboard" | "Insight" | "Metric",
        objectId: string,
        isDelete: boolean,
    ) => Promise<void>;
    findRecommendations?: (workspaceId: string, limit?: number) => Promise<Recommendation[]>;
    findRecentAnalytics?: (workspaceId: string, limit?: number) => Promise<RecentAnalyticalObject[]>;
    subscribeToTag?: (workspaceId: string, tag: string) => Promise<void>;
    unsubscribeFromTag?: (workspaceId: string, tag: string) => Promise<void>;
    listSubscriptions?: (workspaceId: string) => Promise<EntityIdentifier[]>;

    /**
     * Return all custom setting of a workspace.
     *
     * @param workspaceId - id of the workspace
     * @param applicationName - name of the appliation the setting was set for - ex: ldmModeler
     * @returns ICustomApplicationSetting[]
     *
     */
    getWorkspaceCustomAppSettings?: (
        workspaceId: string,
        applicationName?: string,
    ) => Promise<ICustomApplicationSetting[]>;

    /**
     * Return all custom setting of a workspace.
     *
     * @param workspaceId - id of the workspace
     * @param settingId - id of the custom setting
     * @returns ICustomApplicationSetting
     *
     */
    getWorkspaceCustomAppSetting?: (
        workspaceId: string,
        settingId: string,
    ) => Promise<ICustomApplicationSetting>;

    /**
     * Create a custom setting of a for a workspace.
     *
     * @param workspaceId - id of the workspace
     * @param applicationName - name of the appliation the setting was set for - ex: ldmModeler
     * @param content - setting data - json object
     * @example : \{"layout" : []\}
     * @param settingId - id of the custom setting, generated if not provided
     * @returns ICustomApplicationSetting
     *
     */
    createWorkspaceCustomAppSetting?: (
        workspaceId: string,
        applicationName: string,
        content: object,
        settingId?: string,
    ) => Promise<ICustomApplicationSetting>;

    /**
     * Delete a custom setting by workspace id and setting id.
     *
     * @param workspaceId - id of the workspace
     * @param settingId - id of the custom setting that should be deleted
     */
    deleteWorkspaceCustomAppSetting?: (workspaceId: string, settingId: string) => Promise<void>;

    /**
     * Get the User Entity data
     *
     * @param id - id of the current userId
     * @returns IUser
     *
     */
    getEntityUser?: (id: string) => Promise<IUser>;

    /**
     * Get metadata about SQL query
     *
     * @param dataSourceId - id of the datasource
     * @param sql - SQL query to be analyzed
     * @returns ScanSqlResult -
     *
     */
    scanSql?: (dataSourceId: string, sql: string) => Promise<ScanSqlResult>;

    /**
     * Check if entities are not overrides by entities from parents workspaces
     * @param entities - All i and types for check
     * @returns IdentifierDuplications[]
     */
    checkEntityOverrides?: (
        workspaceId: string,
        entities: Array<HierarchyObjectIdentification>,
    ) => Promise<Array<IdentifierDuplications>>;

    computeKeyDrivers?: (
        workspaceId: string,
        metric: IMeasure,
        sortDirection: "ASC" | "DESC",
    ) => Promise<IKeyDriverAnalysis>;

    processForecastResult?: (
        workspaceId: string,
        executionResultId: string,
        forecastPeriod: number,
    ) => Promise<IForecastCacheResult>;

    processClusterResult?: (
        workspaceId: string,
        executionResultId: string,
        numberOfClusters: number,
    ) => Promise<IClusteringCacheResult>;

    processAnomalyDetection?: (
        workspaceId: string,
        executionResultId: string,
        sensitivity: number,
    ) => Promise<IAnomalyDetectionCacheResult>;

    getForecastResult?: (workspaceId: string, resultId: string) => Promise<IForecastCacheResult>;

    setForecastResult?: (
        workspaceId: string,
        resultId: string,
        forecastResult: IForecastCacheResult,
    ) => Promise<void>;

    deleteForecastResult?: (workspaceId: string, resultId: string) => Promise<void>;

    getClusterResult?: (workspaceId: string, resultId: string) => Promise<IClusteringCacheResult>;

    setClusterResult?: (
        workspaceId: string,
        resultId: string,
        clusteringResult: IClusteringCacheResult,
    ) => Promise<void>;

    deleteClusterResult?: (workspaceId: string, resultId: string) => Promise<void>;

    getAnomalyDetectionResult?: (
        workspaceId: string,
        resultId: string,
    ) => Promise<IAnomalyDetectionCacheResult>;

    setAnomalyDetectionResult?: (
        workspaceId: string,
        resultId: string,
        anomalyDetectionResult: IAnomalyDetectionCacheResult,
    ) => Promise<void>;

    deleteAnomalyDetectionResult?: (workspaceId: string, resultId: string) => Promise<void>;

    getNotificationsForCurrentUser?: (workspaceId: string) => Promise<IUserNotification[]>;

    markNotificationAsRead?: (workspaceId: string, notificationId: number) => Promise<void>;

    markAllNotificationsAsRead?: (workspaceId: string) => Promise<void>;

    getAllEntitiesWidgetAlerts?: (
        workspaceId: string,
    ) => Promise<{ alert: IWidgetAlert; insight: IInsight }[]>;
};

const getDataSourceErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

const dataSourceResponseAsDataSourceConnectionInfo = (
    response: JsonApiDataSourceOutDocument,
): IDataSourceConnectionInfo => {
    const { id, meta, attributes } = response.data;
    const { name, url, type, schema, username, parameters, decodedParameters } = attributes;
    return {
        id,
        type,
        name,
        schema,
        username,
        url,
        permissions: meta?.permissions ?? [],
        parameters,
        decodedParameters,
    };
};

const dataSourceIdentifierOutWithLinksAsDataSourceConnectionInfo = (
    response: JsonApiDataSourceIdentifierOutWithLinks,
): IDataSourceConnectionInfo => {
    const { id, meta, attributes } = response;
    const { name, type, schema } = attributes;
    return {
        id,
        type,
        name,
        schema,
        username: undefined,
        url: undefined,
        permissions: meta?.permissions ?? [],
    };
};

const dataSourceIdentifierOutDocumentAsDataSourceConnectionInfo = (
    response: JsonApiDataSourceIdentifierOutDocument,
): IDataSourceConnectionInfo => {
    const {
        data: { attributes, id, meta },
    } = response;
    const { name, type, schema } = attributes;
    return {
        id,
        type,
        name,
        schema,
        username: undefined,
        url: undefined,
        permissions: meta?.permissions ?? [],
    };
};

const customAppSettingResponseAsICustomApplicationSetting = (
    response: JsonApiCustomApplicationSettingOut,
): ICustomApplicationSetting => {
    const { id, attributes } = response;
    const { applicationName, content } = attributes;
    return {
        id,
        applicationName,
        content,
    };
};

const sleep = async (timeoutInMs: number) => {
    return new Promise((resolve) => setTimeout(resolve, timeoutInMs));
};

const pollResult = async <T>(polledApiCall: Promise<AxiosResponse<T>>): Promise<T> => {
    let attemptCounter = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (attemptCounter++ === 120) {
            break; // 2 minute timeout, then break
        }
        const result = await polledApiCall;
        if (result.status === 200) {
            return result.data;
        }
        await sleep(1000);
    }

    throw new Error("Polling of prediction result timeout.");
};

const findDimensionality = (
    dims: KeyDriversDimension[],
    attributeId: string,
): KeyDriversDimension | undefined =>
    dims.find((dimensionality) => dimensionality.attribute.id === attributeId);

export const buildTigerSpecificFunctions = (
    backend: IAnalyticalBackend,
    authApiCall: <T>(
        call: AuthenticatedAsyncCall<ITigerClient, T>,
        errorConverter?: ErrorConverter,
    ) => Promise<T>,
): TigerSpecificFunctions => ({
    isCommunityEdition: async () => {
        try {
            return await authApiCall(async (sdk) => {
                const response = await sdk.entities.getAllEntitiesWorkspaces(
                    { page: 0, size: 1 },
                    { headers: jsonApiHeaders },
                );

                // the header name are all lowercase in this object
                return response.headers["gooddata-deployment"] === "aio";
            });
        } catch {
            return false;
        }
    },
    isOrganizationAdmin: async () => {
        try {
            const orgPermissions = await authApiCall(async (sdk) => {
                const { organizationId } = await backend.organizations().getCurrentOrganization();
                const response = await sdk.entities.getEntityOrganizations({
                    id: organizationId,
                    metaInclude: ["permissions"],
                });
                return response.data.data.meta?.permissions || [];
            });
            const isOrganizationManage = (permissions: string[]): boolean => permissions.includes("MANAGE");
            return isOrganizationManage(orgPermissions);
        } catch {
            return false;
        }
    },
    organizationExpiredDate: async () => {
        try {
            return await authApiCall(async (sdk) => {
                const response = await sdk.entities.getAllEntitiesEntitlements({});
                const contractEntitlement = response.data.data.find((item) => item.id === "Contract");
                return contractEntitlement?.attributes?.expiry || "";
            });
        } catch {
            return "";
        }
    },
    getOrganizationAllowedOrigins: async (organizationId: string) => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.getEntityOrganizations({ id: organizationId });
                return result.data?.data?.attributes?.allowedOrigins || [];
            });
        } catch (error: any) {
            return [];
        }
    },
    getOrganizationPermissions: async (organizationId: string) => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.getEntityOrganizations({
                    id: organizationId,
                    metaInclude: ["permissions"],
                });
                return result.data.data?.meta?.permissions || [];
            });
        } catch (error: any) {
            const toleratedCodes = [404, 403];
            if (
                toleratedCodes.includes(error?.response?.status) ||
                toleratedCodes.includes(error?.cause?.response?.status) // the error might be wrapped by an UnexpectedResponseError so check for it too
            ) {
                // temporary - 404 gets returned if you are not org admin
                return [];
            }
            throw convertApiError(error);
        }
    },
    updateOrganizationAllowedOrigins: async (organizationId: string, updatedOrigins: string[]) => {
        const sanitizeOrigins = (origins: Array<string>) => {
            const arr = origins ? origins : [];
            return uniq(arr.map((s) => toLower(s))).sort();
        };
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.patchEntityOrganizations({
                    id: organizationId,
                    jsonApiOrganizationPatchDocument: {
                        data: {
                            id: organizationId,
                            type: JsonApiOrganizationPatchTypeEnum.ORGANIZATION,
                            attributes: {
                                allowedOrigins: updatedOrigins,
                            },
                        },
                    },
                });
                return sanitizeOrigins(result.data?.data?.attributes?.allowedOrigins || []);
            });
        } catch (error: any) {
            if (error.response?.status === 400) {
                const message = error?.response?.data?.detail
                    ? error?.response?.data?.detail
                    : "Server error";
                throw new UnexpectedError(message, error);
            }
            throw convertApiError(error);
        }
    },
    getDeploymentVersion: async () => {
        try {
            return await authApiCall(async (sdk) => {
                // TODO use a client call when available via some endpoint described in OpenAPI
                const profile = await sdk.axios.get("/api/v1/profile");
                return profile?.headers?.["gooddata-deployment"];
            });
        } catch {
            return undefined;
        }
    },
    getAllApiTokens: async (userId: string) => {
        const mapTokens = (tokens: JsonApiApiTokenOutList): IApiToken[] => {
            return tokens.data.map((item) => {
                const result: IApiToken = {
                    id: item.id,
                };
                return result;
            });
        };
        try {
            return await authApiCall(async (sdk) => {
                return await MetadataUtilities.getAllPagesOf(sdk, sdk.entities.getAllEntitiesApiTokens, {
                    userId,
                })
                    .then(MetadataUtilities.mergeEntitiesResults)
                    .then(mapTokens);
            });
        } catch {
            return [];
        }
    },
    generateApiToken: async (userId: string, tokenId: string) => {
        try {
            return await authApiCall(async (sdk) => {
                const apiTokenDocument: JsonApiApiTokenInDocument = {
                    data: {
                        id: tokenId,
                        type: JsonApiApiTokenInTypeEnum.API_TOKEN,
                    },
                };
                const result = await sdk.entities.createEntityApiTokens({
                    userId: userId,
                    jsonApiApiTokenInDocument: apiTokenDocument,
                });
                return {
                    id: result.data.data?.id,
                    bearerToken: result.data.data?.attributes?.bearerToken,
                };
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    deleteApiToken: async (userId: string, tokenId: string) => {
        try {
            await authApiCall(async (sdk) => {
                await sdk.entities.deleteEntityApiTokens({ userId: userId, id: tokenId });
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    someDataSourcesExists: async (filter?: string) => {
        return await authApiCall(async (sdk) => {
            const requestParams = filter ? { filter } : {};
            return sdk.entities
                .getAllEntitiesDataSources(requestParams)
                .then((axiosResponse) => axiosResponse.data.data?.length > 0)
                .catch(() => {
                    return false;
                });
        });
    },
    generateLogicalModel: async (dataSourceId: string, generateLdmRequest: GenerateLdmRequest) => {
        try {
            return await authApiCall(async (sdk) => {
                return sdk.actions
                    .generateLogicalModel({
                        dataSourceId,
                        generateLdmRequest,
                    })
                    .then((axiosResponse) => axiosResponse.data);
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    scanDataSource: async (dataSourceId: string, scanRequest: ScanRequest) => {
        try {
            return await authApiCall(async (sdk) => {
                return await sdk.scanModel
                    .scanDataSource({
                        dataSourceId,
                        scanRequest,
                    })
                    .then((res) => {
                        return res?.data;
                    });
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    publishPdm: async (dataSourceId: string, declarativePdm: DeclarativePdm) => {
        return await authApiCall(async (sdk) => {
            return await sdk.declarativeLayout
                .setPdmLayout({
                    dataSourceId,
                    declarativePdm,
                })
                .then(
                    () => {
                        return {
                            status: "success",
                        };
                    },
                    (error) => {
                        return Promise.reject(error);
                    },
                );
        });
    },
    createDemoWorkspace: async (sampleWorkspace: WorkspaceDefinition) => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.createEntityWorkspaces({
                    jsonApiWorkspaceInDocument: sampleWorkspace,
                });
                return result.data.data.id;
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    createDemoDataSource: async (sampleDataSource: JsonApiDataSourceInDocument) => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.createEntityDataSources({
                    jsonApiDataSourceInDocument: sampleDataSource,
                });
                return result.data.data.id;
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    setPdmLayout: async (requestParameters: LayoutApiSetPdmLayoutRequest) => {
        try {
            return await authApiCall(async (sdk) => {
                await sdk.declarativeLayout.setPdmLayout(requestParameters);
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    createWorkspace: async (id: string, name: string) => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.createEntityWorkspaces({
                    jsonApiWorkspaceInDocument: {
                        data: {
                            attributes: {
                                name,
                            },
                            id,
                            type: JsonApiWorkspaceInTypeEnum.WORKSPACE,
                        },
                    },
                });
                return result.data.data.id;
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    updateWorkspaceTitle: async (id: string, name: string) => {
        try {
            return await authApiCall(async (sdk) => {
                await sdk.entities.updateEntityWorkspaces({
                    id,
                    jsonApiWorkspaceInDocument: {
                        data: {
                            attributes: {
                                name,
                            },
                            id,
                            type: JsonApiWorkspaceInTypeEnum.WORKSPACE,
                        },
                    },
                });
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    deleteWorkspace: async (id: string) => {
        try {
            return await authApiCall(async (sdk) => {
                await sdk.entities.deleteEntityWorkspaces({ id });
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    canDeleteWorkspace: async (id: string) => {
        try {
            return await authApiCall(async (sdk) => {
                const childWorkspaces = (
                    await sdk.entities.getAllEntitiesWorkspaces({
                        include: ["workspaces"],
                        filter: `parent.id==${id}`,
                    })
                ).data.data;
                return isEmpty(childWorkspaces);
            });
        } catch (e) {
            return true;
        }
    },
    getWorkspaceLogicalModel: async (workspaceId: string, includeParents: boolean = false) => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.declarativeLayout.getLogicalModel({ workspaceId, includeParents });
                return result.data;
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    getWorkspaceEntitiesDatasets: async (workspaceId: string) => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.getAllEntitiesDatasets({ workspaceId });
                return result.data;
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    putWorkspaceLayout: async (requestParameters: LayoutApiPutWorkspaceLayoutRequest) => {
        try {
            return await authApiCall(async (sdk) => {
                await sdk.declarativeLayout.putWorkspaceLayout(requestParameters);
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    getEntitlements: async () => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.getAllEntitiesEntitlements({});
                return result.data.data.map((entitlement) => ({
                    id: entitlement.id,
                    value: entitlement.attributes?.value,
                    expiry: entitlement.attributes?.expiry,
                }));
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    getDataSourceById: async (id: string) => {
        try {
            return await authApiCall(async (sdk) => {
                return sdk.entities
                    .getEntityDataSources({
                        id,
                    })
                    .then((axiosResponse) => ({
                        data: dataSourceResponseAsDataSourceConnectionInfo(axiosResponse.data),
                    }));
            });
        } catch (error: any) {
            return { errorMessage: getDataSourceErrorMessage(error) };
        }
    },
    getDataSourceIdentifierById: async (id: string) => {
        try {
            return await authApiCall(async (sdk) => {
                return sdk.entities
                    .getEntityDataSourceIdentifiers({
                        id,
                    })
                    .then((axiosResponse) => ({
                        data: dataSourceIdentifierOutDocumentAsDataSourceConnectionInfo(axiosResponse.data),
                    }));
            });
        } catch (error: any) {
            return { errorMessage: getDataSourceErrorMessage(error) };
        }
    },
    createDataSource: async (requestData: IDataSourceUpsertRequest) => {
        const { id, name, password, schema, token, type, url, username, parameters } = requestData;
        try {
            return await authApiCall(async (sdk) => {
                return sdk.entities
                    .createEntityDataSources({
                        jsonApiDataSourceInDocument: {
                            data: {
                                attributes: {
                                    name,
                                    password,
                                    schema,
                                    token,
                                    type,
                                    url,
                                    username,
                                    parameters,
                                },
                                id,
                                type: JsonApiDataSourceInTypeEnum.DATA_SOURCE,
                            },
                        },
                    })
                    .then((axiosResponse) => ({
                        data: dataSourceResponseAsDataSourceConnectionInfo(axiosResponse.data),
                    }));
            });
        } catch (error: any) {
            return { errorMessage: getDataSourceErrorMessage(error) };
        }
    },
    updateDataSource: async (id: string, requestData: IDataSourceUpsertRequest) => {
        const {
            id: requestDataId,
            name,
            password,
            schema,
            token,
            type,
            url,
            username,
            parameters,
        } = requestData;
        try {
            return await authApiCall(async (sdk) => {
                return sdk.entities
                    .updateEntityDataSources({
                        id,
                        jsonApiDataSourceInDocument: {
                            data: {
                                attributes: {
                                    name,
                                    password,
                                    schema,
                                    token,
                                    type,
                                    url,
                                    username,
                                    parameters,
                                },
                                id: requestDataId,
                                type: JsonApiDataSourceInTypeEnum.DATA_SOURCE,
                            },
                        },
                    })
                    .then((axiosResponse) => ({
                        data: dataSourceResponseAsDataSourceConnectionInfo(axiosResponse.data),
                    }));
            });
        } catch (error: any) {
            return { errorMessage: getDataSourceErrorMessage(error) };
        }
    },
    patchDataSource: async (id: string, requestData: IDataSourcePatchRequest) => {
        const {
            id: requestDataId,
            name,
            password,
            schema,
            token,
            type,
            url,
            username,
            parameters,
        } = requestData;
        try {
            return await authApiCall(async (sdk) => {
                return sdk.entities
                    .patchEntityDataSources({
                        id,
                        jsonApiDataSourcePatchDocument: {
                            data: {
                                attributes: {
                                    name,
                                    password,
                                    schema,
                                    token,
                                    type,
                                    url,
                                    username,
                                    parameters,
                                },
                                id: requestDataId,
                                type: JsonApiDataSourceInTypeEnum.DATA_SOURCE,
                            },
                        },
                    })
                    .then((axiosResponse) => ({
                        data: dataSourceResponseAsDataSourceConnectionInfo(axiosResponse.data),
                    }));
            });
        } catch (error: any) {
            return { errorMessage: getDataSourceErrorMessage(error) };
        }
    },
    deleteDataSource: async (id: string) => {
        try {
            return await authApiCall(async (sdk) => {
                await sdk.entities.deleteEntityDataSources({
                    id,
                });
                return { successful: true };
            });
        } catch (error: any) {
            return { errorMessage: getDataSourceErrorMessage(error) };
        }
    },
    testDataSourceConnection: async (connectionData: IDataSourceTestConnectionRequest, id?: string) => {
        try {
            return await authApiCall(async (sdk) => {
                const promise = id
                    ? sdk.scanModel.testDataSource({
                          dataSourceId: id,
                          testRequest: connectionData,
                      })
                    : sdk.scanModel.testDataSourceDefinition({
                          testDefinitionRequest: connectionData,
                      });
                return await promise.then((axiosResponse) => axiosResponse.data);
            });
        } catch (error: any) {
            return {
                successful: false,
                error: getDataSourceErrorMessage(error),
            };
        }
    },
    getDataSourceSchemata: async (dataSourceId: string) => {
        return await authApiCall(async (sdk) => {
            return await sdk.scanModel.getDataSourceSchemata({ dataSourceId }).then((res) => {
                return res?.data.schemaNames;
            });
        });
    },
    getPdm: async (dataSourceId: string) => {
        return await authApiCall(async (sdk) => {
            return await sdk.declarativeLayout
                .getPdmLayout({
                    dataSourceId,
                })
                .then((res) => {
                    return res?.data;
                });
        });
    },
    getAllDataSources: async () => {
        return await authApiCall(async (sdk) => {
            return OrganizationUtilities.getAllPagesOf(
                sdk,
                sdk.entities.getAllEntitiesDataSourceIdentifiers,
                {
                    sort: ["name"],
                    metaInclude: ["permissions"],
                },
            )
                .then(OrganizationUtilities.mergeEntitiesResults)
                .then((res) => {
                    return res.data.map(dataSourceIdentifierOutWithLinksAsDataSourceConnectionInfo);
                });
        });
    },
    publishLogicalModel: async (workspaceId: string, declarativeModel: DeclarativeModel) => {
        return await authApiCall(async (sdk) => {
            await sdk.declarativeLayout.setLogicalModel({
                workspaceId,
                declarativeModel,
            });
        });
    },
    getDependentEntitiesGraph: async (workspaceId: string) => {
        try {
            return await authApiCall(async (sdk) => {
                return await sdk.actions
                    .getDependentEntitiesGraph({
                        workspaceId,
                    })
                    .then((res) => {
                        return res?.data;
                    });
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    getDependentEntitiesGraphFromEntryPoints: async (
        workspaceId: string,
        dependentEntitiesGraphRequest: DependentEntitiesGraphRequest,
    ) => {
        try {
            return await authApiCall(async (sdk) => {
                return await sdk.actions
                    .getDependentEntitiesGraphFromEntryPoints({
                        workspaceId,
                        dependentEntitiesRequest: dependentEntitiesGraphRequest,
                    })
                    .then((res) => {
                        return res?.data;
                    });
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    resolveAllEntitlements: async () => {
        return authApiCall(async (sdk) => sdk.actions.resolveAllEntitlements().then((res) => res.data));
    },
    getAllPlatformUsage: async () => {
        return authApiCall(async (sdk) => sdk.actions.allPlatformUsage().then((res) => res.data));
    },
    inviteUser: async (
        requestParameters: ActionsApiProcessInvitationRequest,
        options?: AxiosRequestConfig,
    ) => {
        return authApiCall(async (sdk) => {
            return sdk.authActions.processInvitation(requestParameters, options).then((res) => {
                if (res.status == 204) {
                    return {
                        successful: true,
                    } as IInvitationUserResponse;
                } else {
                    return {
                        successful: false,
                        errorMessage: res?.data,
                    } as IInvitationUserResponse;
                }
            });
        });
    },

    getWorkspaceDataFiltersLayout: async () => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.declarativeLayout.getWorkspaceDataFiltersLayout();
                return result.data;
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    setWorkspaceDataFiltersLayout: async (workspaceDataFiltersLayout: WorkspaceDataFiltersLayout) => {
        return await authApiCall(async (sdk) => {
            await sdk.declarativeLayout.setWorkspaceDataFiltersLayout({
                declarativeWorkspaceDataFilters: workspaceDataFiltersLayout,
            });
        });
    },

    getWorkspaceDataFilter: async (
        workspaceId: string,
        objectId: string,
    ): Promise<WorkspaceDataFilterResult> => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.getEntityWorkspaceDataFilters({
                    workspaceId,
                    objectId,
                });
                return result.data;
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    setWorkspaceDataFilter: async (
        workspaceId: string,
        workspaceDataFilter: WorkspaceDataFilter,
    ): Promise<void> => {
        return authApiCall(async (sdk) => {
            await sdk.entities.createEntityWorkspaceDataFilters({
                workspaceId,
                jsonApiWorkspaceDataFilterInDocument: workspaceDataFilter,
            });
        });
    },

    getWorkspaceDataFilterSetting: async (
        workspaceId: string,
        objectId: string,
    ): Promise<WorkspaceDataFilterSettingResult> => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.getEntityWorkspaceDataFilterSettings({
                    workspaceId,
                    objectId,
                });
                return result.data;
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    setWorkspaceDataFilterSetting: async (
        workspaceId: string,
        workspaceDataFilterSetting: WorkspaceDataFilterSetting,
    ): Promise<void> => {
        return await authApiCall(async (sdk) => {
            await sdk.entities.createEntityWorkspaceDataFilterSettings({
                workspaceId,
                jsonApiWorkspaceDataFilterSettingInDocument: workspaceDataFilterSetting,
            });
        });
    },

    getAllCSPDirectives: async (): Promise<Array<ICSPDirective>> => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.getAllEntitiesCspDirectives({});
                return result.data?.data || [];
            });
        } catch (error) {
            return [];
        }
    },
    getCSPDirective: async (directiveId: string): Promise<ICSPDirective> => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.getEntityCspDirectives({ id: directiveId });
                return result.data?.data;
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    createCSPDirective: async (requestData: ICSPDirective): Promise<ICSPDirective> => {
        try {
            return await authApiCall(async (sdk) => {
                const jsonApiCspDirectiveInDocument: JsonApiCspDirectiveInDocument = {
                    data: {
                        id: requestData.id,
                        type: JsonApiCspDirectiveInTypeEnum.CSP_DIRECTIVE,
                        attributes: requestData.attributes,
                    },
                };
                const result = await sdk.entities.createEntityCspDirectives({
                    jsonApiCspDirectiveInDocument,
                });

                return result.data?.data;
            });
        } catch (error: any) {
            if (error.response?.status === 400) {
                const message = error?.response?.data?.detail
                    ? error?.response?.data?.detail
                    : "Server error";
                throw new UnexpectedError(message, error);
            }
            throw convertApiError(error);
        }
    },
    updateCSPDirective: async (directiveId: string, requestData: ICSPDirective): Promise<ICSPDirective> => {
        try {
            return await authApiCall(async (sdk) => {
                const jsonApiCspDirectiveInDocument: JsonApiCspDirectiveInDocument = {
                    data: {
                        id: requestData.id,
                        type: JsonApiCspDirectiveInTypeEnum.CSP_DIRECTIVE,
                        attributes: requestData.attributes,
                    },
                };
                const result = await sdk.entities.updateEntityCspDirectives({
                    id: directiveId,
                    jsonApiCspDirectiveInDocument,
                });

                return result.data?.data;
            });
        } catch (error: any) {
            if (error.response?.status === 400) {
                const message = error?.response?.data?.detail
                    ? error?.response?.data?.detail
                    : "Server error";
                throw new UnexpectedError(message, error);
            }
            throw convertApiError(error);
        }
    },
    deleteCSPDirective: async (directiveId: string) => {
        try {
            await authApiCall(async (sdk) => {
                await sdk.entities.deleteEntityCspDirectives({ id: directiveId });
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },
    getWorkspaceCustomAppSettings: async (workspaceId: string, applicationName?: string) => {
        return await authApiCall(async (sdk) => {
            const result = await sdk.entities.getAllEntitiesCustomApplicationSettings({
                workspaceId,
            });
            const responseData = result.data;
            if (applicationName) {
                responseData.data = responseData.data.filter(
                    (setting) => setting.attributes.applicationName === applicationName,
                );
            }
            return responseData.data.map((setting) =>
                customAppSettingResponseAsICustomApplicationSetting(setting),
            );
        });
    },
    getWorkspaceCustomAppSetting: async (workspaceId: string, settingId: string) => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.getEntityCustomApplicationSettings({
                    objectId: settingId,
                    workspaceId,
                });
                return customAppSettingResponseAsICustomApplicationSetting(result.data.data);
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    createWorkspaceCustomAppSetting: async (
        workspaceId: string,
        applicationName: string,
        content: object,
        settingId?: string,
    ) => {
        return await authApiCall(async (sdk) => {
            const result = await sdk.entities.createEntityCustomApplicationSettings({
                workspaceId,
                jsonApiCustomApplicationSettingPostOptionalIdDocument: {
                    data: {
                        type: JsonApiCustomApplicationSettingOutTypeEnum.CUSTOM_APPLICATION_SETTING,
                        id: settingId,
                        attributes: {
                            applicationName,
                            content,
                        },
                    },
                },
            });
            return customAppSettingResponseAsICustomApplicationSetting(result.data.data);
        });
    },

    deleteWorkspaceCustomAppSetting: async (workspaceId: string, settingId: string) => {
        try {
            return await authApiCall(async (sdk) => {
                await sdk.entities.deleteEntityCustomApplicationSettings({
                    objectId: settingId,
                    workspaceId,
                });
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    getEntityUser: async (id: string) => {
        try {
            return await authApiCall(async (sdk) => {
                const result = await sdk.entities.getEntityUsers({
                    id,
                });
                const { firstname, lastname, ...userInfo } = result.data?.data.attributes || {};
                return {
                    ...userInfo,
                    firstName: firstname,
                    lastName: lastname,
                } as IUser;
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    registerUploadNotification: async (dataSourceId: string) => {
        return await authApiCall(async (sdk) => {
            await sdk.actions.registerUploadNotification({
                dataSourceId,
            });
        });
    },

    scanSql: async (dataSourceId: string, sql: string) => {
        try {
            return await authApiCall(async (sdk) => {
                return sdk.scanModel.scanSql({ dataSourceId, scanSqlRequest: { sql } }).then((response) => {
                    return response.data as ScanSqlResult;
                });
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    checkEntityOverrides: async (
        workspaceId: string,
        hierarchyObjectIdentification: Array<HierarchyObjectIdentification>,
    ) => {
        try {
            return await authApiCall(async (sdk) => {
                return sdk.actions
                    .checkEntityOverrides({ workspaceId, hierarchyObjectIdentification })
                    .then((response) => {
                        return response.data as Array<IdentifierDuplications>;
                    });
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    setFavorite: async (
        workspaceId: string,
        objectType: "Dashboard" | "Insight" | "Metric",
        objectId: string,
        isDelete: boolean,
    ) => {
        try {
            return await authApiCall(async (sdk) => {
                if (objectType === "Dashboard") {
                    isDelete
                        ? await sdk.actions.unfavoriteAnalyticalDashboard({
                              workspaceId,
                              objectId,
                          })
                        : await sdk.actions.favoriteAnalyticalDashboard({
                              workspaceId,
                              objectId,
                          });
                } else if (objectType === "Insight") {
                    isDelete
                        ? await sdk.actions.unfavoriteVisualizationObject({
                              workspaceId,
                              objectId,
                          })
                        : await sdk.actions.favoriteVisualizationObject({
                              workspaceId,
                              objectId,
                          });
                } else if (objectType === "Metric") {
                    isDelete
                        ? await sdk.actions.unfavoriteMetric({
                              workspaceId,
                              objectId,
                          })
                        : await sdk.actions.favoriteMetric({
                              workspaceId,
                              objectId,
                          });
                }
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    setLike: async (
        workspaceId: string,
        objectType: "Dashboard" | "Insight" | "Metric",
        objectId: string,
        isDelete: boolean,
    ) => {
        try {
            return await authApiCall(async (sdk) => {
                if (objectType === "Dashboard") {
                    isDelete
                        ? await sdk.actions.unlikeAnalyticalDashboard({
                              workspaceId,
                              objectId,
                          })
                        : await sdk.actions.likeAnalyticalDashboard({
                              workspaceId,
                              objectId,
                          });
                } else if (objectType === "Insight") {
                    isDelete
                        ? await sdk.actions.unlikeVisualizationObject({
                              workspaceId,
                              objectId,
                          })
                        : await sdk.actions.likeVisualizationObject({
                              workspaceId,
                              objectId,
                          });
                } else if (objectType === "Metric") {
                    isDelete
                        ? await sdk.actions.unlikeMetric({
                              workspaceId,
                              objectId,
                          })
                        : await sdk.actions.likeMetric({
                              workspaceId,
                              objectId,
                          });
                }
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    setDislike: async (
        workspaceId: string,
        objectType: "Dashboard" | "Insight" | "Metric",
        objectId: string,
        isDelete: boolean,
    ) => {
        try {
            return await authApiCall(async (sdk) => {
                if (objectType === "Dashboard") {
                    isDelete
                        ? await sdk.actions.undislikeAnalyticalDashboard({
                              workspaceId,
                              objectId,
                          })
                        : await sdk.actions.dislikeAnalyticalDashboard({
                              workspaceId,
                              objectId,
                          });
                } else if (objectType === "Insight") {
                    isDelete
                        ? await sdk.actions.undislikeVisualizationObject({
                              workspaceId,
                              objectId,
                          })
                        : await sdk.actions.dislikeVisualizationObject({
                              workspaceId,
                              objectId,
                          });
                } else if (objectType === "Metric") {
                    isDelete
                        ? await sdk.actions.undislikeMetric({
                              workspaceId,
                              objectId,
                          })
                        : await sdk.actions.dislikeMetric({
                              workspaceId,
                              objectId,
                          });
                }
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    findRecommendations: async (workspaceId, limit = 5) => {
        try {
            return await authApiCall(async (sdk) => {
                return sdk.actions
                    .findRecommendations(
                        { workspaceId, limit },
                        {
                            // this somehow makes sure that no request body is sent to avoid
                            // including required props we do not have at the moment
                            transformRequest: () => {},
                        },
                    )
                    .then((response) => response.data);
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    findRecentAnalytics: async (workspaceId, limit = 5) => {
        try {
            return await authApiCall(async (sdk) => {
                return sdk.actions
                    .findRecentAnalytics({ workspaceId, limit })
                    .then((response) => response.data);
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    subscribeToTag: async (workspaceId, tag) => {
        try {
            return await authApiCall(async (sdk) => {
                return sdk.actions
                    .subscribeToTag({ workspaceId, objectId: tag })
                    .then((response) => response.data);
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    unsubscribeFromTag: async (workspaceId, tag) => {
        try {
            return await authApiCall(async (sdk) => {
                return sdk.actions
                    .unsubscribeFromTag({ workspaceId, objectId: tag })
                    .then((response) => response.data);
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    listSubscriptions: async (workspaceId) => {
        try {
            return await authApiCall(async (sdk) => {
                return sdk.actions.listSubscriptions({ workspaceId }).then((response) => response.data);
            });
        } catch (error: any) {
            throw convertApiError(error);
        }
    },

    computeKeyDrivers: async (workspaceId: string, metric: IMeasure, sortDirection: "ASC" | "DESC") => {
        return await authApiCall(async (sdk) => {
            const response = await sdk.keyDrivers.processKeyDriversRequest({
                workspaceId,
                keyDriversRequest: {
                    metric: convertMeasure(metric),
                    sortDirection,
                },
            });

            const responseData = response.data;
            const executionResult = responseData.links.executionResult;
            const result = (await pollResult(
                sdk.keyDrivers.getResult({
                    workspaceId,
                    resultId: executionResult,
                }),
            )) as IKeyDriverAnalysisResult;

            const { effect, label, labelElement } = result.data;
            const labels = label.map((attributeId, index) => {
                const dimensionality = findDimensionality(responseData.dimensionality, attributeId);
                const resolvedValue = dimensionality?.attributeName;
                return `${resolvedValue} (${labelElement[index]})`;
            });

            return {
                effects: effect,
                labels,
            };
        });
    },

    processForecastResult: async (
        workspaceId: string,
        executionResultId: string,
        forecastPeriod: number,
    ): Promise<IForecastCacheResult> => {
        return await authApiCall(async (sdk) => {
            const response = await sdk.predictionCache.processForecastRequest({
                workspaceId,
                resultId: executionResultId,
                forecastRequest: {
                    forecastPeriod,
                },
            });
            const executionResult = response.data.links.executionResult;
            return pollResult(
                sdk.predictionCache.getForecastResult({
                    workspaceId,
                    resultId: executionResult,
                }),
            );
        });
    },

    processClusterResult: async (
        workspaceId: string,
        executionResultId: string,
        numberOfClusters: number,
    ): Promise<IClusteringCacheResult> => {
        return await authApiCall(async (sdk) => {
            const response = await sdk.predictionCache.processClusteringRequest({
                workspaceId,
                resultId: executionResultId,
                clusteringRequest: {
                    numberOfClusters,
                },
            });
            const executionResult = response.data.links.executionResult;
            return pollResult(
                sdk.predictionCache.getClusteringResult({
                    workspaceId,
                    resultId: executionResult,
                }),
            );
        });
    },

    processAnomalyDetection: async (
        workspaceId: string,
        executionResultId: string,
        sensitivity: number,
    ): Promise<IAnomalyDetectionCacheResult> => {
        return await authApiCall(async (sdk) => {
            const response = await sdk.predictionCache.processAnomalyDetection({
                workspaceId,
                resultId: executionResultId,
                anomalyDetectionRequest: {
                    sensitivity,
                },
            });
            const executionResult = response.data.links.executionResult;
            return pollResult(
                sdk.predictionCache.getAnomalyDetectionResult({
                    workspaceId,
                    resultId: executionResult,
                }),
            );
        });
    },

    getForecastResult: async (workspaceId: string, resultId: string): Promise<IForecastCacheResult> => {
        return await authApiCall(async (sdk) => {
            return sdk.predictionCache
                .fetchForecastResult({
                    workspaceId,
                    resultId,
                })
                .then((response) => response.data as IForecastCacheResult);
        });
    },

    setForecastResult: async (
        workspaceId: string,
        resultId: string,
        forecastResult: IForecastCacheResult,
    ): Promise<void> => {
        return await authApiCall(async (sdk) => {
            sdk.predictionCache.cacheForecastResult({
                workspaceId,
                resultId,
                forecastResult,
            });
        });
    },

    deleteForecastResult: async (workspaceId: string, resultId: string): Promise<void> => {
        return await authApiCall(async (sdk) => {
            return sdk.predictionCache
                .deleteForecastResult({
                    workspaceId,
                    resultId,
                })
                .then((response) => response.data);
        });
    },

    getClusterResult: async (workspaceId: string, resultId: string): Promise<IClusteringCacheResult> => {
        return await authApiCall(async (sdk) => {
            return sdk.predictionCache
                .fetchClusteringResult({
                    workspaceId,
                    resultId,
                })
                .then((response) => response.data as IClusteringCacheResult);
        });
    },

    setClusterResult: async (
        workspaceId: string,
        resultId: string,
        clusteringResult: IClusteringCacheResult,
    ): Promise<void> => {
        return await authApiCall(async (sdk) => {
            sdk.predictionCache.cacheClusteringResult({
                workspaceId,
                resultId,
                clusteringResult,
            });
        });
    },

    deleteClusterResult: async (workspaceId: string, resultId: string): Promise<void> => {
        return await authApiCall(async (sdk) => {
            return sdk.predictionCache
                .deleteClusteringResult({
                    workspaceId,
                    resultId,
                })
                .then((response) => response.data);
        });
    },

    getAnomalyDetectionResult: async (
        workspaceId: string,
        resultId: string,
    ): Promise<IAnomalyDetectionCacheResult> => {
        return await authApiCall(async (sdk) => {
            return sdk.predictionCache
                .fetchAnomalyDetectionResult({
                    workspaceId,
                    resultId,
                })
                .then((response) => response.data as IAnomalyDetectionCacheResult);
        });
    },

    setAnomalyDetectionResult: async (
        workspaceId: string,
        resultId: string,
        anomalyDetectionResult: IAnomalyDetectionCacheResult,
    ): Promise<void> => {
        return await authApiCall(async (sdk) => {
            sdk.predictionCache.cacheAnomalyDetectionResult({
                workspaceId,
                resultId,
                anomalyDetectionResult,
            });
        });
    },

    deleteAnomalyDetectionResult: async (workspaceId: string, resultId: string): Promise<void> => {
        return await authApiCall(async (sdk) => {
            return sdk.predictionCache
                .deleteAnomalyDetectionResult({
                    workspaceId,
                    resultId,
                })
                .then((response) => response.data);
        });
    },

    getNotificationsForCurrentUser: async (workspaceId: string): Promise<IUserNotification[]> => {
        return await authApiCall(async (sdk) => {
            return sdk.actions
                .getNotificationsForCurrentUser({
                    workspaceId,
                })
                .then((response) => response.data);
        });
    },

    markNotificationAsRead: async (workspaceId: string, notificationId: number): Promise<void> => {
        return await authApiCall(async (sdk) => {
            await sdk.actions.markNotificationAsRead({
                workspaceId,
                markNotificationAsReadRequest: {
                    notificationId,
                },
            });
        });
    },

    markAllNotificationsAsRead: async (workspaceId: string): Promise<void> => {
        return await authApiCall(async (sdk) => {
            await sdk.actions.markAllNotificationsAsRead({
                workspaceId,
            });
        });
    },

    getAllEntitiesWidgetAlerts: async (workspaceId: string) => {
        const alertsData = await authApiCall(async (client, context) => {
            const author = await context.getPrincipal();

            return client.entities.getAllEntitiesWidgetAlerts({
                workspaceId,
                include: ["visualizationObject", "filterContext", "analyticalDashboard"],
                filter: `createdBy.id==${author.userId}`,
            });
        });

        return alertsData.data.data.map((alertToConvert) => {
            const insightId = alertToConvert.relationships!.visualizationObject!.data!.id;
            const insightToConvert = alertsData.data!.included!.find(
                (i) => i.id === insightId,
            )! as JsonApiVisualizationObjectOutWithLinks;

            return {
                alert: convertWidgetAlert(
                    alertToConvert,
                    alertsData.data.included?.find(
                        (i) =>
                            i.type === "filterContext" &&
                            i.id === alertToConvert.relationships!.filterContext?.data?.id,
                    ) as JsonApiFilterContextOutWithLinks,
                ),
                insight: insightFromInsightDefinition(
                    convertVisualizationObject(
                        insightToConvert.attributes!.content! as
                            | VisualizationObjectModelV1.IVisualizationObject
                            | VisualizationObjectModelV1.IVisualizationObject,
                        insightToConvert.attributes!.title!,
                        insightToConvert.attributes!.description!,
                        insightToConvert.attributes!.tags,
                    ),
                    insightToConvert.id,
                    insightToConvert.links!.self,
                    insightToConvert.attributes!.tags,
                    isInheritedObject(insightToConvert),
                    insightToConvert.attributes?.createdAt,
                    insightToConvert.attributes?.modifiedAt,
                    undefined,
                    undefined,
                    undefined,
                ),
            };
        });
    },
});

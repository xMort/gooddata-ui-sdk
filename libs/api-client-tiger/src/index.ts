// (C) 2019-2024 GoodData Corporation
/**
 * This package provides low-level functions for communication with GoodData Cloud and GoodData.CN.
 *
 * @remarks
 * The package is used by `@gooddata/sdk-backend-tiger`, which you should use instead of directly using
 * `@gooddata/api-client-tiger` whenever possible.
 *
 * @packageDocumentation
 */
import { tigerClientFactory, ITigerClient } from "./client.js";
import {
    axios as defaultAxios,
    newAxios,
    setAxiosAuthorizationToken,
    setGlobalAuthorizationToken,
} from "./axios.js";

export {
    VisualizationObjectModelV1,
    VisualizationObjectModelV2,
    AnalyticalDashboardModelV1,
    AnalyticalDashboardModelV2,
    isAttributeHeader,
    isAfmObjectIdentifier,
    isResultAttributeHeader,
    isResultMeasureHeader,
    isResultTotalHeader,
    isVisualizationObjectsItem,
    isFilterContextData,
    isDashboardPluginsItem,
} from "./gd-tiger-model/index.js";

export { newAxios, setAxiosAuthorizationToken, setGlobalAuthorizationToken };

export {
    AFM,
    AfmIdentifier as AfmModelIdentifier,
    AfmLocalIdentifier as AfmModelLocalIdentifier,
    AfmObjectIdentifierAttributeIdentifier as AfmModelObjectIdentifierAttributeIdentifier,
    AfmObjectIdentifierAttributeIdentifierTypeEnum as AfmModelObjectIdentifierAttributeIdentifierTypeEnum,
    AfmObjectIdentifierCore as AfmModelObjectIdentifierCore,
    AfmObjectIdentifierCoreIdentifier as AfmModelObjectIdentifierCoreIdentifier,
    AfmObjectIdentifierCoreIdentifierTypeEnum as AfmModelObjectIdentifierCoreIdentifierTypeEnum,
    AfmObjectIdentifierDataset as AfmModelObjectIdentifierDataset,
    AfmObjectIdentifierDatasetIdentifier as AfmModelObjectIdentifierDatasetIdentifier,
    AfmObjectIdentifierDatasetIdentifierTypeEnum as AfmModelObjectIdentifierDatasetIdentifierTypeEnum,
    AfmObjectIdentifierIdentifier as AfmModelObjectIdentifierIdentifier,
    AfmObjectIdentifierIdentifierTypeEnum as AfmModelObjectIdentifierIdentifierTypeEnum,
    AfmObjectIdentifierLabel,
    AfmObjectIdentifierAttribute as AfmModelObjectIdentifierAttribute,
    AfmObjectIdentifierLabelIdentifier,
    AfmObjectIdentifierLabelIdentifierTypeEnum,
    AbsoluteDateFilter as AfmAbsoluteDateFilter,
    AbsoluteDateFilterAbsoluteDateFilter as AfmAbsoluteDateFilterAbsoluteDateFilter,
    AbstractMeasureValueFilter,
    AfmExecution,
    AfmExecutionResponse,
    AfmObjectIdentifier as AfmModelObjectIdentifier,
    AfmValidObjectsQuery,
    AfmValidObjectsQueryTypesEnum,
    AfmValidObjectsResponse,
    ArithmeticMeasureDefinition as AfmArithmeticMeasureDefinition,
    ArithmeticMeasureDefinitionArithmeticMeasure as AfmArithmeticMeasureDefinitionArithmeticMeasure,
    ArithmeticMeasureDefinitionArithmeticMeasureOperatorEnum as AfmArithmeticMeasureDefinitionArithmeticMeasureOperatorEnum,
    AttributeExecutionResultHeader,
    AttributeFilter as AfmAttributeFilter,
    AttributeFilterElements as AfmAttributeFilterElements,
    AttributeHeaderOut,
    AttributeHeaderOutAttributeHeader,
    AttributeHeaderOutAttributeHeaderGranularityEnum,
    AttributeItem,
    AttributeResultHeader,
    ComparisonMeasureValueFilter as AfmComparisonMeasureValueFilter,
    ComparisonMeasureValueFilterComparisonMeasureValueFilter as AfmComparisonMeasureValueFilterComparisonMeasureValueFilter,
    ComparisonMeasureValueFilterComparisonMeasureValueFilterOperatorEnum as AfmComparisonMeasureValueFilterComparisonMeasureValueFilterOperatorEnum,
    DataColumnLocator,
    DataColumnLocators,
    DateFilter as AfmDateFilter,
    Dimension,
    DimensionHeader,
    Element,
    ElementsRequest,
    FilterBy,
    FilterByLabelTypeEnum,
    ElementsRequestSortOrderEnum,
    ElementsResponse,
    ExecutionLinks,
    ExecutionResponse,
    ExecutionResult,
    ExecutionResultGrandTotal,
    ExecutionResultHeader,
    ExecutionResultPaging,
    ExecutionSettings,
    FilterDefinition as AfmFilterDefinition,
    FilterDefinitionForSimpleMeasure as AfmFilterDefinitionForSimpleMeasure,
    HeaderGroup,
    InlineFilterDefinition as AfmInlineFilterDefinition,
    InlineFilterDefinitionInline as AfmInlineFilterDefinitionInline,
    InlineMeasureDefinition as AfmInlineMeasureDefinition,
    InlineMeasureDefinitionInline as AfmInlineMeasureDefinitionInline,
    MeasureDefinition as AfmMeasureDefinition,
    MeasureExecutionResultHeader,
    MeasureGroupHeaders,
    MeasureHeaderOut,
    MeasureItem as AfmMeasureItem,
    MeasureResultHeader,
    MeasureValueFilter,
    NegativeAttributeFilter as AfmNegativeAttributeFilter,
    NegativeAttributeFilterNegativeAttributeFilter as AfmNegativeAttributeFilterNegativeAttributeFilter,
    Paging,
    PopDataset as AfmPopDataset,
    PopMeasureDefinition as AfmPopMeasureDefinition,
    PopDatasetMeasureDefinition as AfmPopDatasetMeasureDefinition,
    PopDatasetMeasureDefinitionPreviousPeriodMeasure as AfmPopDatasetMeasureDefinitionPreviousPeriodMeasure,
    PopDate as AfmPopDate,
    PopDateMeasureDefinition as AfmPopDateMeasureDefinition,
    PopDateMeasureDefinitionOverPeriodMeasure as AfmPopDateMeasureDefinitionOverPeriodMeasure,
    PositiveAttributeFilter as AfmPositiveAttributeFilter,
    PositiveAttributeFilterPositiveAttributeFilter as AfmPositiveAttributeFilterPositiveAttributeFilter,
    RangeMeasureValueFilter as AfmRangeMeasureValueFilter,
    RangeMeasureValueFilterRangeMeasureValueFilter as AfmRangeMeasureValueFilterRangeMeasureValueFilter,
    RangeMeasureValueFilterRangeMeasureValueFilterOperatorEnum as AfmRangeMeasureValueFilterRangeMeasureValueFilterOperatorEnum,
    RankingFilter as AfmRankingFilter,
    RankingFilterRankingFilter as AfmRankingFilterRankingFilter,
    RankingFilterRankingFilterOperatorEnum as AfmRankingFilterRankingFilterOperatorEnum,
    RelativeDateFilter as AfmRelativeDateFilter,
    RelativeDateFilterRelativeDateFilter as AfmRelativeDateFilterRelativeDateFilter,
    RelativeDateFilterRelativeDateFilterGranularityEnum as AfmRelativeDateFilterRelativeDateFilterGranularityEnum,
    ResultCacheMetadata,
    ResultDimension,
    ResultDimensionHeader,
    ResultSpec,
    SimpleMeasureDefinition as AfmSimpleMeasureDefinition,
    SimpleMeasureDefinitionMeasure as AfmSimpleMeasureDefinitionMeasure,
    SimpleMeasureDefinitionMeasureAggregationEnum as AfmSimpleMeasureDefinitionMeasureAggregationEnum,
    SortKey,
    SortKeyAttribute,
    SortKeyAttributeAttribute,
    SortKeyTotal,
    SortKeyTotalTotal,
    SortKeyTotalTotalDirectionEnum,
    SortKeyValue,
    SortKeyValueValue,
    SortKeyValueValueDirectionEnum,
    SortKeyAttributeAttributeDirectionEnum,
    SortKeyAttributeAttributeSortTypeEnum,
    TotalExecutionResultHeader,
    TotalResultHeader,
    ActionsApiAxiosParamCreator as AfmActionsApiAxiosParamCreator,
    ActionsApiFp as AfmActionsApiFp,
    ActionsApiFactory as AfmActionsApiFactory,
    ActionsApiInterface as AfmActionsApiInterface,
    ActionsApi as AfmActionsApi,
    ActionsApiComputeLabelElementsPostRequest,
    ActionsApiComputeReportRequest,
    ActionsApiComputeValidObjectsRequest,
    ActionsApiExplainAFMRequest,
    ActionsApiRetrieveResultRequest,
    ActionsApiRetrieveExecutionMetadataRequest,
    RestApiIdentifier,
    Total,
    TotalDimension,
    TotalFunctionEnum,
    AttributeFormat,
    ElementsResponseGranularityEnum,
    ActionsApiComputeValidDescendantsRequest,
    AfmValidDescendantsQuery,
    AfmValidDescendantsResponse,
    DependsOn,
    DependsOnDateFilter,
    ValidateByItem,
    ForecastRequest,
    ActionsApiForecastRequest,
    SmartFunctionResponse,
    ActionsApiForecastResultRequest,
    ForecastResult,
    ClusteringRequest,
    ClusteringResult,
    ActionsApiClusteringRequest,
    ActionsApiClusteringResultRequest,
    AttributeHeaderOutAttributeHeaderValueTypeEnum,
    KeyDriversRequest,
    ActionsApiKeyDriverAnalysisRequest,
    KeyDriversResponse,
    ActionsApiKeyDriverAnalysisResultRequest,
    KeyDriversResult,
    KeyDriversRequestSortDirectionEnum,
    KeyDriversDimension,
    KeyDriversDimensionGranularityEnum,
    KeyDriversDimensionValueTypeEnum,
    AnomalyDetectionRequest,
    ActionsApiAnomalyDetectionRequest,
    ActionsApiAnomalyDetectionResultRequest,
    AnomalyDetectionResult,
    SearchRequest,
    ActionsApiAiSearchRequest,
    SearchResult,
    SearchRequestObjectTypesEnum,
    SearchResultObject,
    SearchRelationshipObject,
    RouteRequest,
    RouteResult,
    RouteResultObject,
    ActionsApiAiRouteRequest,
} from "./generated/afm-rest-api/api.js";
export {
    ActionsApiFactory as AuthActionsApiFactory,
    ActionsApiInterface as AuthActionsApiInterface,
    ActionsApiProcessInvitationRequest,
    Invitation,
} from "./generated/auth-json-api/api.js";
export { Configuration, ConfigurationParameters } from "./generated/auth-json-api/configuration.js";
export * from "./generated/metadata-json-api/api.js";
export {
    ActionsApiCreatePdfExportRequest,
    ActionsApiGetExportedFileRequest,
    ActionsApiGetMetadataRequest,
    ActionsApiCreateTabularExportRequest,
    ActionsApiGetTabularExportRequest,
    ExportResponse,
} from "./generated/export-json-api/api.js";

export {
    ActionsApiGetDataSourceSchemataRequest,
    ActionsApiScanDataSourceRequest,
    ActionsApiTestDataSourceDefinitionRequest,
    ActionsApiTestDataSourceRequest,
    DataSourceSchemata,
    DeclarativeColumn as ScanModelDeclarativeColumn,
    DeclarativeColumnDataTypeEnum as ScanModelDeclarativeColumnDataTypeEnum,
    DeclarativeTable as ScanModelDeclarativeTable,
    DeclarativeTables as ScanModelDeclarativeTables,
    ScanRequest,
    ScanResultPdm,
    TableWarning,
    TestDefinitionRequest,
    TestDefinitionRequestTypeEnum,
    TestQueryDuration,
    TestResponse,
    ColumnWarning,
    DataSourceParameter,
    TestRequest,
    ScanSqlResponse,
    ActionsApiScanSqlRequest,
    SqlColumnDataTypeEnum as ScanApiSqlColumnDataTypeEnum,
    SqlColumn as ScanApiSqlColumn,
    ScanSqlRequest,
    ActionsApiColumnStatisticsRequest,
    ColumnStatisticsResponse,
    ColumnStatistic,
    Histogram,
    Frequency,
    ColumnStatisticWarning,
    ColumnStatisticsRequest,
    ColumnStatisticTypeEnum,
    SqlQuery,
    Table,
    ColumnStatisticsRequestStatisticsEnum,
    HistogramBucket,
    HistogramProperties,
    FrequencyBucket,
    FrequencyProperties,
} from "./generated/scan-json-api/api.js";

export {
    ActionsApiAnalyzeCsvRequest,
    ActionsApiDeleteFilesRequest,
    ActionsApiImportCsvRequest,
    ActionsApiListFilesRequest,
    ActionsApiReadCsvFileManifestsRequest,
    ActionsApiStagingUploadRequest,
    AnalyzeCsvRequest,
    AnalyzeCsvRequestItem,
    AnalyzeCsvRequestItemConfig,
    AnalyzeCsvResponse,
    AnalyzeCsvResponseColumn,
    AnalyzeCsvResponseConfig,
    CacheRemovalInterval,
    CacheUsageData,
    CsvConvertOptions,
    CsvConvertOptionsColumnType,
    CsvManifestBody,
    CsvParseOptions,
    CsvReadOptions,
    DeleteFilesRequest,
    GdStorageFile,
    GdStorageFileTypeEnum,
    ImportCsvRequest,
    ImportCsvResponse,
    ImportCsvRequestTable,
    ImportCsvRequestTableSource,
    ImportCsvRequestTableSourceConfig,
    OrganizationCacheSettings,
    OrganizationCacheUsage,
    OrganizationCurrentCacheUsage,
    ReadCsvFileManifestsRequest,
    ReadCsvFileManifestsRequestItem,
    ReadCsvFileManifestsResponse,
    UploadFileResponse,
    WorkspaceCacheSettings,
    WorkspaceCacheUsage,
    WorkspaceCurrentCacheUsage,
} from "./generated/result-json-api/api.js";

export * from "./client.js";

export { jsonApiHeaders, JSON_API_HEADER_VALUE, ValidateRelationsHeader } from "./constants.js";

export {
    MetadataUtilities,
    MetadataGetEntitiesResult,
    MetadataGetEntitiesFn,
    MetadataGetEntitiesOptions,
    MetadataGetEntitiesParams,
    MetadataGetEntitiesThemeParams,
    MetadataGetEntitiesColorPaletteParams,
    MetadataGetEntitiesWorkspaceParams,
    MetadataGetEntitiesUserParams,
} from "./metadataUtilities.js";

export {
    OrganizationUtilities,
    OrganizationGetEntitiesResult,
    OrganizationGetEntitiesSupportingIncludedResult,
    OrganizationGetEntitiesFn,
    OrganizationGetEntitiesParams,
} from "./organizationUtilities.js";

export { ActionsUtilities } from "./actionsUtilities.js";

const defaultTigerClient: ITigerClient = tigerClientFactory(defaultAxios);

export default defaultTigerClient;

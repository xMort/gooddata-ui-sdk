// (C) 2019-2020 GoodData Corporation

import {
    DataValue,
    IDataView,
    IDimensionDescriptor,
    IExecutionFactory,
    IExecutionResult,
    IExportConfig,
    IExportResult,
    IPreparedExecution,
    IResultHeader,
    NoDataError,
    NotSupported,
    UnexpectedError,
} from "@gooddata/sdk-backend-spi";
import SparkMD5 from "spark-md5";
import { transformResultDimensions } from "../../../convertors/fromBackend/afm/dimensions";
import { transformExecutionResult } from "../../../convertors/fromBackend/afm/result";
import { IExecutionDefinition } from "@gooddata/sdk-model";
import { Execution } from "@gooddata/api-client-tiger";
import { TigerAuthenticatedCallGuard } from "../../../types";
import { DateFormatter } from "../../../convertors/fromBackend/dateFormatting/types";

const TIGER_PAGE_SIZE_LIMIT = 1000;

function sanitizeOffset(offset: number[]): number[] {
    return offset.map((offsetItem = 0) => offsetItem);
}

function sanitizeSize(size: number[]): number[] {
    return size.map((sizeInDim = TIGER_PAGE_SIZE_LIMIT) => {
        if (sizeInDim > TIGER_PAGE_SIZE_LIMIT) {
            // eslint-disable-next-line no-console
            console.warn("The maximum limit per page is " + TIGER_PAGE_SIZE_LIMIT);

            return TIGER_PAGE_SIZE_LIMIT;
        }
        return sizeInDim;
    });
}

export class TigerExecutionResult implements IExecutionResult {
    public readonly dimensions: IDimensionDescriptor[];
    private readonly resultId: string;
    private readonly _fingerprint: string;

    constructor(
        private readonly authCall: TigerAuthenticatedCallGuard,
        public readonly definition: IExecutionDefinition,
        private readonly executionFactory: IExecutionFactory,
        readonly execResponse: Execution.IExecutionResponse,
        private readonly dateFormatter: DateFormatter,
    ) {
        this.dimensions = transformResultDimensions(
            execResponse.executionResponse.dimensions,
            this.definition,
        );
        this.resultId = execResponse.executionResponse.links.executionResult;
        this._fingerprint = SparkMD5.hash(this.resultId);
    }

    public async readAll(): Promise<IDataView> {
        const executionResultPromise = this.authCall((sdk) => sdk.execution.executionResult(this.resultId));

        return this.asDataView(executionResultPromise);
    }

    public async readWindow(offset: number[], size: number[]): Promise<IDataView> {
        const saneOffset = sanitizeOffset(offset);
        const saneSize = sanitizeSize(size);

        const executionResultPromise = this.authCall((sdk) =>
            sdk.execution.executionResult(this.resultId, saneOffset, saneSize),
        );

        return this.asDataView(executionResultPromise);
    }

    public transform(): IPreparedExecution {
        return this.executionFactory.forDefinition(this.definition);
    }

    public async export(_options: IExportConfig): Promise<IExportResult> {
        return new Promise((_, reject) => {
            reject(new NotSupported("Tiger backend does not support exports"));
        });
    }

    public equals(other: IExecutionResult): boolean {
        return this.fingerprint() === other.fingerprint();
    }

    public fingerprint(): string {
        return this._fingerprint;
    }

    private asDataView = (promisedRes: Promise<Execution.IExecutionResult>): Promise<IDataView> => {
        return promisedRes.then((result) => {
            if (!result) {
                // TODO: SDK8: investigate when can this actually happen; perhaps end of data during paging?
                //  perhaps legitimate NoDataCase?
                throw new UnexpectedError("Server returned no data");
            }

            if (isEmptyDataResult(result)) {
                throw new NoDataError(
                    "The execution resulted in no data to display.",
                    new TigerDataView(this, result, this.dateFormatter),
                );
            }

            return new TigerDataView(this, result, this.dateFormatter);
        });
    };
}

class TigerDataView implements IDataView {
    public readonly data: DataValue[][] | DataValue[];
    public readonly definition: IExecutionDefinition;
    public readonly headerItems: IResultHeader[][][];
    public readonly totalCount: number[];
    public readonly count: number[];
    public readonly offset: number[];
    public readonly result: IExecutionResult;
    public readonly totals?: DataValue[][][];
    private readonly _fingerprint: string;

    constructor(
        result: IExecutionResult,
        execResult: Execution.IExecutionResult,
        dateFormatter: DateFormatter,
    ) {
        this.result = result;
        this.definition = result.definition;

        const transformedResult = transformExecutionResult(execResult, result.dimensions, dateFormatter);

        this.data = transformedResult.data;
        this.headerItems = transformedResult.headerItems;
        this.offset = transformedResult.offset;
        this.count = transformedResult.count;
        this.totalCount = transformedResult.total;

        /*
        this.totals = dataResult.totals ? dataResult.totals : [[[]]];

        */

        this._fingerprint = `${result.fingerprint()}/${this.offset.join(",")}-${this.count.join(",")}`;
    }

    public fingerprint(): string {
        return this._fingerprint;
    }

    public equals(other: IDataView): boolean {
        return this.fingerprint() === other.fingerprint();
    }
}

function hasEmptyData(result: Execution.IExecutionResult): boolean {
    return result.data.length === 0;
}

function hasMissingDimensionHeaders(result: Execution.IExecutionResult): boolean {
    /*
     * messy fix to tiger's afm always returning dimension headers with no content
     */
    const firstDimHeaders = result.dimensionHeaders?.[0]?.headerGroups?.[0]?.headers?.[0];
    const secondDimHeaders = result.dimensionHeaders?.[1]?.headerGroups?.[0]?.headers?.[0];

    return !result.dimensionHeaders || (!firstDimHeaders && !secondDimHeaders);
}

function isEmptyDataResult(result: Execution.IExecutionResult): boolean {
    return hasEmptyData(result) && hasMissingDimensionHeaders(result);
}

// (C) 2007-2020 GoodData Corporation
import "isomorphic-fetch";
import fetchMock from "fetch-mock";
import { mockPollingRequestWithStatus } from "./utils/polling";
import { getIn, handleHeadPolling, IPollingOptions, queryString, parseSettingItemValue } from "../util";
import { ApiResponse, XhrModule } from "../xhr";
import { GdcExport } from "@gooddata/api-model-bear";

describe("util", () => {
    const testObj = {
        a: 1,
        b: { c: { d: 2 } },
    };

    describe("getIn", () => {
        it("should return partially applied get", () => {
            expect(getIn("b.c.d")(testObj)).toBe(2);
        });

        it("should work as resolve function of promise", () => {
            return Promise.resolve(testObj)
                .then(getIn("b.c"))
                .then((result) => {
                    expect(result).toEqual({ d: 2 });
                });
        });
    });

    describe("queryString", () => {
        it("should handle undefined", () => {
            expect(queryString(undefined)).toBe("");
        });

        it("should handle empty object", () => {
            expect(queryString({})).toBe("?");
        });

        it("should handle simple object", () => {
            expect(queryString({ aa: 123, bb: "c & a" })).toBe("?aa=123&bb=c%20%26%20a");
        });

        it("should handle object with arrays", () => {
            expect(queryString({ ar: [1, 2, "x"], b: false })).toBe("?ar=1&ar=2&ar=x&b=false");
        });
    });

    describe("handleHeadPolling", () => {
        const URI = "/gdc/exporter/result/12345";
        const failedTask = { status: 400 };
        const finishedTask = { status: 200, uri: URI };
        const runningTask = { status: 202, uri: URI };
        const options: IPollingOptions = {
            maxAttempts: 4,
            pollStep: 1,
        };

        const isPollingDone = (_responseHeaders: Response, response: ApiResponse): boolean => {
            const taskState = response.getData().status;
            return taskState === 200 || taskState >= 400;
        };

        const mockedXHR = () => {
            const xhr = new XhrModule(fetch, {});
            return xhr.get.bind(xhr);
        };

        afterEach(() => {
            fetchMock.restore();
        });

        it("should return timeout error if maxAttempts are reached", async (done) => {
            mockPollingRequestWithStatus(URI, runningTask, finishedTask);

            await handleHeadPolling(mockedXHR(), URI, () => false, options).then(null, (error: Error) => {
                expect(error.message).toBe("Export timeout!!!");
                done();
            });
        });

        it("should return error if the status is 400", async (done) => {
            mockPollingRequestWithStatus(URI, runningTask, failedTask);

            await handleHeadPolling(mockedXHR(), URI, isPollingDone, options).then(null, (error: Error) => {
                expect(error.message).toBe("Bad Request");
                done();
            });
        });

        it("should return uri if the status is 200", async (done) => {
            mockPollingRequestWithStatus(URI, runningTask, finishedTask);

            await handleHeadPolling(mockedXHR(), URI, isPollingDone, options).then(
                (result: GdcExport.IExportResponse) => {
                    expect(result.uri).toEqual(URI);
                    done();
                },
            );
        });
    });

    describe("parseSettingItemValue", () => {
        it("should parse boolean string values", () => {
            expect(parseSettingItemValue("true")).toBe(true);
            expect(parseSettingItemValue("false")).toBe(false);
        });
        it("should parse number values", () => {
            expect(parseSettingItemValue("123")).toBe(123);
            expect(parseSettingItemValue("-123.456")).toBe(-123.456);
        });
        it("should return string values as is", () => {
            expect(parseSettingItemValue("abcd")).toBe("abcd");
            expect(parseSettingItemValue("-123abc456")).toBe("-123abc456");
        });
    });
});

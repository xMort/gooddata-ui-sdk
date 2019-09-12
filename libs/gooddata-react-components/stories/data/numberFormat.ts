// (C) 2007-2018 GoodData Corporation
import { ISeparators } from "@gooddata/numberjs";
import { IChartConfig } from "../../src/interfaces/Config";

export const GERMAN_NUMBER_FORMAT: ISeparators = {
    thousand: ".",
    decimal: ",",
};

export const GERMAN_SEPARATORS: IChartConfig = {
    separators: GERMAN_NUMBER_FORMAT,
};

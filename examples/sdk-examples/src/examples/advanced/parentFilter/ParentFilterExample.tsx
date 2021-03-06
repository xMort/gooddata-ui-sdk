// (C) 2007-2020 GoodData Corporation
import React, { useState, useMemo } from "react";
import { AttributeElements } from "@gooddata/sdk-ui-filters";
import { BarChart } from "@gooddata/sdk-ui-charts";
import { newPositiveAttributeFilter, attributeDisplayFormRef, ObjRef, idRef } from "@gooddata/sdk-model";
import Select from "react-select";
import { Ldm, LdmExt } from "../../../ldm";
import { IElementQueryAttributeFilter } from "@gooddata/sdk-backend-spi";

interface IFilterValue {
    value: string;
    label: string;
}

interface ICustomFilterProps {
    displayForm: ObjRef;
    filterValues: IFilterValue[] | null;
    parentFilters?: IElementQueryAttributeFilter[];
    placeholder: string;
    onChange: (filters: any) => void;
}

const CustomFilter: React.FC<ICustomFilterProps> = ({
    displayForm,
    filterValues,
    parentFilters,
    onChange,
    placeholder,
}) => {
    return (
        <AttributeElements displayForm={displayForm} filters={parentFilters}>
            {({ validElements, isLoading, error }) => {
                if (error) {
                    // eslint-disable-next-line no-console
                    console.error("Loading attribute elements failed!", error);
                }
                const selectOptions =
                    !isLoading && validElements
                        ? validElements.items.map((item) => ({
                              label: item.title,
                              value: item.uri,
                          }))
                        : [];
                return (
                    <span
                        style={{
                            display: "inline-block",
                            minWidth: "10em",
                            verticalAlign: "middle",
                        }}
                    >
                        <Select
                            onChange={onChange}
                            options={selectOptions}
                            isMulti
                            isLoading={isLoading}
                            placeholder={placeholder}
                            value={filterValues}
                        />
                        {error && <span style={{ color: "#e54d42" }}>Loading failed!</span>}
                    </span>
                );
            }}
        </AttributeElements>
    );
};

export const ParentFilterExample: React.FC = () => {
    const [stateFilterValues, setStateFilterValues] = useState<IFilterValue[] | null>([]);
    const [cityFilterValues, setCityFilterValues] = useState<IFilterValue[] | null>([]);

    const insightFilters = useMemo(() => {
        const filters = [];

        if (stateFilterValues?.length) {
            filters.push(
                newPositiveAttributeFilter(Ldm.LocationState, {
                    uris: stateFilterValues.map((filter) => filter.value),
                }),
            );
        }
        if (cityFilterValues?.length) {
            filters.push(
                newPositiveAttributeFilter(Ldm.LocationCity, {
                    uris: cityFilterValues.map((filter) => filter.value),
                }),
            );
        }

        return filters;
    }, [stateFilterValues, cityFilterValues]);

    const cityParentFilters = useMemo(() => {
        return stateFilterValues?.length
            ? [
                  {
                      attributeFilter: newPositiveAttributeFilter(Ldm.LocationState, {
                          uris: stateFilterValues.map((filter) => filter.value),
                      }),
                      overAttribute: idRef(LdmExt.locationIdAttributeIdentifier),
                  },
              ]
            : undefined;
    }, [stateFilterValues]);

    return (
        <div>
            <span>Total Sales per site in&emsp;</span>
            <CustomFilter
                displayForm={attributeDisplayFormRef(Ldm.LocationState)}
                filterValues={stateFilterValues}
                onChange={setStateFilterValues}
                placeholder="all states"
            />
            &emsp;and&emsp;{" "}
            <CustomFilter
                displayForm={attributeDisplayFormRef(Ldm.LocationCity)}
                filterValues={cityFilterValues}
                onChange={setCityFilterValues}
                placeholder="all cities"
                parentFilters={cityParentFilters}
            />
            <hr className="separator" />
            <div style={{ height: 500 }}>
                <BarChart
                    measures={[LdmExt.TotalSales1]}
                    viewBy={Ldm.LocationName.Default}
                    filters={insightFilters}
                    height={500}
                />
            </div>
        </div>
    );
};

export default ParentFilterExample;

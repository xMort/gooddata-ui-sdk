// (C) 2024 GoodData Corporation

import React, { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

import {
    Dropdown,
    DropdownButton,
    DropdownList,
    Hyperlink,
    SingleSelectListItem,
} from "@gooddata/sdk-ui-kit";
import { DEFAULT_DROPDOWN_ALIGN_POINTS, DEFAULT_DROPDOWN_ZINDEX } from "../../constants.js";
import { ISmtpDefinitionObject, IWebhookDefinitionObject } from "@gooddata/sdk-model";

const DROPDOWN_WIDTH = 199;

interface IDestinationItem {
    id: string;
    title: string;
}

interface IDestinationSelectProps {
    notificationChannels: (IWebhookDefinitionObject | ISmtpDefinitionObject)[];
    selectedItemId: string | undefined;
    onChange: (selectedItemId: string) => void;
}

export const DestinationSelect: React.FC<IDestinationSelectProps> = ({
    notificationChannels,
    selectedItemId,
    onChange,
}) => {
    const intl = useIntl();
    const items = useMemo(() => {
        return (
            notificationChannels?.map(
                (wh): IDestinationItem => ({
                    id: wh.id,
                    title: wh.destination?.name ?? wh.id,
                }),
            ) ?? []
        );
    }, [notificationChannels]);

    const selectedItem = useMemo(() => {
        return items.find((item) => item.id === selectedItemId);
    }, [items, selectedItemId]);

    return (
        <div className="gd-input-component gd-destination-field s-gd-notifications-channels-dialog-destination">
            <label className="gd-label">
                <FormattedMessage id="dialogs.schedule.email.destination" />
            </label>
            {items.length === 0 ? (
                <div className="gd-notifications-channels-dialog-destination-empty">
                    <span>
                        <span className="gd-icon-warning" />
                        <FormattedMessage id="dialogs.schedule.email.destination.missing" />
                    </span>
                    <Hyperlink
                        text={intl.formatMessage({ id: "dialogs.schedule.email.destination.help" })}
                        href="/settings"
                    />
                </div>
            ) : (
                <Dropdown
                    alignPoints={DEFAULT_DROPDOWN_ALIGN_POINTS}
                    className="gd-notifications-channels-dialog-destination s-gd-notifications-channels-dialog-destination"
                    renderButton={({ toggleDropdown }) => (
                        <DropdownButton
                            value={selectedItem?.title}
                            onClick={toggleDropdown}
                            className="gd-notifications-channels-dialog-destination-button"
                        />
                    )}
                    renderBody={({ closeDropdown, isMobile }) => (
                        <DropdownList
                            width={DROPDOWN_WIDTH}
                            items={items}
                            isMobile={isMobile}
                            renderItem={({ item }) => (
                                <SingleSelectListItem
                                    title={item.title}
                                    onClick={() => {
                                        onChange(item.id);
                                        closeDropdown();
                                    }}
                                    isSelected={selectedItem?.id === item.id}
                                />
                            )}
                        />
                    )}
                    overlayPositionType="sameAsTarget"
                    overlayZIndex={DEFAULT_DROPDOWN_ZINDEX}
                />
            )}
        </div>
    );
};

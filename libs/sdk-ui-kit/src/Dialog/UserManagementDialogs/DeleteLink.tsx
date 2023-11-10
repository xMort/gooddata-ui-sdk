// (C) 2023 GoodData Corporation

import React from "react";

import { Button } from "../../Button/index.js";
import { withBubble } from "../../Bubble/index.js";

export interface IDeleteLinkProps {
    isDeleteLinkEnabled: boolean;
    deleteLinkText: string;
    disabledLinkTooltipTextId: string;
    onOpenDeleteDialog: () => void;
}

const Link: React.FC<IDeleteLinkProps> = ({ deleteLinkText, onOpenDeleteDialog, isDeleteLinkEnabled }) => {
    return isDeleteLinkEnabled ? (
        <Button
            className="gd-button gd-button-link-dimmed gd-user-management-dialog-button-underlined"
            value={deleteLinkText}
            onClick={onOpenDeleteDialog}
        />
    ) : (
        <span className="gd-button-link-dimmed-disabled">{deleteLinkText}</span>
    );
};

const DisabledLinKWithBubble = withBubble(Link);

export const DeleteLink: React.FC<IDeleteLinkProps> = (props) => {
    const { isDeleteLinkEnabled, disabledLinkTooltipTextId } = props;
    return (
        <div>
            {
                isDeleteLinkEnabled ? (
                    <Link {...props} />
                ) : (
                    <DisabledLinKWithBubble
                        {...props}
                        showBubble={true}
                        bubbleTextId={disabledLinkTooltipTextId}
                    />
                )
            }
        </div>
    );
};

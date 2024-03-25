// (C) 2019-2024 GoodData Corporation
import {
    IWorkspaceSettings,
    IWorkspaceSettingsService,
    IUserWorkspaceSettings,
} from "@gooddata/sdk-backend-spi";
import { ISettings } from "@gooddata/sdk-model";

import { TigerAuthenticatedCallGuard, TigerSettingsType } from "../../../types/index.js";
import { TigerFeaturesService, pickContext } from "../../features/index.js";
import { DefaultUiSettings, DefaultUserSettings } from "../../uiSettings.js";
import { unwrapSettingContent } from "../../../convertors/fromBackend/SettingsConverter.js";
import { TigerSettingsService, mapTypeToKey } from "../../settings/index.js";
import { GET_OPTIMIZED_WORKSPACE_PARAMS } from "../constants.js";

export class TigerWorkspaceSettings
    extends TigerSettingsService<IWorkspaceSettings>
    implements IWorkspaceSettingsService
{
    constructor(private readonly authCall: TigerAuthenticatedCallGuard, public readonly workspace: string) {
        super();
    }

    public getSettings(): Promise<IWorkspaceSettings> {
        return this.authCall(async (client) => {
            const {
                data: { meta: config },
            } = (
                await client.entities.getEntityWorkspaces({
                    id: this.workspace,
                    ...GET_OPTIMIZED_WORKSPACE_PARAMS,
                })
            ).data;

            return {
                workspace: this.workspace,
                ...DefaultUiSettings,
                ...config?.config,
            };
        });
    }

    public async setLocale(locale: string): Promise<void> {
        return this.setSetting("LOCALE", { value: locale });
    }

    public async setTheme(activeThemeId: string): Promise<void> {
        return this.setSetting("ACTIVE_THEME", { id: activeThemeId, type: "theme" });
    }

    public async deleteTheme() {
        return this.deleteSettingByType("ACTIVE_THEME");
    }

    public async setColorPalette(activeColorPaletteId: string): Promise<void> {
        return this.setSetting("ACTIVE_COLOR_PALETTE", { id: activeColorPaletteId, type: "colorPalette" });
    }

    public async deleteColorPalette() {
        return this.deleteSettingByType("ACTIVE_COLOR_PALETTE");
    }

    public getSettingsForCurrentUser(): Promise<IUserWorkspaceSettings> {
        return getSettingsForCurrentUser(this.authCall, this.workspace);
    }

    public async setTimezone(timezone: string): Promise<void> {
        return this.setSetting("TIMEZONE", { value: timezone });
    }

    public async setDateFormat(dateFormat: string): Promise<void> {
        return this.setSetting("FORMAT_LOCALE", { value: dateFormat });
    }

    public async setWeekStart(weekStart: string): Promise<void> {
        return this.setSetting("WEEK_START", { value: weekStart });
    }

    protected async getSettingByType(type: TigerSettingsType) {
        return this.authCall((client) =>
            client.entities.getAllEntitiesWorkspaceSettings({
                workspaceId: this.workspace,
                origin: "NATIVE",
                filter: `type==${type}`,
            }),
        );
    }

    protected async updateSetting(type: TigerSettingsType, id: string, content: any): Promise<any> {
        return this.authCall(async (client) =>
            client.entities.updateEntityWorkspaceSettings({
                workspaceId: this.workspace,
                objectId: id,
                jsonApiWorkspaceSettingInDocument: {
                    data: {
                        type: "workspaceSetting",
                        id,
                        attributes: {
                            content,
                            type,
                        },
                    },
                },
            }),
        );
    }

    protected async createSetting(type: TigerSettingsType, id: string, content: any): Promise<any> {
        return this.authCall(async (client) =>
            client.entities.createEntityWorkspaceSettings({
                workspaceId: this.workspace,
                jsonApiWorkspaceSettingPostOptionalIdDocument: {
                    data: {
                        type: "workspaceSetting",
                        id,
                        attributes: {
                            content,
                            type,
                        },
                    },
                },
            }),
        );
    }

    protected async deleteSettingByType(type: TigerSettingsType): Promise<any> {
        const settings = await this.getSettingByType(type);
        for (const setting of settings.data.data) {
            await this.authCall(async (client) =>
                client.entities.deleteEntityWorkspaceSettings({
                    workspaceId: this.workspace,
                    objectId: setting.id,
                }),
            );
        }
    }
}

/**
 * @internal
 */
async function resolveSettings(authCall: TigerAuthenticatedCallGuard, workspace: string): Promise<ISettings> {
    const { data } = await authCall(async (client) =>
        client.actions.workspaceResolveAllSettings({
            workspaceId: workspace,
        }),
    );

    return data.reduce((result: ISettings, setting) => {
        return {
            ...result,
            [mapTypeToKey(setting.type, setting.id)]: unwrapSettingContent(setting.content),
        };
    }, {});
}

/**
 * Expose this wrapper to other SPI implementations
 *
 * @internal
 */
export function getSettingsForCurrentUser(
    authCall: TigerAuthenticatedCallGuard,
    workspace: string,
): Promise<IUserWorkspaceSettings> {
    return authCall(async (client) => {
        const {
            data: { meta: config, attributes },
        } = (
            await client.entities.getEntityWorkspaces({
                id: workspace,
                ...GET_OPTIMIZED_WORKSPACE_PARAMS,
            })
        ).data;

        const resolvedSettings: ISettings = await resolveSettings(authCall, workspace);

        const profile = await client.profile.getCurrent();
        const features = await new TigerFeaturesService(authCall).getFeatures(
            profile,
            pickContext(attributes, profile.organizationId),
        );

        return {
            ...DefaultUserSettings,
            userId: profile.userId,
            workspace,
            ...config?.config,
            ...features,
            ...resolvedSettings,
        };
    });
}

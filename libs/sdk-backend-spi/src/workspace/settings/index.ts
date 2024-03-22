// (C) 2019-2024 GoodData Corporation
import { IWorkspaceSettings, IUserWorkspaceSettings } from "../../common/settings.js";

/**
 * This query service provides access to feature flags that are in effect for particular workspace.
 *
 * @public
 */
export interface IWorkspaceSettingsService {
    /**
     * Asynchronously queries actual feature flags.
     *
     * @returns promise of workspace settings
     */
    getSettings(): Promise<IWorkspaceSettings>;

    /**
     * Asynchronously queries feature flags taking into account settings from both the workspace and the current user.
     *
     * @returns promise of user/workspace settings
     */
    getSettingsForCurrentUser(): Promise<IUserWorkspaceSettings>;

    /**
     * Sets locale for current workspace.
     *
     * @param locale - IETF BCP 47 Code locale ID, for example "en-US", "cs-CZ", etc.
     *
     * @returns promise
     */
    setLocale(locale: string): Promise<void>;

    /**
     * Sets color palette for current workspace.
     *
     * @param colorPaletteId - ID of the color palette to apply to charts in workspace.
     *
     * @returns promise
     */
    setColorPalette(colorPaletteId: string): Promise<void>;

    /**
     * Deletes color palette from workspace settings returning chart colors to default.
     *
     * @returns promise
     */
    deleteColorPalette(): Promise<void>;

    /**
     * Sets theme for current workspace.
     *
     * @param themeId - ID of the theme to apply to the current workspace.
     *
     * @returns promise
     */
    setTheme(themeId: string): Promise<void>;

    /**
     * Deletes theme from workspace settings returning workspace styling to default.
     *
     * @returns promise
     */
    deleteTheme(): Promise<void>;
}

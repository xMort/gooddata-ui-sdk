// (C) 2021-2024 GoodData Corporation
import {
    IUserWorkspaceSettings,
    IWorkspaceSettings,
    IWorkspaceSettingsService,
} from "@gooddata/sdk-backend-spi";

/**
 * @alpha
 */
export abstract class DecoratedWorkspaceSettingsService implements IWorkspaceSettingsService {
    protected constructor(protected decorated: IWorkspaceSettingsService) {}

    async getSettings(): Promise<IWorkspaceSettings> {
        return this.decorated.getSettings();
    }

    async getSettingsForCurrentUser(): Promise<IUserWorkspaceSettings> {
        return this.decorated.getSettingsForCurrentUser();
    }

    async setLocale(locale: string): Promise<void> {
        return this.decorated.setLocale(locale);
    }

    async setTheme(themeId: string): Promise<void> {
        return this.decorated.setTheme(themeId);
    }

    async deleteTheme(): Promise<void> {
        return this.decorated.deleteTheme();
    }

    async setColorPalette(colorPaletteId: string): Promise<void> {
        return this.decorated.setColorPalette(colorPaletteId);
    }

    async deleteColorPalette(): Promise<void> {
        return this.decorated.deleteColorPalette();
    }
}

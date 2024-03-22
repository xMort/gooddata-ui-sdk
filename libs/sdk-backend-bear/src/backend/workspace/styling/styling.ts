// (C) 2019-2024 GoodData Corporation
import { IWorkspaceStylingService, NotSupported } from "@gooddata/sdk-backend-spi";
import { IColorPaletteItem, ITheme, ObjRef } from "@gooddata/sdk-model";
import { isTheme, unwrapMetadataObject } from "@gooddata/api-model-bear";
import { BearAuthenticatedCallGuard } from "../../../types/auth.js";
import { isApiResponseError } from "../../../utils/errorHandling.js";

export class BearWorkspaceStyling implements IWorkspaceStylingService {
    constructor(private readonly authCall: BearAuthenticatedCallGuard, public readonly workspace: string) {}

    public getColorPalette = async (): Promise<IColorPaletteItem[]> => {
        const palette = await this.authCall((sdk) => sdk.project.getColorPaletteWithGuids(this.workspace));
        return palette || [];
    };

    public getTheme = async (): Promise<ITheme> => {
        const config = await this.authCall((sdk) => sdk.project.getProjectFeatureFlags(this.workspace));
        const identifier = config.selectedUiTheme as string;

        return identifier
            ? this.authCall((sdk) =>
                  sdk.md
                      .getObjectByIdentifier(this.workspace, identifier)
                      .then((object) => {
                          const unwrappedObject = unwrapMetadataObject(object);
                          return (isTheme(unwrappedObject) && unwrappedObject.content) || {};
                      })
                      .catch((err) => {
                          if (isApiResponseError(err)) {
                              return {};
                          }

                          throw err;
                      }),
              )
            : {};
    };

    getActiveTheme(): Promise<ObjRef | undefined> {
        throw new NotSupported("Backend does not support workspace theme setup");
    }
    setActiveTheme(_themeRef: ObjRef): Promise<void> {
        throw new NotSupported("Backend does not support workspace theme setup");
    }
    clearActiveTheme(): Promise<void> {
        throw new NotSupported("Backend does not support workspace theme setup");
    }
    getActiveColorPalette(): Promise<ObjRef | undefined> {
        throw new NotSupported("Backend does not support workspace color palette setup");
    }
    setActiveColorPalette(_colorPaletteRef: ObjRef): Promise<void> {
        throw new NotSupported("Backend does not support workspace color palette setup");
    }
    clearActiveColorPalette(): Promise<void> {
        throw new NotSupported("Backend does not support workspace color palette setup");
    }
}

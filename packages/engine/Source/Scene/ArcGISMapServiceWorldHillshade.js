import Credit from "../Core/Credit.js";
import defined from "../Core/defined.js";
import Resource from "../Core/Resource.js";

let defaultTokenCredit;
const defaultAccessToken =
  "AAPK2f7a9a89c6dc40ad926c3499141fecffWllt95jAiepZyFUkh3j3qU-pKQzn9odSccP_HhOnzggTIrQ90vijnlPCzvS4NJ3t";
/**
 * Default options for accessing the ArcGIS World Hillshade image tile service.
 *
 * An ArcGIS access token is required to access ArcGIS image tile layers.
 * A default token is provided for evaluation purposes only.
 * To obtain an access token, go to {@link https://developers.arcgis.com} and create a free account.
 * More info can be found in the {@link https://developers.arcgis.com/documentation/mapping-apis-and-services/security/ | ArcGIS developer guide}.
 *
 * @see ArcGisMapServerImageryProvider
 * @namespace ArcGISMapServiceWorldHillshade
 */

const ArcGISMapServiceWorldHillshade = {};
/**
 * Gets or sets the default ArcGIS access token.
 *
 * @type {string}
 */
ArcGISMapServiceWorldHillshade.defaultAccessToken = defaultAccessToken;
/**
 * Gets or sets the URL of the ArcGIS World Hillshade tile service.
 *
 * @type {string|Resource}
 * @default https://ibasemaps-api.arcgis.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer
 */
ArcGISMapServiceWorldHillshade.defaultServer = new Resource({
  url:
    "https://ibasemaps-api.arcgis.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer",
});

/**
 *
 * @param {string} providedKey
 * @return {string|undefined}
 */
ArcGISMapServiceWorldHillshade.getDefaultTokenCredit = function (providedKey) {
  if (providedKey !== defaultAccessToken) {
    return undefined;
  }

  if (!defined(defaultTokenCredit)) {
    const defaultTokenMessage =
      '<b> \
            This application is using a default ArcGIS access token. Please assign <i>Cesium.ArcGISMapServiceWorldHillshade.defaultAccessToken</i> \
            with an access token from your ArcGIS account before using the ArcGIS World Hillsahde tile service. \
            You can sign up for a free ArcGIS Developer account at <a href="https://developers.arcgis.com/">https://developers.arcgis.com/</a>.</b>';

    defaultTokenCredit = new Credit(defaultTokenMessage, true);
  }

  return defaultTokenCredit;
};
export default ArcGISMapServiceWorldHillshade;
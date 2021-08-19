import { DecorateContext, Decorator, IModelApp, IModelConnection, Marker, ScreenViewport } from "@bentley/imodeljs-frontend";
import { SmartDeviceMarkerDecoration } from "../markers/SmartDeviceMarkerDecoration";
import { SmartDeviceMarkerOverlay } from "../markers/SmartDeviceMarkerOverlay";
import { SmartDeviceAPI } from "../../SmartDeviceAPI";
import { UiFramework } from "@bentley/ui-framework";

export class SmartDeviceDecorator implements Decorator {
  private _iModel: IModelConnection;
  private _markerDecorationSet: Marker[];
  private _markerOverlaySet: Marker[];

  private _worldDecoration: boolean;

  constructor(vp: ScreenViewport) {
    this._iModel = vp.iModel;
    this._markerDecorationSet = [];
    this._markerOverlaySet = [];
    this._worldDecoration = true;

    this.addMarkers();
  }

  public setWorldDecoration(worldDecoration: boolean) {
    this._worldDecoration = worldDecoration
    IModelApp.viewManager.invalidateDecorationsAllViews()
  }

  public static async getSmartDeviceData() {
    const query = `
      SELECT SmartDeviceId,
              SmartDeviceType,
              ECInstanceId,
              Origin
              FROM DgnCustomItemTypes_HouseSchema.SmartDevice
              WHERE Origin IS NOT NULL
    `

    const results = UiFramework.getIModelConnection()!.query(query);
    const values = [];

    for await (const row of results)
      values.push(row);
    
    return values;
  }

  private async addMarkers() {
    const values = await SmartDeviceDecorator.getSmartDeviceData();
    const cloudData = await SmartDeviceAPI.getData();

    values.forEach(value => {
      const smartDeviceMarkerDecoration = new SmartDeviceMarkerDecoration(
        { x: value.origin.x, y: value.origin.y, z: value.origin.z },
        { x: 40, y: 40 },
        value.smartDeviceId,
        value.smartDeviceType,
        cloudData[value.smartDeviceId],
        value.id
      );

      const smartDeviceMarkerOverlay = new SmartDeviceMarkerOverlay(
        { x: value.origin.x, y: value.origin.y, z: value.origin.z },
        { x: 40, y: 40 },
        value.smartDeviceId,
        value.smartDeviceType,
        cloudData[value.smartDeviceId],
        value.id
      );

      this._markerDecorationSet.push(smartDeviceMarkerDecoration);
      this._markerOverlaySet.push(smartDeviceMarkerOverlay);
    })
  }

  public decorate(context: DecorateContext): void {
    if(this._worldDecoration) {
      this._markerDecorationSet.forEach(marker => {
        marker.addDecoration(context);
      })
    } else {
      this._markerOverlaySet.forEach(marker => {
        marker.addDecoration(context);
      })
    }
  }
}
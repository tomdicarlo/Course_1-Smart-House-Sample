import { Angle, Arc3d, Matrix3d, Point2d, Transform, XAndY, XYAndZ } from "@bentley/geometry-core";
import { ColorDef, GraphicParams, ImageSource, RenderMaterial, RenderTexture, TextureMapping } from "@bentley/imodeljs-common";
import { Marker, BeButtonEvent, IModelApp, NotifyMessageDetails, OutputMessagePriority, StandardViewId, DecorateContext, GraphicType, imageElementFromUrl, RenderSystem } from "@bentley/imodeljs-frontend";
import { ModelsTree } from "@bentley/ui-framework";

export class SmartDeviceMarker extends Marker {
  private _smartDeviceId: string;
  private _smartDeviceType: string;
  private _elementId: string;

  constructor(location: XYAndZ, size: XAndY, smartDeviceId: string, smartDeviceType: string, cloudData: any, elementId: string) {
    super(location, size);

    this._smartDeviceId = smartDeviceId;
    this._smartDeviceType = smartDeviceType;
    this._elementId = elementId;

    this.title = this.populateTitle(cloudData);
  }

  private populateTitle(cloudData: any) {

    /*
     "speaker001": { 
      "Notifications": 2, 
      "song Playing": true,
      "Song Name": "All I Want for Christmas Is You",
      "Song Artist": "Mariah Carey"
    },
  */
    let smartTable = "";
    for (const [key, value] of Object.entries(cloudData)) {
      smartTable += `
        <tr>
          <th>${key}</th>
          <th>${value}</th>
        </tr>
      `
    };
    
    const smartTableDiv = document.createElement("div");
    smartTableDiv.className = "smart-table";
    smartTableDiv.innerHTML = `
     <h3>${this._smartDeviceId}</h3>
     <table>
      ${smartTable}
     </table>
    `;

    return smartTableDiv;
  }

  public onMouseButton(_ev: BeButtonEvent): boolean {
    if (!_ev.isDown) return true;

    IModelApp.notifications.outputMessage(new NotifyMessageDetails(OutputMessagePriority.Info, "Element " + this._smartDeviceId + " was clicked on"));
    IModelApp.viewManager.selectedView!.zoomToElements(this._elementId, { animateFrustumChange: true, standardViewId: StandardViewId.RightIso });
    return true;
  }

  public async addMarker(context: DecorateContext) {
    // Setup the marker selection
    super.addMarker(context)
    
    // Draw the world overlay circle for each element
    const overlayBuilder = context.createGraphicBuilder(GraphicType.WorldOverlay);
    const overlayEllipse = Arc3d.createScaledXYColumns(this.worldLocation, context.viewport.rotation.transpose(), .2, .2);
  
    overlayBuilder.setBlankingFill(ColorDef.blue.withTransparency(200));
    overlayBuilder.addArc(overlayEllipse, true, true);
    const overlayGraphics = overlayBuilder.finish()
    context.addDecoration(GraphicType.WorldOverlay, overlayGraphics);    
    
    // Draw the world decoration image for each element
    const decorationBuilder = context.createGraphicBuilder(GraphicType.WorldDecoration);
    // Check if we have the render material cached
    let renderMaterial = IModelApp.renderSystem.findMaterial(this._elementId, IModelApp.viewManager.selectedView!.iModel)
    if(!renderMaterial) {
      // If not, we can load the image, create a texture with it, and then map it onto a material
      const image = await imageElementFromUrl(`/${this._smartDeviceType}.png`)
      const texture = IModelApp.renderSystem.createTextureFromImage(image, false, IModelApp.viewManager.selectedView!.iModel, new RenderTexture.Params(this._elementId, undefined, undefined))
      if(texture) {
        const textureMapping = new TextureMapping(texture,new TextureMapping.Params({}))
        const materialParams = new RenderMaterial.Params()
        materialParams.textureMapping = textureMapping;
        materialParams.key = this._elementId;
        renderMaterial = IModelApp.renderSystem.createMaterial(materialParams, IModelApp.viewManager.selectedView!.iModel)
      }
    }
    
    if(renderMaterial) {
      // Create a 90 degree rotation relative to the camera to rotate our icon ellipse
      const angle = context.viewport.rotation.transpose();
      angle.multiplyMatrixMatrix(Matrix3d.create90DegreeRotationAroundAxis(0))
      const vp = IModelApp.viewManager.selectedView;
      let eyePoint;
      if(vp && vp.view.is3d()){
        eyePoint = vp.view.getEyePoint()
      }
      if(eyePoint) {
        // This will offset the icon towards the camera to reduce the visual impact of the icon clipping with other elements
        const vector = this.worldLocation.unitVectorTo(eyePoint)
        if(vector) {
          let decorationEllipse = Arc3d.createScaledXYColumns(this.worldLocation.plusScaled(vector, 0.3), angle.multiplyMatrixMatrix(Matrix3d.create90DegreeRotationAroundAxis(2)), .2, .2);
        
          const graphicParams = new GraphicParams()
          graphicParams.material = renderMaterial;
          decorationBuilder.activateGraphicParams(graphicParams)

          decorationBuilder.addArc(decorationEllipse, true, true);
          const decorationGraphics = decorationBuilder.finish()
          context.addDecoration(GraphicType.WorldDecoration, decorationGraphics);
        }
      }
    }
  }
}
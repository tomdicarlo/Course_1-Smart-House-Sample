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

    //this.setImageUrl(`/${this._smartDeviceType}.png`);
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
    
    // Draw the world overlaw circle for each element
    const builder = context.createGraphicBuilder(GraphicType.WorldOverlay);
    const ellipse = Arc3d.createScaledXYColumns(this.worldLocation, context.viewport.rotation.transpose(), .2, .2);
  
    //console.log(ellipse)
    builder.setBlankingFill(ColorDef.blue.withTransparency(200));
    builder.addArc(ellipse, true, true);
    const graphics = builder.finish()
    context.addDecoration(GraphicType.WorldOverlay, graphics);    
    
    // Draw the world decoration image for each element
    const builder2 = context.createGraphicBuilder(GraphicType.WorldDecoration);
    let renderMaterial = IModelApp.renderSystem.findMaterial(this._elementId, IModelApp.viewManager.selectedView!.iModel)
    if(!renderMaterial) {
      const image = await imageElementFromUrl(`/${this._smartDeviceType}.png`)
      const texture = IModelApp.renderSystem.createTextureFromImage(image, false, IModelApp.viewManager.selectedView!.iModel, new RenderTexture.Params(this._elementId, undefined, undefined))
      if(texture) {
        const textureMapping = new TextureMapping(texture,new TextureMapping.Params({}))
        const materialParams = new RenderMaterial.Params()
        materialParams.textureMapping = textureMapping;
        materialParams.key = this._elementId;
        materialParams.alpha = 1
        renderMaterial = IModelApp.renderSystem.createMaterial(materialParams, IModelApp.viewManager.selectedView!.iModel)
      }
    }
    
    if(renderMaterial) {
      //console.log(renderMaterial)
      console.log(context.viewport.rotation.transpose())
      const angle = context.viewport.rotation.transpose();
      angle.multiplyMatrixMatrix(Matrix3d.create90DegreeRotationAroundAxis(0))
      const vp = IModelApp.viewManager.selectedView;
      let eyePoint;
      if(vp && vp.view.is3d()){
        eyePoint = vp.view.getEyePoint()
      }
      if(eyePoint) {
        const vector = this.worldLocation.unitVectorTo(eyePoint)
        if(vector) {
        let ellipse2 = Arc3d.createScaledXYColumns(this.worldLocation.plusScaled(vector, 0.3), angle.multiplyMatrixMatrix(Matrix3d.create90DegreeRotationAroundAxis(2)), .2, .2);
      
        const graphicParams = new GraphicParams()
        graphicParams.fillColor = ColorDef.white
        graphicParams.setFillTransparency(255)
        graphicParams.material = renderMaterial;
        builder2.activateGraphicParams(graphicParams)

        //builder.setBlankingFill(ColorDef.white);
        builder2.addArc(ellipse2, true, true);
        const graphics2 = builder2.finish()
        context.addDecoration(GraphicType.WorldDecoration, graphics2);
      }
    }}
  }


}
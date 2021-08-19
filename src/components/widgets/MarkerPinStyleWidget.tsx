import { AbstractWidgetProps, StagePanelLocation, StagePanelSection, UiItemsProvider } from "@bentley/ui-abstract";
import { Toggle } from "@bentley/ui-core";
import * as React from "react";

export const MarkerPinStyleWidget: React.FunctionComponent<{handleMarkerPinStyleWidgetToggle: (worldDecoration: boolean) => void}> = (props) => {
  const [worldDecoration, setWorldDecoration] = React.useState<boolean>(true);

  React.useEffect(() => {
    props.handleMarkerPinStyleWidgetToggle(worldDecoration)
  }, [worldDecoration])

  return (
    <div className="sample-options">
        <div className="sample-options-2col">
            <span>Toggle Marker Style:</span>
            <Toggle isOn={true} onChange={(checked) => setWorldDecoration(checked)}></Toggle>
        </div>
    </div>
  )
}

export class MarkerPinStyleWidgetProvider implements UiItemsProvider {
    public readonly id: string = "MarkerPinStyleWidgetProvider";
    public handleMarkerPinStyleWidgetToggle: (worldDecoration: boolean) => void;

    constructor(handleMarkerPinStyleWidgetToggle: (worldDecoration: boolean) => void) {
        this.handleMarkerPinStyleWidgetToggle = handleMarkerPinStyleWidgetToggle;
    }

    public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection): ReadonlyArray<AbstractWidgetProps> {
      const widgets: AbstractWidgetProps[] = [];
      if (location === StagePanelLocation.Right) {
        widgets.push(
          {
            id: "MarkerPinStyleWidget",
            label: "Marker Pin Style Widget Toggle",
            // defaultState: WidgetState.Floating,
            // eslint-disable-next-line react/display-name
            getWidgetContent: () => <MarkerPinStyleWidget  handleMarkerPinStyleWidgetToggle={this.handleMarkerPinStyleWidgetToggle}/>,
          }
        );
      }
      return widgets;
    }
  }
  

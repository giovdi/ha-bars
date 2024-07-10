# Home Assistant Card - Bars

[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)

⚠️ THIS CARD IS NOT READY YET, but feel free to test it on your HA.

## Setup

Manual installation is required.

Copy-paste the bars.js to www folder and include it as a resource in your dashboard (`local/bars.js`).

## Config

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| type | string | **(required)** | v0.0.1 | Must be `custom:fsg-bars` |
| entity | string | **(required)** | v0.0.1 | Entity ID |
| primary_info | boolean \| string | `true` | v0.0.1 | Entity name as the title of the card. It can be overridden with a string or hidden with `false`. |
| secondary_info | boolean \| string \| template | `true` | v0.0.1 | Current value of the sensor and the max value if `max_type` is `duration` or `delta`. It can be overridden with a string or a template in Jinja2 format or hidden with `false`. |
| min | numeric \| template | `0` | v0.0.1 | Minimum value. It can be a template in Jinja2 format. |
| max | numeric \| template | `100` | v0.0.1 | Maximum value. It can be a template in Jinja2 format. |
| max_type | string | `absolute` | v0.0.1 | One of the following: `absolute`, `delta`, `duration`. See [Max types](#max-types) for more info. |
| max_span | string | `d` | v0.0.1 | Type of unit used with the `duration` max_type. One of the following: `s` for seconds, `m` for minutes, `h` for hours, `d` for days, `w` for weeks, `mo` for months. See [Max types](#max-types) for more info. |
| inverse | boolean | `false` | v0.0.1 | If `true` sets the min as the maximum point, and the max as the minimum point. |
| bars_height | numeric | `50` | v0.0.1 | Height (in px) of the bars |
| bars_margin | numeric | `2` | v0.0.1 | Horizontal margin (in px) of each bar. Spacing between each bar this `bars_margin * 2` px. |
| colors | list(string) | `['#1679AB']` | v0.0.1 | List of colors used in the card. First is at min-point, Last at max-point. Additional colors are equally distribuited from min to max. Only hex colors are supported! |
| color_off | string |  | v0.0.1 | Color used when a bar is off. |
| color_min | string |  | v0.0.1 | Color used for each bar when the current sensor value is below the minimum. |
| color_max | string |  | v0.0.1 | Color used for each bar when the current sensor value is above the maximum. |
| tap_action | [TapAction](#tapaction) |  | v0.0.1 | Action triggered when the card is tapped once. |
| hold_action | [TapAction](#tapaction) |  | v0.0.1 | Action triggered when the card is hold (doesn't work for the Home Assitant companion app). |
| double_tap_action | [TapAction](#tapaction) |  | v0.0.1 | Action triggered when the card is tapped twice. |

### TapAction

## Examples

```yaml
type: custom:fsg-bars
entity: sensor.car_fuel_level
primary_info: Car fuel level
secondary_info: |
  [[[
    return states['sensor.car_fuel_level'].state+' km ('+this.stateValue+' %)'
  ]]]
colors:
  - '#EE4266'
  - '#FFD23F'
  - '#337357'
  - '#337357'
```

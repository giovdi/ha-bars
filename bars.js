class FsgBars extends HTMLElement {

	constructor() {
		super();

		this.init = false;

		this._primary_info = true;
		this._secondary_info = true;

		this._bars = 30;
		this._min = 0;
		this._max = 100;
		this._max_type = "absolute"
		this._max_span = "d";
		this._inverse = false;

		this._colors = ['#1679AB'];
		this._color_off = null
		this._color_min = null;
		this._color_max = null;

		this._bars_height = 50;
		this._bars_margin = 2;
		this._bars_colors = [];

		this._tap_action = null;
		this._hold_action = null;
		this._double_tap_action = null;
	}

	// Whenever the state changes, a new `hass` object is set. Use this to
	// update your content.
	set hass(hass) {
		this._hass = hass;

		// Initialize the content if it's not there yet.
		if (!this.init) {
			this.init = true;

			// finalize options depending from hass
			if (hass.themes.darkMode) {
				this._color_off = 'rgba(0,0,0,0.3)';
			} else {
				this._color_off = 'rgba(0,0,0,0.1)';
			}

			if (isNaN(this._min)) {
				var trimmed = this._min.trim();
				this._min = this._evalTemplate(hass, trimmed.slice(3, -3));
				if (isNaN(this._min)) {
					throw new Error("Min option template must return a number");
				}
			}

			// init bars and this.cards
			var barsStr = '';
			for (var i = 0; i < this._bars; i++) {
				barsStr += `<div class="bar" style="flex:0px 1 0; border-radius:5px; margin:0 ${this._bars_margin}px; height:${this._bars_height}px"></div>`;
			}
			this.card = document.createElement("ha-card");
			this.card.innerHTML = `
				<div class="card-content">
					<div class="head">
						<div class="primary-info" style="font-size:1.4em; padding-bottom:8px;"></div>
						<div class="secondary-info" style="padding-bottom:8px"></div>
					</div>
					<div class="bars" style="display:flex; flex-direction:row; flex-wrap:nowrap; width:100%">${barsStr}</div>
				</div>
				`;
			this.primaryInfo = this.card.querySelector("div.primary-info");
			this.secondaryInfo = this.card.querySelector("div.secondary-info");
			this.barsCnt = this.card.querySelector("div.bars");
			this.bars = this.card.querySelectorAll("div.bar");
			
			this.attachShadow({ mode: "open" });
			this.shadowRoot.append(this.card);

			// tap classes
			var tapClasses = '';
			if (this._tap_action != null || this._hold_action != null || this._double_tap_action != null) {
				this.card.style.cursor = 'pointer';
			}

			// ACTIONS
			let pressTimer;
			let clickTimer;
			let isLongPress = false;
			let isDoubleClick = false;

			this.card.addEventListener('mousedown', (e) => {
				isLongPress = false;
				isDoubleClick = false;
				pressTimer = setTimeout(() => {
					this._on_hold_action();
					isLongPress = true;
				}, 300);
			});

			this.card.addEventListener('mouseup', (e) => {
				clearTimeout(pressTimer);
				if (!isLongPress && !isDoubleClick) {
					clickTimer = setTimeout(() => {
						if (!isDoubleClick) {
							this._on_tap_action();
						}
					}, 200);
				}
			});

			this.card.addEventListener('mouseleave', (e) => {
				clearTimeout(pressTimer);
			});

			this.card.addEventListener('dblclick', (e) => {
				clearTimeout(clickTimer);
				isDoubleClick = true;
				this._on_double_tap_action();
			});
		}

		const entityId = this.config.entity;
		const state = hass.states[entityId];
		this.stateValue = state.state;

		// CALC VALUES
		var min_current, current, max_current;
		switch (this._max_type) {
			case 'duration':
				var min_currentD = new Date(this.stateValue);
				var max_currentD = new Date(this.stateValue);
				switch (this._max_span) {
					case 's':
						max_currentD.setSeconds(min_currentD.getSeconds() + this._max);
						break;

					case 'm':
						max_currentD.setMinutes(min_currentD.getMinutes() + this._max);
						break;

					case 'h':
						max_currentD.setHours(min_currentD.getHours() + this._max);
						break;

					case 'd':
						max_currentD.setDate(min_currentD.getDate() + this._max);
						break;

					case 'w':
						max_currentD.setDate(min_currentD.getDate() + (this._max * 7));
						break;

					case 'mo':
						max_currentD.setMonth(min_currentD.getMonth() + this._max);
						break;

					default:
						throw new Error(`Duration max span '${this._max_span}' not implemented`);
						break;
				}
				min_current = min_currentD.getTime();
				current = Date.now();
				max_current = max_currentD.getTime();
				break;

			case "delta":
				min_current = parseFloat(this._min);
				current = parseFloat(this.stateValue);
				max_current = parseFloat(this._max) + parseFloat(this._min);
				break;

			default:
				min_current = parseFloat(this._min);
				current = parseFloat(this.stateValue);
				max_current = parseFloat(this._max);
				break;
		}

		// PRIMARY
		if (this._primary_info === true) {
			var primaryStr = entityId;
			var friendly = state.attributes.friendly_name;
			if (state && typeof friendly != 'undefined') {
				primaryStr = friendly;
			}
			this.primaryInfo.innerHTML = primaryStr;
		} else if (this._primary_info === false || this._primary_info === null) {
			this.primaryInfo.remove();
		} else {
			this.primaryInfo.innerHTML = this._primary_info;
		}

		// SECONDARY
		this.um = state.attributes.unit_of_measurement;
		if (this._secondary_info === true) {
			var stateStr = '';
			if (this._max_type == 'duration') {
				stateStr = `${min_currentD.toLocaleDateString()} (next: ${max_currentD.toLocaleDateString()})`;
			} else if (this._max_type == 'delta') {
				stateStr = `${this._min} ${state.attributes.unit_of_measurement} (next: ${parseFloat(this._min) + this._max} ${state.attributes.unit_of_measurement})`;
			} else {
				stateStr = state ? this.stateValue : "unavailable";

				if (state && typeof this.um != 'undefined' && this.um.length > 0) {
					stateStr = `${stateStr} ${state.attributes.unit_of_measurement}`;
				}
			}

			this.secondaryInfo.innerHTML = stateStr;
		} else if (this._secondary_info === false || this._secondary_info === null) {
			this.secondaryInfo.remove();
		} else if (this._secondary_info.trim().substring(0, 3) === '[[[' && this._secondary_info.trim().slice(-3) === ']]]') {
			var trimmed = this._secondary_info.trim();
			this.secondaryInfo.innerHTML = this._evalTemplate(hass, trimmed.slice(3, -3));
		} else {
			this.secondaryInfo.innerHTML = value;
		}

		// PERCENTAGE
		var percState = 0;
		if (current == 'on') {
			percState = 1;
		} else if (!isNaN(current)) {
			percState = (1 / (max_current - min_current)) * (current - min_current)
		}

		if (this._inverse) {
			percState = 1 - percState;
		}

		// bars colouring
		for (var i = 0; i < this._bars; i++) {
			var percBar = 1 / this._bars * i;

			var color;
			if (((!this._inverse && percState >= 1) || this._inverse && percState <= 0) && this._color_max != null) {
				color = this._color_max;
			} else if (((!this._inverse && percState <= 0) || this._inverse && percState >= 1) && this._color_min != null) {
				color = this._color_max;
			} else if (percState > percBar) {
				color = this._bars_colors[i];
			} else {
				color = this._color_off
			}
			this.bars[i].style.backgroundColor = color;
		}

	}

	_evalTemplate(hass, func) {
		return Function(
			'states',
			func
		).call(
			this,
			hass.states
		);
	}

	// The user supplied configuration. Throw an exception and Home Assistant
	// will render an error card.
	setConfig(config) {
		if (!config.entity) {
			throw new Error("You need to define an entity");
		}
		this.config = config;

		if (typeof config.primary_info != 'undefined') {
			this._primary_info = config.primary_info;
		}
		if (typeof config.secondary_info != 'undefined') {
			this._secondary_info = config.secondary_info;
		}

		if (config.bars) {
			if (isNaN(config.bars)) {
				throw new Error("Bars option must be a number");
			} else if (config.bars < 0) {
				throw new Error("Bars option must be positive");
			}
			this._bars = config.bars;
		}
		if (config.min) {
			this._min = config.min;

			if (isNaN(this._min)) {
				if (this._min.trim().substring(0, 3) === '[[[' && this._min.trim().slice(-3) === ']]]') {
					; // will check during init
				} else {
					throw new Error("Min option must be a number");
				}
			} else if (this._min < 0) {
				throw new Error("Min option must be positive");
			}
		}
		if (config.max) {
			if (isNaN(config.max)) {
				throw new Error("Max option must be a number");
			} else if (config.max < this._min) {
				throw new Error("Max option must be greater than Min (" + this._min + ")");
			} else if (config.max < 0) {
				throw new Error("Max option must be positive");
			}
			this._max = config.max;
		}
		if (config.max_type) {
			if (["absolute", "duration", "delta"].indexOf(config.max_type) == -1) {
				throw new Error("Max type option must be 'absolute', 'duration' or 'delta'");
			}
			this._max_type = config.max_type;
		}
		if (config.max_span) {
			if (["s", "m", "h", "d", "w", "mo"].indexOf(config.max_span) == -1) {
				throw new Error("Max span option must be 's', 'm', 'h', 'd', 'w' or 'mo'");
			}
			this._max_span = config.max_span;
		}

		if (config.inverse) {
			if (config.inverse !== false && config.inverse !== true) {
				throw new Error("Inverse option must be true or false");
			}
			this._inverse = config.inverse;
		}


		if (config.bars_height) {
			if (isNaN(config.bars_height)) {
				throw new Error("Bars height option must be a number");
			} else if (config.bars_height < 0) {
				throw new Error("Bars height option must be positive");
			}
			this._bars_height = config.bars_height;
		}
		if (config.bars_margin) {
			if (isNaN(config.bars_margin)) {
				throw new Error("Bars margin option must be a number");
			} else if (config.bars_margin < 0) {
				throw new Error("Bars margin option must be positive");
			}
			this._bars_margin = config.bars_margin;
		}

		if (config.colors) {
			this._colors = config.colors;
			if (typeof this._colors == 'string') {
				this._colors = [this._colors];
			}
			for (i in this._colors) {
				if (this._colors[i].substring(0, 1) != '#') {
					throw new Error("Only hex colors are allowed in the Colors option");
				}
			}
		}
		if (config.color_off) {
			this._color_off = config.color_off;
		}
		if (config.color_min) {
			this._color_min = config.color_min;
		}
		if (config.color_max) {
			this._color_max = config.color_max;
		}

		// define colors
		if (this._colors.length == 1) {
			for (var i = 0; i < this._bars; i++) {
				this._bars_colors.push(this._colors[0]);
			}
		} else {
			this._bars_colors = this._generateGradientColors(this._colors, this._bars);
		}

		// define actions
		var acts = ['tap_action', 'hold_action', 'double_tap_action'];
		for (var act in acts) {
			if (config[acts[act]]) {
				this[`_${acts[act]}`] = config[acts[act]];
				var action = this[`_${acts[act]}`];
				var action_readable = acts[act].replace(/_/g, ' ');
				switch (action.action) {
					case 'call-service':
						if (typeof action.service == 'undefined') {
							throw new Error(`Invalid ${action_readable} option. 'Service' key not found.`);
						}
						break;

					default:
						throw new Error(`Action not valid in ${action_readable} option. Must be 'call-service'`);
						break;
				}
			}
		}
	}

	// The height of your card. Home Assistant uses this to automatically
	// distribute all cards over the available columns.
	getCardSize() {
		return 3;
	}

	// Funzione per convertire un colore da formato hex a RGB
	_hexToRgb(hex) {
		const bigint = parseInt(hex.slice(1), 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return [r, g, b];
	}

	// Funzione per convertire un colore da RGB a formato hex
	_rgbToHex(r, g, b) {
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
	}

	// Funzione per interpolare tra due colori
	_lerpColor(color1, color2, t) {
		const [r1, g1, b1] = this._hexToRgb(color1);
		const [r2, g2, b2] = this._hexToRgb(color2);

		const r = Math.round(r1 + (r2 - r1) * t);
		const g = Math.round(g1 + (g2 - g1) * t);
		const b = Math.round(b1 + (b2 - b1) * t);

		return this._rgbToHex(r, g, b);
	}

	// Funzione principale per generare un array di colori basato sul gradiente
	_generateGradientColors(colors, m) {
		const result = [];
		const segments = colors.length - 1;
		const colorsPerSegment = Math.floor(m / segments);
		const remainder = m % segments;

		for (let i = 0; i < segments; i++) {
			const startColor = colors[i];
			const endColor = colors[i + 1];
			const segmentColors = i < remainder ? colorsPerSegment + 1 : colorsPerSegment;

			for (let j = 0; j < segmentColors; j++) {
				const t = j / (segmentColors - 1);
				result.push(this._lerpColor(startColor, endColor, t));
			}
		}

		return result;
	}


	_on_tap_action() {
		if (this._tap_action) {
			this._do_action(this._tap_action);
		}
	}

	_on_hold_action() {
		if (this._hold_action) {
			this._do_action(this._hold_action);
		}
	}

	_on_double_tap_action() {
		if (this._double_tap_action) {
			this._do_action(this._double_tap_action);
		}
	}

	_do_action(action) {
		var valid = true;
		if (typeof action.confirmation != 'undefined') {
			valid = confirm(action.confirmation);
		}

		if (valid) {
			switch (action.action) {
				case 'call-service':
					var data = {}
					if (typeof action.data != 'undefined') {
						data = action.data;
					}
					var spl = action.service.split('.');
					this._hass.callService(spl[0], spl[1], data);
					break;

				default:
					break;
			}
		}
	}
}

customElements.define("fsg-bars", FsgBars);

console.info(
	`%c fsg-bars | Version 1.0 `,
	"color: white; font-weight: bold; background: #EE4266"
);

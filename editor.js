const STORAGE_KEY = "mountains.layers";

const DEFAULT_LAYERS = [
  {
    seed: 23.1,
    frequency: 0.82,
    amplitude: 0.63,
    detail: 0.46,
    yOffset: 0,
    color: [0.4667, 0.6235, 0.651, 1],
  },
  {
    seed: 76.5,
    frequency: 2.25,
    amplitude: 0.85,
    detail: 0.13,
    yOffset: 0,
    color: [0.2549, 0.4196, 0.4549, 1],
  },
  {
    seed: 108.5,
    frequency: 3.5,
    amplitude: 0.42,
    detail: 0.22,
    yOffset: -0.15,
    color: [0.2, 0.2392, 0.302, 1],
  },
];

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeLayer(rawLayer, fallbackExpanded = true) {
  const layer = rawLayer || {};
  const color = Array.isArray(layer.color) ? layer.color : [1, 1, 1, 1];

  return {
    seed: Number.isFinite(layer.seed) ? layer.seed : 0,
    frequency: Number.isFinite(layer.frequency) ? layer.frequency : 1,
    amplitude: Number.isFinite(layer.amplitude) ? layer.amplitude : 0.25,
    detail: Number.isFinite(layer.detail) ? layer.detail : 0.05,
    yOffset: Number.isFinite(layer.yOffset) ? layer.yOffset : 0,
    color: [
      clamp(Number(color[0]) || 0, 0, 1),
      clamp(Number(color[1]) || 0, 0, 1),
      clamp(Number(color[2]) || 0, 0, 1),
      clamp(Number(color[3]) || 0, 0, 1),
    ],
    isExpanded:
      typeof layer.isExpanded === "boolean"
        ? layer.isExpanded
        : fallbackExpanded,
  };
}

function cloneLayers(rawLayers, fallbackExpanded = true) {
  return rawLayers.map((layer) => sanitizeLayer(layer, fallbackExpanded));
}

function layersForStorage(rawLayers) {
  return rawLayers.map((layer) => ({
    seed: layer.seed,
    frequency: layer.frequency,
    amplitude: layer.amplitude,
    detail: layer.detail,
    yOffset: layer.yOffset,
    color: [...layer.color],
    isExpanded: layer.isExpanded,
  }));
}

function layersToJsArrayString(rawLayers) {
  const lines = rawLayers.map((layer) => {
    const color = layer.color.map((channel) => Number(channel.toFixed(4)));
    return [
      "  {",
      `    seed: ${Number(layer.seed.toFixed(4))},`,
      `    frequency: ${Number(layer.frequency.toFixed(4))},`,
      `    amplitude: ${Number(layer.amplitude.toFixed(4))},`,
      `    detail: ${Number(layer.detail.toFixed(4))},`,
      `    yOffset: ${Number(layer.yOffset.toFixed(4))},`,
      `    color: [${color.join(", ")}],`,
      "  },",
    ].join("\n");
  });

  return `[\n${lines.join("\n")}\n]`;
}

function loadLayers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return cloneLayers(DEFAULT_LAYERS, true);
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return cloneLayers(DEFAULT_LAYERS, true);
    }

    return cloneLayers(parsed, true);
  } catch {
    return cloneLayers(DEFAULT_LAYERS, true);
  }
}

function saveLayers(rawLayers) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(layersForStorage(rawLayers)),
    );
  } catch {
    // Ignore storage errors to keep editing functional.
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

const layers = loadLayers();

const LAYER_FIELDS = [
  { key: "seed", label: "Seed", step: 0.1 },
  { key: "frequency", label: "Frequency", step: 0.01 },
  { key: "amplitude", label: "Amplitude", step: 0.01 },
  { key: "detail", label: "Detail", step: 0.01 },
  { key: "yOffset", label: "YOffset", step: 0.01 },
];

function channelToHex(value) {
  const channel = Math.round(clamp(value, 0, 1) * 255);
  return channel.toString(16).padStart(2, "0");
}

function colorToHex(color) {
  return `#${channelToHex(color[0])}${channelToHex(color[1])}${channelToHex(color[2])}${channelToHex(color[3])}`;
}

function hexToColor(hex, prevColor) {
  const cleanHex = hex.trim().replace(/^#/, "");
  const isRgb = /^[0-9a-fA-F]{6}$/.test(cleanHex);
  const isRgba = /^[0-9a-fA-F]{8}$/.test(cleanHex);

  if (!isRgb && !isRgba) {
    return null;
  }

  const r = Number.parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(cleanHex.slice(4, 6), 16) / 255;
  const a = isRgba
    ? Number.parseInt(cleanHex.slice(6, 8), 16) / 255
    : prevColor[3];

  return [r, g, b, a];
}

function createDefaultLayer(index) {
  const depth = clamp(index / 6, 0, 1);
  const nearDepth = 1 - depth;

  const r = lerp(0.66, 0.16, depth);
  const g = lerp(0.72, 0.2, depth);
  const b = lerp(0.8, 0.27, depth);
  const alpha = lerp(0.62, 0.95, depth);

  return {
    seed: Math.random() * 200,
    frequency: 0.4 + nearDepth * 0.75,
    amplitude: 0.16 + nearDepth * 0.22,
    detail: 0.02 + nearDepth * 0.06,
    yOffset: 0.44 - nearDepth * 0.34,
    color: [r, g, b, alpha],
  };
}

function moveItem(array, fromIndex, toIndex) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= array.length ||
    toIndex >= array.length ||
    fromIndex === toIndex
  ) {
    return;
  }

  const [item] = array.splice(fromIndex, 1);
  array.splice(toIndex, 0, item);
}

window.layers = layers;

document.addEventListener("DOMContentLoaded", () => {
  const layerListEl = document.querySelector("#layerList");
  const addLayerButtonEl = document.querySelector("#addLayerButton");
  const resetLayersButtonEl = document.querySelector("#resetLayersButton");
  const exportLayersButtonEl = document.querySelector("#exportLayersButton");

  layers.forEach((layer) => {
    layer.isExpanded = layer.isExpanded ?? true;
  });

  function renderLayerEditor() {
    if (!layerListEl) {
      return;
    }

    layerListEl.innerHTML = "";

    layers.forEach((layer, layerIndex) => {
      const layerCard = document.createElement("details");
      layerCard.className = "layer-card";
      layerCard.open = layer.isExpanded !== false;

      layerCard.addEventListener("toggle", () => {
        layer.isExpanded = layerCard.open;
        saveLayers(layers);
      });

      const topRow = document.createElement("summary");
      topRow.className = "layer-row";

      const title = document.createElement("strong");
      title.textContent = `Layer ${layerIndex + 1}`;

      const actions = document.createElement("div");
      actions.className = "layer-actions";

      const upButton = document.createElement("button");
      upButton.type = "button";
      upButton.textContent = "Up";
      upButton.disabled = layerIndex === 0;
      upButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        moveItem(layers, layerIndex, layerIndex - 1);
        saveLayers(layers);
        renderLayerEditor();
      });

      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.textContent = "Down";
      downButton.disabled = layerIndex === layers.length - 1;
      downButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        moveItem(layers, layerIndex, layerIndex + 1);
        saveLayers(layers);
        renderLayerEditor();
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        layers.splice(layerIndex, 1);
        saveLayers(layers);
        renderLayerEditor();
      });

      actions.append(upButton, downButton, deleteButton);
      topRow.append(title, actions);

      const fieldsGrid = document.createElement("div");
      fieldsGrid.className = "layer-fields";

      for (const field of LAYER_FIELDS) {
        const fieldWrap = document.createElement("label");
        fieldWrap.className = "layer-field";
        fieldWrap.textContent = field.label;

        const input = document.createElement("input");
        input.type = "number";
        input.step = String(field.step);
        input.value = String(layer[field.key]);

        input.addEventListener("input", () => {
          const value = Number.parseFloat(input.value);
          if (!Number.isNaN(value)) {
            layer[field.key] = value;
            saveLayers(layers);
          }
        });

        fieldWrap.appendChild(input);
        fieldsGrid.appendChild(fieldWrap);
      }

      const colorFieldWrap = document.createElement("label");
      colorFieldWrap.className = "layer-field";
      colorFieldWrap.textContent = "Color Hex";

      const colorInput = document.createElement("input");
      colorInput.type = "text";
      colorInput.placeholder = "#RRGGBBAA";
      colorInput.value = colorToHex(layer.color);

      colorInput.addEventListener("change", () => {
        const nextColor = hexToColor(colorInput.value, layer.color);
        if (nextColor) {
          layer.color = nextColor;
          colorInput.value = colorToHex(layer.color);
          saveLayers(layers);
        } else {
          colorInput.value = colorToHex(layer.color);
        }
      });

      colorFieldWrap.appendChild(colorInput);
      fieldsGrid.appendChild(colorFieldWrap);

      layerCard.append(topRow, fieldsGrid);
      layerListEl.appendChild(layerCard);
    });
  }

  if (addLayerButtonEl) {
    addLayerButtonEl.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      layers.push(createDefaultLayer(layers.length));
      saveLayers(layers);
      renderLayerEditor();
    });
  }

  if (resetLayersButtonEl) {
    resetLayersButtonEl.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      layers.splice(0, layers.length, ...cloneLayers(DEFAULT_LAYERS, true));
      saveLayers(layers);
      renderLayerEditor();
    });
  }

  if (exportLayersButtonEl) {
    exportLayersButtonEl.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const text = layersToJsArrayString(layers);
      try {
        await copyTextToClipboard(text);
        exportLayersButtonEl.textContent = "Copied";
      } catch {
        exportLayersButtonEl.textContent = "Failed";
      }

      window.setTimeout(() => {
        exportLayersButtonEl.textContent = "Export";
      }, 1200);
    });
  }

  renderLayerEditor();
  saveLayers(layers);
});

const STORAGE_KEY = "mountains.layerGroups";
const PROFILE_ORDER = ["desktop", "tablet", "mobile"];
const BREAKPOINTS = { mobile: 768, tablet: 1024 };

const DEFAULT_CLOUD_SETTINGS = {
  freq: 1.2,
  amp: 1.05,
  speedX: 0.12,
  speedY: 0.08,
  sky: [0.4, 0.7, 0.9],
  clouds: [1, 1, 1],
};

const DEFAULT_LAYER_GROUPS = {
  desktop: {
    layers: [
      {
        seed: 23.1,
        frequency: 0.82,
        amplitude: 0.63,
        detail: 0.46,
        yOffset: 0,
        atmosphereStart: 0.8,
        atmosphereStrength: 0.08,
        color: [0.4667, 0.6235, 0.651, 1],
      },
      {
        seed: 76.5,
        frequency: 2.25,
        amplitude: 0.85,
        detail: 0.13,
        yOffset: 0,
        atmosphereStart: 0.72,
        atmosphereStrength: 0.12,
        color: [0.2549, 0.4196, 0.4549, 1],
      },
      {
        seed: 108.5,
        frequency: 3.5,
        amplitude: 0.42,
        detail: 0.22,
        yOffset: -0.15,
        atmosphereStart: 0.68,
        atmosphereStrength: 0.15,
        color: [0.2, 0.2392, 0.302, 1],
      },
    ],
    clouds: {
      freq: 1.2,
      amp: 1.05,
      speedX: 0.12,
      speedY: 0.08,
      sky: [0.4, 0.7, 0.9],
      clouds: [1, 1, 1],
    },
  },
  tablet: {
    layers: [
      {
        seed: 31.2,
        frequency: 1.1,
        amplitude: 0.58,
        detail: 0.18,
        yOffset: 0.05,
        atmosphereStart: 0.76,
        atmosphereStrength: 0.11,
        color: [0.36, 0.48, 0.52, 1],
      },
      {
        seed: 92.4,
        frequency: 2.8,
        amplitude: 0.7,
        detail: 0.12,
        yOffset: -0.08,
        atmosphereStart: 0.7,
        atmosphereStrength: 0.14,
        color: [0.2, 0.35, 0.42, 1],
      },
    ],
    clouds: {
      freq: 1.1,
      amp: 1.0,
      speedX: 0.18,
      speedY: 0.1,
      sky: [0.43, 0.72, 0.88],
      clouds: [0.9, 0.95, 1],
    },
  },
  mobile: {
    layers: [
      {
        seed: 42.7,
        frequency: 1.4,
        amplitude: 0.52,
        detail: 0.16,
        yOffset: 0.12,
        atmosphereStart: 0.72,
        atmosphereStrength: 0.13,
        color: [0.3, 0.41, 0.48, 1],
      },
      {
        seed: 118.9,
        frequency: 3.6,
        amplitude: 0.8,
        detail: 0.24,
        yOffset: -0.12,
        atmosphereStart: 0.66,
        atmosphereStrength: 0.16,
        color: [0.14, 0.22, 0.28, 1],
      },
    ],
    clouds: {
      freq: 1.45,
      amp: 1.2,
      speedX: 0.2,
      speedY: 0.12,
      sky: [0.38, 0.66, 0.8],
      clouds: [1, 1, 1],
    },
  },
};

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
    atmosphereStart: Number.isFinite(layer.atmosphereStart)
      ? layer.atmosphereStart
      : 0.75,
    atmosphereStrength: Number.isFinite(layer.atmosphereStrength)
      ? layer.atmosphereStrength
      : 0.1,
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
    atmosphereStart: layer.atmosphereStart,
    atmosphereStrength: layer.atmosphereStrength,
    color: [...layer.color],
    isExpanded: layer.isExpanded,
  }));
}

function formatLayerEntry(layer) {
  const color = layer.color.map((channel) => Number(channel.toFixed(4)));
  return [
    "    {",
    `      seed: ${Number(layer.seed.toFixed(4))},`,
    `      frequency: ${Number(layer.frequency.toFixed(4))},`,
    `      amplitude: ${Number(layer.amplitude.toFixed(4))},`,
    `      detail: ${Number(layer.detail.toFixed(4))},`,
    `      yOffset: ${Number(layer.yOffset.toFixed(4))},`,
    `      atmosphereStart: ${Number(layer.atmosphereStart.toFixed(4))},`,
    `      atmosphereStrength: ${Number(layer.atmosphereStrength.toFixed(4))},`,
    `      color: [${color.join(", ")}],`,
    "    },",
  ].join("\n");
}

function sanitizeCloudSettings(rawSettings = {}) {
  const settings = rawSettings || {};
  const sky = Array.isArray(settings.sky)
    ? settings.sky
    : DEFAULT_CLOUD_SETTINGS.sky;
  const clouds = Array.isArray(settings.clouds)
    ? settings.clouds
    : DEFAULT_CLOUD_SETTINGS.clouds;

  return {
    freq: Number.isFinite(settings.freq)
      ? settings.freq
      : DEFAULT_CLOUD_SETTINGS.freq,
    amp: Number.isFinite(settings.amp)
      ? settings.amp
      : DEFAULT_CLOUD_SETTINGS.amp,
    speedX: Number.isFinite(settings.speedX)
      ? settings.speedX
      : DEFAULT_CLOUD_SETTINGS.speedX,
    speedY: Number.isFinite(settings.speedY)
      ? settings.speedY
      : DEFAULT_CLOUD_SETTINGS.speedY,
    sky: [
      clamp(Number(sky[0]) || 0, 0, 1),
      clamp(Number(sky[1]) || 0, 0, 1),
      clamp(Number(sky[2]) || 0, 0, 1),
    ],
    clouds: [
      clamp(Number(clouds[0]) || 0, 0, 1),
      clamp(Number(clouds[1]) || 0, 0, 1),
      clamp(Number(clouds[2]) || 0, 0, 1),
    ],
  };
}

function sanitizeConfigGroup(rawGroup = {}) {
  const group = rawGroup || {};
  const layers = Array.isArray(group.layers) ? group.layers : [];
  return {
    layers: cloneLayers(layers, true),
    clouds: sanitizeCloudSettings(group.clouds),
  };
}

function getDefaultGroups() {
  return Object.fromEntries(
    PROFILE_ORDER.map((profile) => [
      profile,
      {
        layers: cloneLayers(DEFAULT_LAYER_GROUPS[profile].layers, true),
        clouds: sanitizeCloudSettings(DEFAULT_LAYER_GROUPS[profile].clouds),
      },
    ]),
  );
}

function cloudSettingsToJsObjectString(cloudSettings, indent = "  ") {
  const sky = cloudSettings.sky.map((channel) => Number(channel.toFixed(4)));
  const clouds = cloudSettings.clouds.map((channel) => Number(channel.toFixed(4)));

  return [
    `${indent}clouds: {`,
    `${indent}  freq: ${Number(cloudSettings.freq.toFixed(4))},`,
    `${indent}  amp: ${Number(cloudSettings.amp.toFixed(4))},`,
    `${indent}  speedX: ${Number(cloudSettings.speedX.toFixed(4))},`,
    `${indent}  speedY: ${Number(cloudSettings.speedY.toFixed(4))},`,
    `${indent}  sky: [${sky.join(", ")}],`,
    `${indent}  clouds: [${clouds.join(", ")}],`,
    `${indent}},`,
  ].join("\n");
}

function layersToJsObjectString(rawGroups) {
  const sections = PROFILE_ORDER.map((profile) => {
    const group = sanitizeConfigGroup(rawGroups[profile]);
    const entries = group.layers.map((layer) => formatLayerEntry(layer));
    return [
      `  ${profile}: {`,
      "    layers: [",
      entries.join("\n"),
      "    ],",
      cloudSettingsToJsObjectString(group.clouds, "    "),
      "  },",
    ].join("\n");
  });

  return `{
${sections.join("\n")}
}`;
}

function getProfileName(width = window.innerWidth) {
  if (width < BREAKPOINTS.mobile) {
    return "mobile";
  }
  if (width < BREAKPOINTS.tablet) {
    return "tablet";
  }
  return "desktop";
}

function loadLayerGroups() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultGroups();
    }

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      return getDefaultGroups();
    }

    const nextGroups = getDefaultGroups();
    for (const profile of PROFILE_ORDER) {
      nextGroups[profile] = sanitizeConfigGroup(parsed[profile] || nextGroups[profile]);
    }

    return nextGroups;
  } catch {
    return getDefaultGroups();
  }
}

function saveLayerGroups(rawGroups) {
  try {
    const serialized = {};
    for (const profile of PROFILE_ORDER) {
      const group = sanitizeConfigGroup(rawGroups[profile] || { layers: [], clouds: {} });
      serialized[profile] = {
        layers: layersForStorage(group.layers || []),
        clouds: sanitizeCloudSettings(group.clouds),
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
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

const layerGroups = loadLayerGroups();
const currentProfile = () => getProfileName(window.innerWidth);
const getActiveConfig = () => {
  const profile = currentProfile();
  return layerGroups[profile] || layerGroups.desktop;
};
const getActiveLayers = () => getActiveConfig().layers || [];
const getActiveCloudSettings = () => getActiveConfig().clouds || sanitizeCloudSettings();
window.layers = getActiveLayers();
window.getActiveLayers = getActiveLayers;
window.getActiveCloudSettings = getActiveCloudSettings;
window.getProfileName = getProfileName;
window.layerGroups = layerGroups;
window.cloudSettings = getActiveCloudSettings();
window.getActiveConfig = getActiveConfig;

const LAYER_FIELDS = [
  { key: "seed", label: "Seed", step: 0.1 },
  { key: "frequency", label: "Frequency", step: 0.01 },
  { key: "amplitude", label: "Amplitude", step: 0.01 },
  { key: "detail", label: "Detail", step: 0.01 },
  { key: "yOffset", label: "YOffset", step: 0.01 },
  { key: "atmosphereStart", label: "Atm Start", step: 0.01 },
  { key: "atmosphereStrength", label: "Atm Strength", step: 0.01 },
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

document.addEventListener("DOMContentLoaded", () => {
  const layerListEl = document.querySelector("#layerList");
  const addLayerButtonEl = document.querySelector("#addLayerButton");
  const resetLayersButtonEl = document.querySelector("#resetLayersButton");
  const exportLayersButtonEl = document.querySelector("#exportLayersButton");
  const profileLabelEl = document.querySelector("#profileLabel");

  function updateProfileLabel() {
    if (!profileLabelEl) {
      return;
    }

    profileLabelEl.textContent = currentProfile();
  }

  function refreshActiveLayers() {
    const activeConfig = getActiveConfig();
    const activeLayers = activeConfig.layers || [];
    window.layers = activeLayers;
    window.cloudSettings = activeConfig.clouds || sanitizeCloudSettings();
    updateProfileLabel();
    return activeLayers;
  }

  for (const profile of PROFILE_ORDER) {
    for (const layer of layerGroups[profile].layers) {
      layer.isExpanded = layer.isExpanded ?? true;
    }
  }

  function renderLayerEditor() {
    if (!layerListEl) {
      return;
    }

    updateProfileLabel();

    const activeConfig = getActiveConfig();
    const activeLayers = activeConfig.layers || [];
    const cloudSettings = activeConfig.clouds || sanitizeCloudSettings();
    layerListEl.innerHTML = "";

    activeLayers.forEach((layer, layerIndex) => {
      const layerCard = document.createElement("details");
      layerCard.className = "layer-card";
      layerCard.open = layer.isExpanded !== false;

      layerCard.addEventListener("toggle", () => {
        layer.isExpanded = layerCard.open;
        saveLayerGroups(layerGroups);
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
        moveItem(activeLayers, layerIndex, layerIndex - 1);
        saveLayerGroups(layerGroups);
        renderLayerEditor();
      });

      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.textContent = "Down";
      downButton.disabled = layerIndex === activeLayers.length - 1;
      downButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        moveItem(activeLayers, layerIndex, layerIndex + 1);
        saveLayerGroups(layerGroups);
        renderLayerEditor();
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        activeLayers.splice(layerIndex, 1);
        saveLayerGroups(layerGroups);
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
            saveLayerGroups(layerGroups);
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
          saveLayerGroups(layerGroups);
        } else {
          colorInput.value = colorToHex(layer.color);
        }
      });

      colorFieldWrap.appendChild(colorInput);
      fieldsGrid.appendChild(colorFieldWrap);

      layerCard.append(topRow, fieldsGrid);
      layerListEl.appendChild(layerCard);
    });

    const cloudCard = document.createElement("div");
    cloudCard.className = "cloud-card";

    const cloudHeader = document.createElement("h3");
    cloudHeader.textContent = "Clouds";

    const cloudFields = document.createElement("div");
    cloudFields.className = "layer-fields";

    const cloudFreqField = document.createElement("label");
    cloudFreqField.className = "layer-field";
    cloudFreqField.textContent = "Freq";
    const cloudFreqInput = document.createElement("input");
    cloudFreqInput.type = "number";
    cloudFreqInput.step = "0.01";
    cloudFreqInput.value = String(cloudSettings.freq);
    cloudFreqInput.addEventListener("input", () => {
      const value = Number.parseFloat(cloudFreqInput.value);
      if (!Number.isNaN(value)) {
        cloudSettings.freq = value;
        saveLayerGroups(layerGroups);
        window.cloudSettings = cloudSettings;
      }
    });
    cloudFreqField.appendChild(cloudFreqInput);

    const cloudAmpField = document.createElement("label");
    cloudAmpField.className = "layer-field";
    cloudAmpField.textContent = "Amp";
    const cloudAmpInput = document.createElement("input");
    cloudAmpInput.type = "number";
    cloudAmpInput.step = "0.01";
    cloudAmpInput.value = String(cloudSettings.amp);
    cloudAmpInput.addEventListener("input", () => {
      const value = Number.parseFloat(cloudAmpInput.value);
      if (!Number.isNaN(value)) {
        cloudSettings.amp = value;
        saveLayerGroups(layerGroups);
        window.cloudSettings = cloudSettings;
      }
    });
    cloudAmpField.appendChild(cloudAmpInput);

    const cloudSpeedXField = document.createElement("label");
    cloudSpeedXField.className = "layer-field";
    cloudSpeedXField.textContent = "Speed X";
    const cloudSpeedXInput = document.createElement("input");
    cloudSpeedXInput.type = "number";
    cloudSpeedXInput.step = "0.01";
    cloudSpeedXInput.value = String(cloudSettings.speedX);
    cloudSpeedXInput.addEventListener("input", () => {
      const value = Number.parseFloat(cloudSpeedXInput.value);
      if (!Number.isNaN(value)) {
        cloudSettings.speedX = value;
        saveLayerGroups(layerGroups);
        window.cloudSettings = cloudSettings;
      }
    });
    cloudSpeedXField.appendChild(cloudSpeedXInput);

    const cloudSpeedYField = document.createElement("label");
    cloudSpeedYField.className = "layer-field";
    cloudSpeedYField.textContent = "Speed Y";
    const cloudSpeedYInput = document.createElement("input");
    cloudSpeedYInput.type = "number";
    cloudSpeedYInput.step = "0.01";
    cloudSpeedYInput.value = String(cloudSettings.speedY);
    cloudSpeedYInput.addEventListener("input", () => {
      const value = Number.parseFloat(cloudSpeedYInput.value);
      if (!Number.isNaN(value)) {
        cloudSettings.speedY = value;
        saveLayerGroups(layerGroups);
        window.cloudSettings = cloudSettings;
      }
    });
    cloudSpeedYField.appendChild(cloudSpeedYInput);

    const skyColorField = document.createElement("label");
    skyColorField.className = "layer-field";
    skyColorField.textContent = "Sky Hex";
    const skyColorInput = document.createElement("input");
    skyColorInput.type = "text";
    skyColorInput.placeholder = "#RRGGBB";
    skyColorInput.value = colorToHex([
      cloudSettings.sky[0],
      cloudSettings.sky[1],
      cloudSettings.sky[2],
      1,
    ]);
    skyColorInput.addEventListener("change", () => {
      const nextColor = hexToColor(skyColorInput.value, [
        cloudSettings.sky[0],
        cloudSettings.sky[1],
        cloudSettings.sky[2],
        1,
      ]);
      if (nextColor) {
        cloudSettings.sky = nextColor.slice(0, 3);
        skyColorInput.value = colorToHex([
          cloudSettings.sky[0],
          cloudSettings.sky[1],
          cloudSettings.sky[2],
          1,
        ]);
        saveLayerGroups(layerGroups);
        window.cloudSettings = cloudSettings;
      } else {
        skyColorInput.value = colorToHex([
          cloudSettings.sky[0],
          cloudSettings.sky[1],
          cloudSettings.sky[2],
          1,
        ]);
      }
    });
    skyColorField.appendChild(skyColorInput);

    const cloudColorField = document.createElement("label");
    cloudColorField.className = "layer-field";
    cloudColorField.textContent = "Cloud Hex";
    const cloudColorInput = document.createElement("input");
    cloudColorInput.type = "text";
    cloudColorInput.placeholder = "#RRGGBB";
    cloudColorInput.value = colorToHex([
      cloudSettings.clouds[0],
      cloudSettings.clouds[1],
      cloudSettings.clouds[2],
      1,
    ]);
    cloudColorInput.addEventListener("change", () => {
      const nextColor = hexToColor(cloudColorInput.value, [
        cloudSettings.clouds[0],
        cloudSettings.clouds[1],
        cloudSettings.clouds[2],
        1,
      ]);
      if (nextColor) {
        cloudSettings.clouds = nextColor.slice(0, 3);
        cloudColorInput.value = colorToHex([
          cloudSettings.clouds[0],
          cloudSettings.clouds[1],
          cloudSettings.clouds[2],
          1,
        ]);
        saveLayerGroups(layerGroups);
        window.cloudSettings = cloudSettings;
      } else {
        cloudColorInput.value = colorToHex([
          cloudSettings.clouds[0],
          cloudSettings.clouds[1],
          cloudSettings.clouds[2],
          1,
        ]);
      }
    });
    cloudColorField.appendChild(cloudColorInput);

    cloudFields.append(
      cloudFreqField,
      cloudAmpField,
      cloudSpeedXField,
      cloudSpeedYField,
      skyColorField,
      cloudColorField,
    );
    cloudCard.append(cloudHeader, cloudFields);
    layerListEl.appendChild(cloudCard);
  }

  if (addLayerButtonEl) {
    addLayerButtonEl.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const activeLayers = getActiveLayers();
      activeLayers.push(createDefaultLayer(activeLayers.length));
      saveLayerGroups(layerGroups);
      renderLayerEditor();
    });
  }

  if (resetLayersButtonEl) {
    resetLayersButtonEl.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const profile = currentProfile();
      layerGroups[profile] = {
        layers: cloneLayers(DEFAULT_LAYER_GROUPS[profile].layers, true),
        clouds: sanitizeCloudSettings(DEFAULT_LAYER_GROUPS[profile].clouds),
      };
      saveLayerGroups(layerGroups);
      window.cloudSettings = layerGroups[profile].clouds;
      renderLayerEditor();
    });
  }

  if (exportLayersButtonEl) {
    exportLayersButtonEl.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const text = layersToJsObjectString(layerGroups);
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

  window.addEventListener("resize", () => {
    renderLayerEditor();
  });

  renderLayerEditor();
  saveLayerGroups(layerGroups);
});

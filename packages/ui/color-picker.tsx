/*
MIT License

Copyright (c) 2022 xbmlz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

https://github.com/xbmlz/solid-color
*/

import { each, debounce, merge } from "lodash-es";
import tinycolor from "tinycolor2";
import {
  type Accessor,
  type Context,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  Show,
  mergeProps,
  useContext,
  onCleanup,
} from "solid-js";

export interface EditableInputProps {
  styles: Record<string, JSX.CSSProperties>;
  value?: string | number;
  label?: string;
  hideLabel?: boolean;
  placeholder?: string;
  arrowOffset?: number;
  dragLabel?: boolean;
  dragMax?: number;
  onChange?: (value: any, e: Event) => void;
}

interface EditableInputState {
  value: string;
  blurValue: string;
  borderColor?: string;
}

interface Props {
  view?: "hex" | "rgb" | "hsl";
  onChange: (data: ChangeColor, event: Event) => void;
  rgb: RgbColor;
  hsl: HslColor;
  hex: HexColor;
  disableAlpha?: boolean;
}

interface IconProps {
  width?: number | string;
  height?: number | string;
  fill?: string;
  stroke?: string;
  onMouseOver?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseOut?: (e: MouseEvent) => void;
}

export type SaturationProps = {
  hsl: HslColor;
  hsv: HsvColor;
  pointer?: JSX.Element;
  onChange?: (color: ChangeColor, event?: Event) => void;
  shadow?: JSX.CSSProperties["box-shadow"];
  radius?: JSX.CSSProperties["border-radius"];
  styles?: Record<string, JSX.CSSProperties>;
};

interface HueProps {
  children?: JSX.Element;
  direction?: string;
  radius?: number | string;
  shadow?: string;
  hsl: HslColor;
  styles?: Record<string, JSX.CSSProperties>;
  pointer?: <T extends object>(props: T) => JSX.Element;
  onChange?: (data: HslColor, e: MouseEvent) => void;
}

export interface ColorPickerContextType {
  colors: Accessor<ColorResult>;
  changeColor: (color: ChangeColor, event?: Event) => void;
  onSwatchHover?: (color: ChangeColor, event: Event) => void;
}

export interface ColorPickerProps {
  children?: JSX.Element;
  defaultColor?: Color;
  color?: Color;
  onChange?: (color: ColorResult, event?: Event) => void;
  onChangeComplete?: (color: ColorResult) => void;
  onSwatchHover?: (color: ColorResult, event: Event) => void;
}

export interface AlphaProps {
  rgb: RgbColor;
  hsl: HslColor;
  renderers?: any;
  direction?: string;
  a?: number;
  radius?: number;
  shadow?: string;
  styles?: Record<string, JSX.CSSProperties>;
  pointer?: <T extends object>(props: T) => JSX.Element;
  onChange?: (data: any, e: Event) => void;
}

export type CheckboardProps = {
  size?: number;
  white?: string;
  grey?: string;
  renderers?: any;
  borderRadius?: string | number;
  boxShadow?: string;
  children?: JSX.Element;
};
export type HexColor = string;

export type HslColor = {
  h: number;
  l: number;
  s: number;
  a?: number;
};

export type HsvColor = {
  h: number;
  s: number;
  v: number;
  a?: number;
};

export type RgbColor = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

export type Color = HexColor | HslColor | HsvColor | RgbColor;

export type ColorResult = {
  hex: HexColor;
  hsl: HslColor;
  hsv: HsvColor;
  rgb: RgbColor;
  oldHue: number;
};

export type ChangeColor =
  | HslColor
  | HsvColor
  | (RgbColor & { source?: string })
  | { hex: HexColor; source: string }
  | HexColor;

export type Direction = "horizontal" | "vertical";

export interface ChromePickerProps {
  width?: string | number;
  disableAlpha?: boolean;
  styles?: Record<string, JSX.CSSProperties>;
  renderers?: any;
  className?: string;
  defaultView?: "hex" | "rgb" | "hsl";
}

export const calculateAlphaChange = (
  e: any,
  hsl: HslColor,
  direction: string,
  initialA: any,
  container: HTMLDivElement,
) => {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const x = typeof e.pageX === "number" ? e.pageX : e.touches[0].pageX;
  const y = typeof e.pageY === "number" ? e.pageY : e.touches[0].pageY;
  const left =
    x - (container.getBoundingClientRect().left + window.pageXOffset);
  const top = y - (container.getBoundingClientRect().top + window.pageYOffset);

  if (direction === "vertical") {
    let a;
    if (top < 0) {
      a = 0;
    } else if (top > containerHeight) {
      a = 1;
    } else {
      a = Math.round((top * 100) / containerHeight) / 100;
    }

    if (hsl.a !== a) {
      return {
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
        a,
        source: "rgb",
      };
    }
  } else {
    let a;
    if (left < 0) {
      a = 0;
    } else if (left > containerWidth) {
      a = 1;
    } else {
      a = Math.round((left * 100) / containerWidth) / 100;
    }

    if (initialA !== a) {
      return {
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
        a,
        source: "rgb",
      };
    }
  }
  return null;
};

const checkboardCache: { [key: string]: any } = {};

export const render = (
  c1: string,
  c2: string,
  size: number,
  serverCanvas: any,
) => {
  if (typeof document === "undefined" && !serverCanvas) {
    return null;
  }
  const canvas: HTMLCanvasElement = serverCanvas
    ? new serverCanvas()
    : document.createElement("canvas");
  canvas.width = size * 2;
  canvas.height = size * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  } // If no context can be found, return early.
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = c2;
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size, size);
  ctx.fillRect(0, 0, size, size);
  return canvas.toDataURL();
};

export const get = (
  c1: string,
  c2: string,
  size: number,
  serverCanvas: any,
) => {
  const key = `${c1}-${c2}-${size}${serverCanvas ? "-server" : ""}`;

  if (checkboardCache[key]) {
    return checkboardCache[key];
  }

  const checkboard = render(c1, c2, size, serverCanvas);
  checkboardCache[key] = checkboard;
  return checkboard;
};

export const simpleCheckForValidColor = (data: any) => {
  const keysToCheck = ["r", "g", "b", "a", "h", "s", "l", "v"];
  let checked = 0;
  let passed = 0;
  each(keysToCheck, (letter) => {
    if (data[letter]) {
      checked += 1;
      if (!Number.isNaN(data[letter])) {
        passed += 1;
      }
      if (letter === "s" || letter === "l") {
        const percentPatt = /^\d+%$/;
        if (percentPatt.test(data[letter])) {
          passed += 1;
        }
      }
    }
  });
  return checked === passed ? data : false;
};

export const toState = (data: any, oldHue?: number) => {
  const color = data.hex ? tinycolor(data.hex) : tinycolor(data);
  const hsl = color.toHsl();
  const hsv = color.toHsv();
  const rgb = color.toRgb();
  const hex = color.toHex();
  if (hsl.s === 0) {
    hsl.h = oldHue || 0;
    hsv.h = oldHue || 0;
  }
  const transparent = hex === "000000" && rgb.a === 0;

  return {
    hsl,
    hex: transparent ? "transparent" : `#${hex}`,
    rgb,
    hsv,
    oldHue: data.h || oldHue || hsl.h,
    source: data.source,
  };
};

export const isValidHex = (hex: any) => {
  if (hex === "transparent") {
    return true;
  }
  // disable hex4 and hex8
  const lh = String(hex).charAt(0) === "#" ? 1 : 0;
  return (
    hex.length !== 4 + lh && hex.length < 7 + lh && tinycolor(hex).isValid()
  );
};

export const getContrastingColor = (data: any) => {
  if (!data) {
    return "#fff";
  }
  const col = toState(data);
  if (col.hex === "transparent") {
    return "rgba(0,0,0,0.4)";
  }
  const yiq = (col.rgb.r * 299 + col.rgb.g * 587 + col.rgb.b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
};

export const red = {
  hsl: { a: 1, h: 0, l: 0.5, s: 1 },
  hex: "#ff0000",
  rgb: { r: 255, g: 0, b: 0, a: 1 },
  hsv: { h: 0, s: 1, v: 1, a: 1 },
};

export const isvalidColorString = (str: string, type: string) => {
  const stringWithoutDegree = str.replace("°", "");
  return tinycolor(`${type} (${stringWithoutDegree})`).isValid();
};

export const calculateHueChange = (
  e: any,
  direction: string,
  hsl: HslColor,
  container: HTMLDivElement,
) => {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const x = typeof e.pageX === "number" ? e.pageX : e.touches[0].pageX;
  const y = typeof e.pageY === "number" ? e.pageY : e.touches[0].pageY;
  const left =
    x - (container.getBoundingClientRect().left + window.pageXOffset);
  const top = y - (container.getBoundingClientRect().top + window.pageYOffset);

  if (direction === "vertical") {
    let h;
    if (top < 0) {
      h = 359;
    } else if (top > containerHeight) {
      h = 0;
    } else {
      const percent = -((top * 100) / containerHeight) + 100;
      h = (360 * percent) / 100;
    }

    if (hsl.h !== h) {
      return {
        h,
        s: hsl.s,
        l: hsl.l,
        a: hsl.a,
        source: "hsl",
      };
    }
  } else {
    let h;
    if (left < 0) {
      h = 0;
    } else if (left > containerWidth) {
      h = 359;
    } else {
      const percent = (left * 100) / containerWidth;
      h = (360 * percent) / 100;
    }

    if (hsl.h !== h) {
      return {
        h,
        s: hsl.s,
        l: hsl.l,
        a: hsl.a,
        source: "hsl",
      };
    }
  }
  return null;
};

export function calculateSaturationChange(
  e: any,
  hsl: HslColor,
  container: HTMLDivElement,
) {
  const { width: containerWidth, height: containerHeight } =
    container.getBoundingClientRect();
  const x = typeof e.pageX === "number" ? e.pageX : e.touches[0].pageX;
  const y = typeof e.pageY === "number" ? e.pageY : e.touches[0].pageY;
  let left = x - (container.getBoundingClientRect().left + window.pageXOffset);
  let top = y - (container.getBoundingClientRect().top + window.pageYOffset);

  if (left < 0) {
    left = 0;
  } else if (left > containerWidth) {
    left = containerWidth;
  }

  if (top < 0) {
    top = 0;
  } else if (top > containerHeight) {
    top = containerHeight;
  }

  const saturation = left / containerWidth;
  const bright = 1 - top / containerHeight;

  return {
    h: hsl.h,
    s: saturation,
    v: bright,
    a: hsl.a,
    source: "hsv",
  };
}

export const Alpha = (_props: AlphaProps) => {
  const props = mergeProps(
    {
      direction: "horizontal",
      styles: {},
    },
    _props,
  );
  let container: HTMLDivElement;

  const styles = () => {
    const { rgb } = props;
    return merge<
      Record<string, JSX.CSSProperties>,
      Record<string, JSX.CSSProperties>
    >(
      {
        alpha: {
          position: "absolute",
          inset: "0px",
          "border-radius": props.radius,
          border: "solid 1px hsl(var(--accent))",
        },
        checkboard: {
          position: "absolute",
          inset: "0px",
          overflow: "hidden",
          "border-radius": props.radius,
        },
        gradient: {
          position: "absolute",
          inset: "0px",
          background:
            props.direction === "vertical"
              ? `linear-gradient(to bottom, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%,
          rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)`
              : `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%,
         rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)`,
          "box-shadow": props.shadow,
          "border-radius": props.radius,
        },
        container: {
          position: "relative",
          height: "100%",
          margin: "0 3px",
        },
        pointer: {
          position: "absolute",
          left: props.direction === "vertical" ? 0 : `${rgb.a && rgb.a * 100}%`,
          top:
            props.direction === "vertical"
              ? `${rgb.a && rgb.a * 100}%`
              : undefined,
        },
        slider: {
          width: "4px",
          "border-radius": "1px",
          height: "8px",
          "box-shadow": "0 0 2px rgba(0, 0, 0, .6)",
          background: "#ABAB",
          "margin-top": "1px",
          transform: "translateX(-2px)",
        },
      },
      props.styles,
    );
  };

  const handleChange = (e: Event) => {
    const change = calculateAlphaChange(
      e,
      props.hsl,
      props.direction,
      props.a,
      container,
    );
    change && typeof props.onChange === "function" && props.onChange(change, e);
  };

  const handleMouseDown = (e: Event) => {
    handleChange(e);
    window.addEventListener("mousemove", handleChange);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseUp = () => {
    unbindEventListeners();
  };

  const unbindEventListeners = () => {
    window.removeEventListener("mousemove", handleChange);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  onCleanup(() => unbindEventListeners());

  return (
    <div style={styles().alpha}>
      <div style={styles().checkboard}>
        <Checkboard renderers={props.renderers} />
      </div>
      <div style={styles().gradient} />
      <div
        style={styles().container}
        ref={container!}
        onMouseDown={handleMouseDown}
        onMouseUp={handleChange}
        onTouchMove={handleChange}
        onTouchStart={handleChange}
      >
        <div style={styles().pointer}>
          {props.pointer ? (
            <props.pointer {...props} />
          ) : (
            <div style={styles().slider} />
          )}
        </div>
      </div>
    </div>
  );
};

export function Checkboard(_props: CheckboardProps) {
  const props = mergeProps(
    {
      white: "transparent",
      grey: "rgba(0,0,0,.08)",
      size: 8,
      renderers: {},
    },
    _props,
  );

  const styles = () => {
    const { size, white, grey, borderRadius, boxShadow, renderers } = props;
    return {
      grid: {
        "border-radius": borderRadius,
        "box-shadow": boxShadow,
        position: "absolute",
        inset: "0px",
        background: `url(${get(white, grey, size, renderers.canvas)}) center left`,
      } as JSX.CSSProperties,
    };
  };

  return props.children ? (
    <div style={styles().grid}>{props.children}</div>
  ) : (
    <div style={styles().grid} />
  );
}

export function ColorPickerProvider(_props: ColorPickerProps) {
  const props = mergeProps(
    { defaultColor: { h: 250, s: 0.5, l: 0.2, a: 1 } },
    _props,
  );

  const [colors, setColors] = createSignal<ColorResult>({
    ...toState(props.color ?? props.defaultColor, 0),
  });

  createEffect(() => {
    if (props.color) {
      setColors({ ...toState(props.color, 0) });
    }
  });

  const handler = (fn: any, data: any, event: any) => fn(data, event);
  const debouncedChangeHandler = createMemo(() => debounce(handler, 100), []);

  const changeColor = (newColor: ChangeColor, event?: Event) => {
    const isValidColor = simpleCheckForValidColor(newColor);
    if (isValidColor) {
      const newColors = toState(
        newColor,
        (typeof newColor !== "string" && "h" in newColor
          ? newColor.h
          : undefined) || colors().oldHue,
      );

      setColors(newColors);

      props.onChangeComplete &&
        debouncedChangeHandler()(props.onChangeComplete, newColors, event);
      props.onChange && props.onChange(newColors, event);
    }
  };

  const handleSwatchHover = (data: ChangeColor, event: Event) => {
    const isValidColor = simpleCheckForValidColor(data);
    if (isValidColor) {
      const newColors = toState(
        data,
        (typeof data !== "string" && "h" in data ? data.h : undefined) ||
          colors().oldHue,
      );
      props.onSwatchHover && props.onSwatchHover(newColors, event);
    }
  };

  const store = {
    colors,
    changeColor,
    onSwatchHover: props.onSwatchHover ? handleSwatchHover : undefined,
  };

  return (
    <ColorPickerContext.Provider value={store}>
      {props.children}
    </ColorPickerContext.Provider>
  );
}

export function Hue(_props: HueProps) {
  const props = mergeProps(
    {
      direction: "horizontal",
    },
    _props,
  );

  let container: HTMLDivElement;

  const styles = () => {
    return {
      hue: {
        position: "absolute",
        inset: "0px",
        border: "solid 1px hsl(var(--accent))",
        "border-radius":
          typeof props.radius === "string" ? props.radius : `${props.radius}px`,
        "box-shadow": props.shadow,
      },
      container: {
        padding: "0 2px",
        position: "relative",
        height: "100%",
        "border-radius":
          typeof props.radius === "string" ? props.radius : `${props.radius}px`,
      },
      pointer: {
        position: "absolute",
        left:
          props.direction === "vertical"
            ? "0px"
            : `${(props.hsl.h * 100) / 360}%`,
        top:
          props.direction === "vertical"
            ? `${-((props.hsl.h * 100) / 360) + 100}%`
            : undefined,
      },
      slider: {
        "margin-top": "1px",
        width: "4px",
        "border-radius": "1px",
        height: "8px",
        "box-shadow": "0 0 2px rgba(0, 0, 0, .6)",
        border: "solid 1px white",
        transform: "translateX(-2px)",
      },
    } as Record<string, JSX.CSSProperties>;
  };

  const handleChange = (e: MouseEvent) => {
    const change = calculateHueChange(e, props.direction, props.hsl, container);
    change && typeof props.onChange === "function" && props.onChange(change, e);
  };

  const unbindEventListeners = () => {
    window.removeEventListener("mousemove", handleChange);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseUp = () => {
    unbindEventListeners();
  };

  const handleMouseDown = (e: MouseEvent) => {
    handleChange(e);
    window.addEventListener("mousemove", handleChange);
    window.addEventListener("mouseup", handleMouseUp);
  };

  onCleanup(() => unbindEventListeners());

  return (
    <div style={styles().hue}>
      <div
        ref={container!}
        class={`hue-${props.direction}`}
        style={styles().container}
        onMouseDown={handleMouseDown}
      >
        <style>{`
          .hue-horizontal {
            background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0
              33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            background: -webkit-linear-gradient(to right, #f00 0%, #ff0
              17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
          }
          .hue-vertical {
            background: linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%,
              #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            background: -webkit-linear-gradient(to top, #f00 0%, #ff0 17%,
              #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
          }
        `}</style>
        <div style={styles().pointer}>
          {props.pointer ? (
            <props.pointer {...props} />
          ) : (
            <div style={styles().slider} />
          )}
        </div>
      </div>
    </div>
  );
}

export function Saturation(_props: SaturationProps) {
  const props = mergeProps({ styles: {} }, _props);
  let container: HTMLDivElement;

  createEffect(() => {
    return () => {
      unbindEventListeners();
    };
  }, []);

  function handleChange(event: MouseEvent | TouchEvent) {
    if (props.onChange) {
      props.onChange(
        calculateSaturationChange(event, props.hsl, container),
        event as any,
      );
    }
  }

  function handleMouseDown(event: MouseEvent) {
    handleChange(event);

    if (container) {
      container.addEventListener("mousemove", handleChange);
      container.addEventListener("mouseup", handleMouseUp);
    }
  }

  function handleMouseUp() {
    unbindEventListeners();
  }

  function unbindEventListeners() {
    if (container) {
      container.removeEventListener("mousemove", handleChange);
      container.removeEventListener("mouseup", handleMouseUp);
    }
  }

  const styles = () => {
    const { hsv, hsl, shadow, radius, styles } = props;
    return merge<
      Record<string, JSX.CSSProperties>,
      Record<string, JSX.CSSProperties>
    >(
      {
        color: {
          position: "absolute",
          inset: "0px",
          background: `hsl(${hsl.h},100%, 50%)`,
          "border-radius": radius,
        },
        white: {
          position: "absolute",
          inset: "0px",
          "border-radius": radius,
        },
        black: {
          position: "absolute",
          inset: "0px",
          boxShadow: shadow,
          "border-radius": radius,
        },
        pointer: {
          position: "absolute",
          top: `${-(hsv.v * 100) + 100}%`,
          left: `${hsv.s * 100}%`,
          cursor: "default",
        },
        circle: {
          width: "4px",
          height: "4px",
          "box-shadow": `0 0 0 1.5px #fff, inset 0 0 1px 1px rgba(0,0,0,.3),
            0 0 1px 2px rgba(0,0,0,.4)`,
          "border-radius": "50%",
          cursor: "hand",
          transform: "translate(-2px, -2px)",
        },
      },
      styles,
    );
  };

  return (
    <div
      style={styles().color}
      ref={container!}
      onMouseDown={handleMouseDown}
      onTouchMove={handleChange}
      onTouchStart={handleChange}
    >
      <style>{`
          .saturation-white {
            background: -webkit-linear-gradient(to right, #fff, rgba(255,255,255,0));
            background: linear-gradient(to right, #fff, rgba(255,255,255,0));
          }
          .saturation-black {
            background: -webkit-linear-gradient(to top, #000, rgba(0,0,0,0));
            background: linear-gradient(to top, #000, rgba(0,0,0,0));
          }
        `}</style>
      <div style={styles().white} class='saturation-white'>
        <div style={styles().black} class='saturation-black' />
        <div style={styles().pointer}>
          {props.pointer ? props.pointer : <div style={styles().circle} />}
        </div>
      </div>
    </div>
  );
}

export function UnfoldMoreHorizontalIcon(_props: IconProps) {
  const props = mergeProps(
    {
      width: 24,
      height: 24,
    },
    _props,
  );
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      width={`${props.width}px`}
      height={`${props.height}px`}
      stroke-width='0.5'
      style={{
        "border-radius": "5px",
        fill: "hsl(var(--accent-foreground))",
      }}
      onMouseOver={props.onMouseOver}
      onMouseEnter={props.onMouseEnter}
      onMouseOut={props.onMouseOut}
    >
      <path d='M12,18.17L8.83,15L7.42,16.41L12,21L16.59,16.41L15.17,15M12,5.83L15.17,9L16.58,7.59L12,3L7.41,7.59L8.83,9L12,5.83Z' />
    </svg>
  );
}

function ChromeFields(_props: Props) {
  const props = mergeProps({ view: "hex" }, _props);
  const [view, setView] = createSignal(props.view);

  createEffect(() => {
    if (props.hsl.a !== 1 && view() === "hex") {
      setView("rgb");
    }
  }, []);

  createEffect(() => {
    if (props.hsl.a !== 1 && view() === "hex") {
      setView("rgb");
    }
  }, [props]);

  function toggleViews() {
    if (view() === "hex") {
      setView("rgb");
    } else if (view() === "rgb") {
      setView("hsl");
    } else if (view() === "hsl") {
      if (props.hsl.a === 1) {
        setView("hex");
      } else {
        setView("rgb");
      }
    }
  }

  function handleChange(data: any, e: Event) {
    if (data.hex) {
      isValidHex(data.hex) &&
        props.onChange(
          {
            hex: data.hex,
            source: "hex",
          },
          e,
        );
    } else if (data.r || data.g || data.b) {
      props.onChange(
        {
          r: data.r || props.rgb.r,
          g: data.g || props.rgb.g,
          b: data.b || props.rgb.b,
          source: "rgb",
        },
        e,
      );
    } else if (data.a) {
      if (data.a < 0) {
        data.a = 0;
      } else if (data.a > 1) {
        data.a = 1;
      }

      props.onChange(
        {
          h: props.hsl.h,
          s: props.hsl.s,
          l: props.hsl.l,
          a: Math.round(data.a * 100) / 100,
          source: "rgb",
        },
        e,
      );
    } else if (data.h || data.s || data.l) {
      if (typeof data.s === "string" && data.s.includes("%")) {
        data.s = data.s.replace("%", "");
      }
      if (typeof data.l === "string" && data.l.includes("%")) {
        data.l = data.l.replace("%", "");
      }

      if (data.s === 1) {
        data.s = 0.01;
      } else if (data.l === 1) {
        data.l = 0.01;
      }

      props.onChange(
        {
          h: data.h || props.hsl.h,
          s: Number(data.s !== undefined ? data.s : props.hsl.s),
          l: Number(data.l !== undefined ? data.l : props.hsl.l),
          source: "hsl",
        },
        e,
      );
    }
  }

  function showHighlight(e: MouseEvent) {
    (e.currentTarget as HTMLDivElement).style.backgroundColor =
      "hsl(var(--accent))";
  }

  function hideHighlight(e: MouseEvent) {
    (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
  }
  const styles = () => {
    return {
      wrap: {
        "padding-top": "16px",
        display: "flex",
      },
      fields: {
        flex: "1",
        display: "flex",
        "margin-left": "-6px",
      },
      field: {
        "padding-left": "6px",
        width: "100%",
      },
      alpha: {
        "padding-left": "6px",
        width: "100%",
        display: props.disableAlpha ? "none" : undefined,
      },
      toggle: {
        width: "32px",
        "text-align": "right",
        position: "relative",
        display: "flex",
        "margin-top": "2px",
        "justify-content": "center",
        "align-items": "start",
      },
      icon: {
        "margin-left": "3px",
        cursor: "pointer",
        "border-radius": "25%",
        position: "relative",
      },
      iconHighlight: {
        position: "absolute",
        width: "24px",
        height: "28px",
        "border-radius": "4px",
        top: "10px",
        left: "12px",
        display: "none",
      },
      input: {
        "font-size": "11px",
        width: "100%",
        "border-radius": "2px",
        border: "none",
        "box-shadow": "inset 0 0 0 1px #dadada",
        height: "21px",
        "text-align": "center",
        color: "hsl(var(--primary-foreground))",
        background: "hsl(var(--accent-foreground))",
      },
      label: {
        "text-transform": "uppercase",
        "font-size": "11px",
        "line-height": "11px",
        color: "hsl(var(--secondary-foreground))",
        "text-align": "center",
        display: "block",
        "margin-top": "12px",
      },
      svg: {
        fill: "#333",
        width: "24px",
        height: "24px",
        border: "1px solid",
        "border-radius": "5px",
      },
    } as Record<string, JSX.CSSProperties>;
  };

  return (
    <div style={styles().wrap} class='flexbox-fix'>
      <Show when={view() === "hex"}>
        <div style={styles().fields} class='flexbox-fix'>
          <div style={styles().field}>
            <EditableInput
              styles={{ input: styles().input, label: styles().label }}
              label='hex'
              value={props.hex}
              onChange={handleChange}
            />
          </div>
        </div>
      </Show>
      <Show when={view() === "rgb"}>
        <div style={styles().fields} class='flexbox-fix'>
          <div style={styles().field}>
            <EditableInput
              styles={{ input: styles().input, label: styles().label }}
              label='r'
              value={props.rgb.r}
              onChange={handleChange}
            />
          </div>
          <div style={styles().field}>
            <EditableInput
              styles={{ input: styles().input, label: styles().label }}
              label='g'
              value={props.rgb.g}
              onChange={handleChange}
            />
          </div>
          <div style={styles().field}>
            <EditableInput
              styles={{ input: styles().input, label: styles().label }}
              label='b'
              value={props.rgb.b}
              onChange={handleChange}
            />
          </div>
          <div style={styles().alpha}>
            <EditableInput
              styles={{ input: styles().input, label: styles().label }}
              label='a'
              value={props.rgb.a}
              arrowOffset={0.01}
              onChange={handleChange}
            />
          </div>
        </div>
      </Show>
      <Show when={view() === "hsl"}>
        <div style={styles().fields} class='flexbox-fix'>
          <div style={styles().field}>
            <EditableInput
              styles={{ input: styles().input, label: styles().label }}
              label='h'
              value={Math.round(props.hsl.h)}
              onChange={handleChange}
            />
          </div>
          <div style={styles().field}>
            <EditableInput
              styles={{ input: styles().input, label: styles().label }}
              label='s'
              value={`${Math.round(props.hsl.s * 100)}%`}
              onChange={handleChange}
            />
          </div>
          <div style={styles().field}>
            <EditableInput
              styles={{ input: styles().input, label: styles().label }}
              label='l'
              value={`${Math.round(props.hsl.l * 100)}%`}
              onChange={handleChange}
            />
          </div>
          <div style={styles().alpha}>
            <EditableInput
              styles={{ input: styles().input, label: styles().label }}
              label='a'
              value={props.hsl.a}
              arrowOffset={0.01}
              onChange={handleChange}
            />
          </div>
        </div>
      </Show>
      <div style={styles().toggle}>
        <div style={styles().icon} onClick={toggleViews}>
          <UnfoldMoreHorizontalIcon
            width='24'
            height='24'
            onMouseOver={showHighlight}
            onMouseEnter={showHighlight}
            onMouseOut={hideHighlight}
          />
        </div>
      </div>
    </div>
  );
}

export function EditableInput(_props: EditableInputProps) {
  const props = mergeProps(
    {
      arrowOffset: 1,
      hideLabel: false,
    },
    _props,
  );

  let inputRef: HTMLInputElement;

  const inputId = `sc-editable-input-${Math.random().toString().slice(2, 5)}`;

  const [state, setState] = createSignal<EditableInputState>({
    value: String(props.value).toUpperCase(),
    blurValue: String(props.value).toUpperCase(),
  });

  const DEFAULT_ARROW_OFFSET = 1;
  const UP_KEY_CODE = 38;
  const DOWN_KEY_CODE = 40;
  const VALID_KEY_CODES = [UP_KEY_CODE, DOWN_KEY_CODE];
  const isValidKeyCode = (keyCode: number) =>
    VALID_KEY_CODES.indexOf(keyCode) > -1;
  const getNumberValue = (value: string) =>
    Number(String(value).replace(/%/g, ""));

  const getValueObjectWithLabel = (value: string) => {
    return {
      [props.label!]: value,
    };
  };

  const setUpdatedValue = (value: any, e: Event) => {
    const onChangeValue = props.label ? getValueObjectWithLabel(value) : value;
    props.onChange && props.onChange(onChangeValue, e);
    setState({ value, blurValue: value });
  };

  const handleBlur = () => {
    if (state().blurValue) {
      setState({ value: state().blurValue, blurValue: "" });
    }
  };

  const handleChange = (e: Event) => {
    setUpdatedValue((e.target as HTMLInputElement).value, e);
  };

  const handleDrag = (e: MouseEvent) => {
    if (props.dragLabel) {
      const newValue = Math.round(+props.value! + e.movementX);
      if (newValue >= 0 && newValue <= props.dragMax!) {
        props.onChange(getValueObjectWithLabel(String(newValue)), e);
      }
    }
  };

  const unbindEventListeners = () => {
    window.removeEventListener("mousemove", handleDrag);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseUp = () => {
    unbindEventListeners();
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (props.dragLabel) {
      e.preventDefault();
      handleDrag(e);
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleMouseUp);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const value = getNumberValue((e.target as HTMLInputElement).value);
    if (!Number.isNaN(value) && isValidKeyCode(e.keyCode)) {
      const offset = props.arrowOffset || DEFAULT_ARROW_OFFSET;
      const updatedValue =
        e.keyCode === UP_KEY_CODE ? value + offset : value - offset;
      setUpdatedValue(updatedValue, e);
    }
  };

  createEffect(() => {
    setState({
      value: String(props.value).toUpperCase(),
      blurValue: "",
    });
  });

  const styles = () => {
    return merge<
      Record<string, JSX.CSSProperties>,
      Record<string, JSX.CSSProperties>
    >(
      {
        wrap: {
          position: "relative",
        },
      },
      props.styles,
    );
  };

  onCleanup(() => unbindEventListeners());

  return (
    <div style={styles().wrap}>
      <input
        id={inputId}
        ref={inputRef!}
        style={styles().input}
        spellcheck={false}
        value={state().value}
        placeholder={props.placeholder}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onInput={handleChange}
      />
      <Show when={props.label && !props.hideLabel}>
        <label style={styles().label} onMouseDown={handleMouseDown}>
          {props.label}
        </label>
      </Show>
    </div>
  );
}

export const Chrome = (_props: ChromePickerProps) => {
  const props = mergeProps(
    {
      width: 225,
      disableAlpha: false,
      styles: {},
      className: "",
    },
    _props,
  );
  const { colors, changeColor } = useColorPicker();

  const styles = () => {
    const width =
      typeof props.width === "number" ? `${props.width}px` : props.width;
    return merge<
      Record<string, JSX.CSSProperties>,
      Record<string, JSX.CSSProperties>
    >(
      {
        picker: {
          width,
          background: "#fff",
          "border-radius": "2px",
          "box-shadow": "0 0 2px rgba(0,0,0,.3), 0 4px 8px rgba(0,0,0,.3)",
          "box-sizing": "initial",
        },
        saturation: {
          width: "100%",
          "padding-bottom": "55%",
          position: "relative",
          "border-radius": "2px 2px 0 0",
          overflow: "hidden",
        },
        Saturation: {
          "border-radius": "2px 2px 0 0",
        },
        body: {
          padding: "16px 16px 12px",
          background: "hsl(var(--muted))",
        },
        controls: {
          display: "flex",
        },
        color: {
          width: props.disableAlpha ? "22px" : "32px",
        },
        swatch: {
          "margin-top": props.disableAlpha ? "0px" : "6px",
          width: props.disableAlpha ? "10px" : "16px",
          height: props.disableAlpha ? "10px" : "16px",
          "border-radius": "8px",
          position: "relative",
          overflow: "hidden",
        },
        active: {
          position: "absolute",
          inset: "0px",
          "border-radius": "8px",
          "box-shadow": "inset 0 0 0 1px rgba(0,0,0,.1)",
          background: `rgba(${colors().rgb.r}, ${colors().rgb.g}, ${colors().rgb.b}, ${
            colors().rgb.a
          })`,
          border: "1px solid hsl(var(--accent))",
          "z-index": 2,
        },
        toggles: {
          flex: "1",
        },
        hue: {
          height: "10px",
          position: "relative",
          "margin-bottom": props.disableAlpha ? "0px" : "8px",
        },
        Hue: {
          "border-radius": "2px",
        },
        alpha: {
          height: "10px",
          position: "relative",
          display: props.disableAlpha ? "none" : undefined,
        },
        Alpha: {
          "border-radius": "2px",
        },
      },
      props.styles,
    );
  };

  return (
    <div style={styles().picker} class={`chrome-picker ${props.className}`}>
      <div style={styles().saturation}>
        <Saturation
          styles={styles().Saturation}
          hsl={colors().hsl}
          hsv={colors().hsv}
          pointer={<ChromePointerCircle />}
          onChange={changeColor}
        />
      </div>
      <div style={styles().body}>
        <div style={styles().controls} class='flexbox-fix'>
          <div style={styles().color}>
            <div style={styles().swatch}>
              <div style={styles().active} />
              <Checkboard renderers={props.renderers} />
            </div>
          </div>
          <div style={styles().toggles}>
            <div style={styles().hue}>
              <Hue
                styles={styles().Hue}
                hsl={colors().hsl}
                pointer={ChromePointer}
                onChange={changeColor}
              />
            </div>
            <div style={styles().alpha}>
              <Alpha
                direction='horizontal'
                styles={styles().Alpha}
                rgb={colors().rgb}
                hsl={colors().hsl}
                pointer={ChromePointer}
                renderers={props.renderers}
                onChange={changeColor}
              />
            </div>
          </div>
        </div>
        <ChromeFields
          rgb={colors().rgb}
          hsl={colors().hsl}
          hex={colors().hex}
          view={props.defaultView}
          onChange={changeColor}
        />
      </div>
    </div>
  );
};

function ChromePointerCircle() {
  return (
    <div
      style={{
        width: "12px",
        height: "12px",
        "border-radius": "6px",
        "box-shadow": "inset 0 0 0 1px #fff",
        transform: "translate(-6px, -6px)",
      }}
    />
  );
}

function ChromePointer() {
  return (
    <div
      style={{
        width: "12px",
        height: "12px",
        "border-radius": "6px",
        transform: "translate(-6px, -1px)",
        "background-color": "rgb(248, 248, 248)",
        "box-shadow": "0 1px 4px 0 rgba(0, 0, 0, 0.37)",
      }}
    />
  );
}

export function useColorPicker() {
  return useContext(ColorPickerContext as Context<ColorPickerContextType>);
}

export function withColorPicker<T extends object>(
  Component: (props: T) => JSX.Element,
) {
  return (props: T & Omit<ColorPickerProps, "children">) => (
    <ColorPickerProvider {...props}>
      <Component {...props} />
    </ColorPickerProvider>
  );
}

export const ColorPickerContext = createContext<
  ColorPickerContextType | undefined
>(undefined);

export default withColorPicker(Chrome);

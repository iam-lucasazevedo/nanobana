import React, { useState, useEffect } from 'react';

export interface StyleOptions {
  size: string;
  style: string;
  aspectRatio: string;
}

export interface GenerationOptions {
  sizes: string[];
  styles: string[];
  aspectRatios: string[];
}

interface StyleSelectorProps {
  options: GenerationOptions;
  initialValues?: StyleOptions;
  onChange: (options: StyleOptions) => void;
  disabled?: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  options,
  initialValues,
  onChange,
  disabled = false
}) => {
  const [size, setSize] = useState(initialValues?.size || '1024x768');
  const [style, setStyle] = useState(initialValues?.style || 'default');
  const [aspectRatio, setAspectRatio] = useState(
    initialValues?.aspectRatio || '16:9'
  );

  // Notify parent of changes
  useEffect(() => {
    onChange({ size, style, aspectRatio });
  }, [size, style, aspectRatio, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size
        </label>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
        >
          {options.sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Style
        </label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
        >
          {options.styles.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Aspect Ratio
        </label>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
        >
          {options.aspectRatios.map((ar) => (
            <option key={ar} value={ar}>
              {ar}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

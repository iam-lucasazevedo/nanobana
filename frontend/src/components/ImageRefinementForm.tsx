import React, { useState } from 'react';

export interface RefinementFormData {
  refinementPrompt: string;
  style?: string;
  aspectRatio?: string;
}

interface ImageRefinementFormProps {
  onSubmit: (data: RefinementFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  styleOptions?: Array<{ value: string; label: string }>;
  aspectRatioOptions?: Array<{ value: string; label: string }>;
  initialData?: Partial<RefinementFormData>;
}

export const ImageRefinementForm: React.FC<ImageRefinementFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  styleOptions = [
    { value: 'default', label: 'Default' },
    { value: 'modern', label: 'Modern' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'photorealistic', label: 'Photorealistic' }
  ],
  aspectRatioOptions = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' }
  ],
  initialData = {}
}) => {
  const [formData, setFormData] = useState<RefinementFormData>({
    refinementPrompt: initialData.refinementPrompt || '',
    style: initialData.style || 'default',
    aspectRatio: initialData.aspectRatio || '16:9'
  });

  const isPromptValid = formData.refinementPrompt.trim().length > 0 && formData.refinementPrompt.length <= 1000;
  const isFormValid = isPromptValid && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit(formData);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      refinementPrompt: e.target.value
    }));
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      style: e.target.value
    }));
  };

  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      aspectRatio: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium">Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Refinement Prompt */}
      <div>
        <label htmlFor="refinement-prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Refinement Prompt
        </label>
        <textarea
          id="refinement-prompt"
          value={formData.refinementPrompt}
          onChange={handlePromptChange}
          disabled={loading}
          placeholder="Describe how you want to refine this image (e.g., 'make the colors more vibrant', 'add more details')"
          maxLength={1000}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            {isPromptValid ? (
              <span className="text-green-600">✓ Valid prompt</span>
            ) : formData.refinementPrompt.length > 1000 ? (
              <span className="text-red-600">Prompt too long</span>
            ) : (
              <span>Enter a refinement prompt</span>
            )}
          </span>
          <span className="text-xs text-gray-500">
            {formData.refinementPrompt.length}/1000
          </span>
        </div>
      </div>

      {/* Style Selector */}
      <div>
        <label htmlFor="refinement-style" className="block text-sm font-medium text-gray-700 mb-2">
          Style (Optional)
        </label>
        <select
          id="refinement-style"
          value={formData.style || 'default'}
          onChange={handleStyleChange}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        >
          {styleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Aspect Ratio Selector */}
      <div>
        <label htmlFor="refinement-aspect-ratio" className="block text-sm font-medium text-gray-700 mb-2">
          Aspect Ratio (Optional)
        </label>
        <select
          id="refinement-aspect-ratio"
          value={formData.aspectRatio || '16:9'}
          onChange={handleAspectRatioChange}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        >
          {aspectRatioOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!isFormValid}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'Refining...' : 'Refine Image'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
